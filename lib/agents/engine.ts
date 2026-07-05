import 'server-only'

import type { AgentDefinition, AgentStatus } from '@/types'
import { generateResearch, generateContentDrafts, generateVideoScripts, generateLeads, generateOutreach, checkBrandSafety } from '@/lib/ai/generate'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { extractBrandThemeFromUrl, isValidCompanyUrl } from '@/lib/ai/brand-theme'
import { normalizeCustomPromptDetails, platformsFromPromptHint } from '@/lib/ai/prompt-utils'
import { hasTextAI, withAI } from '@/lib/ai/layer'
import { assignedModelLabel, resolveTaskModel, AGENT_TASK_MAP } from '@/lib/models/routing'
import { runTraeSoloTopicGeneration } from '@/lib/trae/solo'
import { publishToPlatform } from '@/lib/publishers/publish'
import {
  getWorkspace,
  patchWorkspace,
  updateAgent,
  upsertTask,
  scheduleFromDrafts,
  computeDynamicROI,
} from '@/lib/workspace/store'
import { resolveWorkspaceContext, type WorkspaceContext } from '@/lib/workspace/context'
import { demoAgents } from '@/lib/demo/data'

const taskId = (agentId: string) => `task-${agentId}-${Date.now().toString(36)}`

async function setAgentRunning(ctx: WorkspaceContext, agentId: string, taskName: string, routing?: import('@/types').ModelRouting[]): Promise<void> {
  await updateAgent(agentId, {
    status: 'running',
    progress: 10,
    currentTask: taskName,
    assignedModel: assignedModelLabel(agentId, routing),
  }, ctx)
}

async function setAgentDone(ctx: WorkspaceContext, agentId: string, lastOutput: string, confidence = 90): Promise<void> {
  await updateAgent(
    agentId,
    {
      status: 'completed',
      progress: 100,
      confidence,
      lastOutput,
    },
    ctx,
  )
}

async function setAgentFailed(ctx: WorkspaceContext, agentId: string, message: string): Promise<void> {
  await updateAgent(agentId, { status: 'failed', progress: 0, lastOutput: message }, ctx)
}

async function recordTask(
  ctx: WorkspaceContext,
  agentName: string,
  name: string,
  status: AgentStatus,
  preview: string,
  timeSaved: string,
): Promise<void> {
  await upsertTask(
    {
      id: taskId(agentName),
      name,
      assignedAgent: agentName,
      priority: 'high',
      status,
      createdAt: new Date().toISOString(),
      estimatedTimeSaved: timeSaved,
      outputPreview: preview.slice(0, 120),
    },
    ctx,
  )
}

export async function runAgentTask(
  agentId: string,
  options?: { customPromptDetails?: string; allowAnonymous?: boolean; url?: string },
): Promise<{ agent: AgentDefinition; live: boolean }> {
  const ctx = await resolveWorkspaceContext({ allowAnonymous: options?.allowAnonymous })
  const ws = await getWorkspace(ctx)
  const agent = ws.agents.find((a) => a.id === agentId)
  if (!agent) throw new Error(`Agent ${agentId} not found`)

  const campaign = ws.campaign
  const customPromptDetails = normalizeCustomPromptDetails(
    options?.customPromptDetails ?? ws.customPromptDetails,
  )
  const routing = ws.modelRouting
  const modelFor = (agentId: string) => {
    const task = AGENT_TASK_MAP[agentId]
    return task ? resolveTaskModel(task, routing) : undefined
  }
  let live = false
  const dataSignals = mergeCrustdataSignals({}, ws.brandProfile, ws.research, campaign)

  try {
    switch (agentId) {
      case 'research': {
        await setAgentRunning(ctx, agentId, 'Market & competitor analysis', routing)
        const { result, live: aiLive } = await withAI(() =>
          generateResearch({
            industry: campaign.industry,
            targetCustomer: campaign.targetAudience,
            region: campaign.region,
            offer: campaign.mainOffer,
            customPromptDetails,
            brandProfile: ws.brandProfile,
            research: ws.research,
            signals: dataSignals,
            modelConfig: modelFor(agentId),
          }),
        )
        live = aiLive
        await patchWorkspace({ research: result }, ctx)
        await setAgentDone(ctx, agentId, `${result.painPoints.length} pain points, score ${result.opportunityScore}/100`, 94)
        await recordTask(ctx, agent.name, 'Market research run', 'completed', result.marketSummary, '2.5 hrs')
        break
      }
      case 'strategy': {
        await setAgentRunning(ctx, agentId, 'Topic & content strategy', routing)
        const result = await runTraeSoloTopicGeneration({
          title: `${campaign.companyName} Strategy`,
          goal: campaign.campaignGoal,
          keyPoints: ws.research?.painPoints.slice(0, 4) ?? ['Manual workflows', 'Lead generation'],
          baseContent: `${campaign.productService}. ${campaign.mainOffer}`,
          targetAudience: campaign.targetAudience,
          tone: campaign.tone,
          platforms: campaign.platforms,
          topicCount: 8,
          customPromptDetails,
          modelConfig: modelFor(agentId),
          research: ws.research,
          signals: dataSignals,
        })
        live = true
        await patchWorkspace({ topics: result.topics }, ctx)
        await setAgentDone(ctx, agentId, `${result.topics.length} topics across ${result.contentPillars.length} pillars`, 91)
        await recordTask(ctx, agent.name, 'Content pillar map', 'completed', result.summary, '1.8 hrs')
        break
      }
      case 'content': {
        await setAgentRunning(ctx, agentId, 'Social post generation', routing)
        const topic =
          ws.topics[0]?.title ??
          ws.research?.highIntentTopics?.[0] ??
          campaign.mainOffer ??
          campaign.campaignGoal
        const platforms = platformsFromPromptHint(customPromptDetails, campaign.platforms)
        const { result, live: aiLive } = await withAI(() =>
          generateContentDrafts({
            platforms,
            topic,
            campaignId: campaign.id,
            customPromptDetails,
            brandProfile: ws.brandProfile,
            research: ws.research,
            signals: mergeCrustdataSignals({ topic }, ws.brandProfile, ws.research, campaign),
            modelConfig: modelFor(agentId),
          }),
        )
        live = aiLive
        await patchWorkspace({ contentDrafts: result }, ctx)
        await setAgentDone(
          ctx,
          agentId,
          `${result.length} post${result.length === 1 ? '' : 's'} drafted for ${[...new Set(result.map((d) => d.platform))].join(', ')}`,
          88,
        )
        await recordTask(ctx, agent.name, 'Content batch', 'completed', result[0]?.hook ?? 'Posts generated', '3.2 hrs')
        break
      }
      case 'brandtheme': {
        await setAgentRunning(ctx, agentId, 'Extracting brand theme from URL', routing)
        const urlCandidate =
          options?.url?.trim() ||
          (customPromptDetails && isValidCompanyUrl(customPromptDetails) ? customPromptDetails : '') ||
          (campaign.companyName ? `https://${campaign.companyName.toLowerCase().replace(/\s+/g, '')}.com` : '')

        if (!urlCandidate || !isValidCompanyUrl(urlCandidate)) {
          throw new Error('Provide a company URL in custom instructions or run with url parameter')
        }

        const theme = await extractBrandThemeFromUrl(urlCandidate, modelFor(agentId))
        live = hasTextAI()
        const collection = [theme, ...(ws.brandProfile.themeCollection ?? [])].slice(0, 20)
        await patchWorkspace(
          {
            brandProfile: {
              ...ws.brandProfile,
              themeCollection: collection,
              activeThemeId: theme.id,
              brandName: ws.brandProfile.brandName || theme.companyName,
            },
          },
          ctx,
        )
        await setAgentDone(
          ctx,
          agentId,
          `${theme.companyName}: ${theme.colors.length} colors — ${theme.visualStyle}`,
          92,
        )
        await recordTask(
          ctx,
          agent.name,
          'Brand theme extraction',
          'completed',
          `${theme.companyName} palette extracted`,
          '0.4 hrs',
        )
        break
      }
      case 'video': {
        await setAgentRunning(ctx, agentId, 'Short-form video scripts', routing)
        const topic = ws.topics[0]?.title
        const { result, live: aiLive } = await withAI(() =>
          generateVideoScripts({
            topic,
            count: 3,
            customPromptDetails,
            brandProfile: ws.brandProfile,
            research: ws.research,
            signals: mergeCrustdataSignals({ topic }, ws.brandProfile, ws.research, campaign),
            modelConfig: modelFor(agentId),
          }),
        )
        live = aiLive
        await patchWorkspace({ videoScripts: result }, ctx)
        await setAgentDone(ctx, agentId, `${result.length} video scripts with scene breakdowns`, 86)
        await recordTask(ctx, agent.name, 'Video script pack', 'completed', result[0]?.hook ?? 'Scripts ready', '2.0 hrs')
        break
      }
      case 'safety': {
        await setAgentRunning(ctx, agentId, 'Compliance & risk checks', routing)
        const draft = ws.contentDrafts[0]
        const content = draft ? `${draft.hook}\n${draft.mainCopy}` : ''
        const { result, live: aiLive } = await withAI(() =>
          checkBrandSafety({
            content,
            brandProfile: ws.brandProfile,
            research: ws.research,
            signals: dataSignals,
            modelConfig: modelFor(agentId),
          }),
        )
        live = aiLive
        const flagged = result.flags.length
        await updateAgent(
          agentId,
          {
            status: flagged ? 'waiting_for_approval' : 'completed',
            progress: 100,
            confidence: 97,
            lastOutput: flagged ? `${flagged} issues flagged for review` : 'All content passed brand safety',
          },
          ctx,
        )
        await recordTask(ctx, agent.name, 'Brand safety review', flagged ? 'waiting_for_approval' : 'completed', result.message, '0.5 hrs')
        break
      }
      case 'scheduler': {
        await setAgentRunning(ctx, agentId, 'Calendar optimization')
        const posts = scheduleFromDrafts(ws, ws.contentDrafts.filter((d) => d.status !== 'draft').slice(0, 8))
        if (posts.length === 0) {
          const fallback = scheduleFromDrafts(ws, ws.contentDrafts.slice(0, 6))
          await patchWorkspace({ calendarPosts: fallback.length ? fallback : ws.calendarPosts }, ctx)
        } else {
          await patchWorkspace({ calendarPosts: posts }, ctx)
        }
        const updated = await getWorkspace(ctx)
        const count = updated.calendarPosts.length
        await setAgentDone(ctx, agentId, `${count} posts scheduled`, 85)
        await recordTask(ctx, agent.name, 'Calendar build', 'completed', `${count} posts queued`, '1.5 hrs')
        break
      }
      case 'publisher': {
        await setAgentRunning(ctx, agentId, 'Multi-platform publishing')
        const draft = ws.contentDrafts.find((d) => d.status === 'approved') ?? ws.contentDrafts[0]
        if (draft && (!ws.safetySettings.requireApprovalBeforePosting || draft.status === 'approved')) {
          const pub = await publishToPlatform(draft.platform, {
            title: draft.hook,
            content: draft.mainCopy,
          })
          const log = {
            id: `p-${Date.now()}`,
            title: draft.hook.slice(0, 50),
            platform: draft.platform,
            status: pub.success ? ('success' as const) : ('failed' as const),
            time: new Date().toISOString(),
            url: pub.url,
            error: pub.error,
          }
          await patchWorkspace({ publishLogs: [log, ...ws.publishLogs] }, ctx)
          if (pub.success) {
            await setAgentDone(ctx, agentId, `Published to ${draft.platform}`, 80)
          } else {
            await setAgentFailed(ctx, agentId, pub.error || 'Publish failed — connect platform in Integrations')
          }
        } else {
          await setAgentDone(ctx, agentId, 'No approved content to publish yet', 70)
        }
        await recordTask(ctx, agent.name, 'Publish run', 'completed', 'Publish queue processed', '0.8 hrs')
        break
      }
      case 'leadfinder': {
        await setAgentRunning(ctx, agentId, 'Prospect discovery', routing)
        const criteria = ws.research?.marketSummary ?? campaign.targetAudience
        const { result, live: aiLive } = await withAI(() =>
          generateLeads({
            count: 10,
            criteria,
            customPromptDetails,
            brandProfile: ws.brandProfile,
            research: ws.research,
            signals: mergeCrustdataSignals({ criteria }, ws.brandProfile, ws.research, campaign),
            modelConfig: modelFor(agentId),
          }),
        )
        live = aiLive
        await patchWorkspace({ leads: result }, ctx)
        await setAgentDone(ctx, agentId, `${result.length} qualified leads identified`, 89)
        await recordTask(ctx, agent.name, 'Lead scan', 'completed', result[0]?.name ?? 'Leads found', '1.7 hrs')
        break
      }
      case 'outreach': {
        await setAgentRunning(ctx, agentId, 'Personalized messaging', routing)
        const lead = ws.leads.find((l) => l.score >= 85) ?? ws.leads[0]
        if (lead) {
          const { result, live: aiLive } = await withAI(() =>
            generateOutreach({
              leadId: lead.id,
              leadName: lead.name,
              company: lead.company,
              painPoint: lead.painPoint,
              matchReason: lead.matchReason,
              customPromptDetails,
              brandProfile: ws.brandProfile,
              research: ws.research,
              signals: mergeCrustdataSignals(
                { company: lead.company, leadName: lead.name },
                ws.brandProfile,
                ws.research,
                campaign,
              ),
              modelConfig: modelFor(agentId),
            }),
          )
          live = aiLive
          await patchWorkspace({ outreach: [result, ...ws.outreach.filter((o) => o.leadId !== lead.id)] }, ctx)
          await setAgentDone(ctx, agentId, `Outreach drafted for ${lead.name}`, 87)
        } else {
          await setAgentDone(ctx, agentId, 'No leads available — run Lead Finder first', 60)
        }
        await recordTask(ctx, agent.name, 'Outreach drafts', 'completed', lead?.name ?? 'Awaiting leads', '2.3 hrs')
        break
      }
      case 'analytics': {
        await setAgentRunning(ctx, agentId, 'ROI & performance tracking')
        const roi = computeDynamicROI(ws)
        await patchWorkspace({ roi }, ctx)
        await setAgentDone(ctx, agentId, `ROI report: ${roi.weeklyHoursSaved} hrs saved this week`, 93)
        await recordTask(ctx, agent.name, 'Weekly ROI compile', 'completed', `$${Math.round(roi.weeklyHoursSaved * 80)} saved`, '1.0 hrs')
        break
      }
      default:
        throw new Error(`Unknown agent: ${agentId}`)
    }
  } catch (err) {
    await setAgentFailed(ctx, agentId, err instanceof Error ? err.message : 'Agent run failed')
    throw err
  }

  const updatedWs = await getWorkspace(ctx)
  const updated = updatedWs.agents.find((a) => a.id === agentId)!
  return { agent: updated, live: live || hasTextAI() }
}

const WORKFLOW_ORDER = [
  'research',
  'strategy',
  'content',
  'video',
  'safety',
  'scheduler',
  'leadfinder',
  'outreach',
  'publisher',
  'analytics',
] as const

export async function executeFullWorkflow(
  customPromptDetails?: string,
  options?: { allowAnonymous?: boolean },
): Promise<{
  workflowId: string
  steps: { agentId: string; agentName: string; status: string; progress: number }[]
  estimatedTimeSaved: string
  agents: AgentDefinition[]
  live: boolean
}> {
  const ctx = await resolveWorkspaceContext({ allowAnonymous: options?.allowAnonymous })
  const workflowId = `wf-${Date.now()}`
  let anyLive = false

  for (const agentId of WORKFLOW_ORDER) {
    const ws = await getWorkspace(ctx)
    const agent = ws.agents.find((a) => a.id === agentId)
    if (!agent) continue
    try {
      const { live } = await runAgentTask(agentId, { customPromptDetails, allowAnonymous: options?.allowAnonymous })
      if (live) anyLive = true
    } catch {
      // continue pipeline — agent marked failed in store
    }
  }

  const ws = await getWorkspace(ctx)
  const hours = computeDynamicROI(ws).weeklyHoursSaved
  await patchWorkspace(
    {
      lastWorkflow: {
        workflowId,
        live: anyLive,
        completedAt: new Date().toISOString(),
        estimatedTimeSaved: `${hours} hours`,
      },
    },
    ctx,
  )

  const finalWs = await getWorkspace(ctx)
  const steps = WORKFLOW_ORDER.map((agentId) => {
    const a = finalWs.agents.find((x) => x.id === agentId) ?? demoAgents.find((x) => x.id === agentId)!
    return {
      agentId,
      agentName: a.name,
      status: a.status,
      progress: a.progress,
    }
  })

  return {
    workflowId,
    steps,
    estimatedTimeSaved: `${hours} hours`,
    agents: finalWs.agents,
    live: anyLive,
  }
}
