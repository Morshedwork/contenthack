import 'server-only'

/**
 * G-Brain Voice Manager — the executive layer above the agent orchestra.
 *
 * A voice command flows through three pillars:
 *  1. G-Brain  — intent parsing + agent execution (reuses the chat orchestrator)
 *  2. G-Stack  — the layered model chain (OpenAI + Kimi routing with fallbacks)
 *  3. CrustData — real market/company data injected as competitive evidence
 *
 * After execution the manager compiles a ManagerBriefing: a spoken summary for
 * ElevenLabs playback plus a structured report (metrics, insights,
 * recommendations, competitive edge).
 */
import { handleAgentChat } from '@/lib/agents/orchestrator'
import type {
  ChatActionExecuted,
  ChatMessage,
  ManagerBriefing,
  ManagerMetric,
  ManagerStack,
  VoiceCommandResponse,
} from '@/lib/agents/types'
import { fetchTaskContext, hasCrustdata, mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { hasElevenLabs } from '@/lib/ai/elevenlabs'
import { hasKimi, KIMI_MODEL } from '@/lib/ai/kimi'
import { generateJSON, hasTextAI } from '@/lib/ai/layer'
import { hasOpenAI, OPENAI_MODEL, OPENAI_MODEL_QUALITY } from '@/lib/ai/openai'
import { hasOpenRouter } from '@/lib/ai/openrouter'
import { DEFAULT_OPENROUTER_TEXT_MODEL } from '@/lib/models/openrouter-text'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { voiceLanguageInstruction } from '@/lib/voice/languages'
import { resolveWorkspaceContext } from '@/lib/workspace/context'
import { computeDynamicROI, getWorkspace, type WorkspaceState } from '@/lib/workspace/store'

function buildStack(crustdataUsed: boolean): ManagerStack {
  const gStack: string[] = []
  if (hasOpenAI()) gStack.push(OPENAI_MODEL_QUALITY, OPENAI_MODEL)
  if (hasOpenRouter()) {
    gStack.push(
      process.env.OPENROUTER_TEXT_MODEL?.trim() || DEFAULT_OPENROUTER_TEXT_MODEL,
      'meta-llama/llama-4-maverick',
      'qwen/qwen3-next-80b-a3b-instruct',
    )
  }
  if (hasKimi()) gStack.push(KIMI_MODEL)
  return {
    gBrain: hasTextAI(),
    gStack: [...new Set(gStack)],
    crustdata: crustdataUsed,
    voice: hasElevenLabs(),
  }
}

function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, '').replace(/[#*_`]/g, '').trim()
}

function ranAgentWork(actions: ChatActionExecuted[]): boolean {
  return actions.some((a) => a.type === 'run_agent' || a.type === 'run_workflow')
}

function needsFullBriefing(transcript: string, actions: ChatActionExecuted[]): boolean {
  if (ranAgentWork(actions)) return true
  if (actions.some((a) => a.type === 'status')) return true
  return /\b(brief|analysis|analyze|research|market|competitive|competitor|insight|report|status|update me|how (are|is) (we|the campaign|my)|pipeline|metrics|roi)\b/i.test(
    transcript,
  )
}

function spokenFromMessage(message: string): string {
  const plain = stripMarkdown(message)
  return plain.replace(/\n+/g, ' ').trim()
}

function buildConversationalBriefing(ws: WorkspaceState, message: string): ManagerBriefing {
  const spoken = spokenFromMessage(message)
  const headline = spoken.split(/[.!?]/)[0]?.trim() || spoken.slice(0, 80)
  return {
    headline,
    spokenSummary: spoken,
    metrics: buildMetrics(ws),
    insights: [],
    recommendations: [],
    competitiveEdge: [],
    stack: buildStack(false),
    generatedAt: new Date().toISOString(),
  }
}

function buildMetrics(ws: WorkspaceState): ManagerMetric[] {
  const roi = computeDynamicROI(ws)
  const completed = ws.agents.filter((a) => a.status === 'completed').length
  const failed = ws.agents.filter((a) => a.status === 'failed').length
  const qualified = ws.leads.filter((l) => l.status === 'qualified').length
  const avgScore =
    ws.leads.length > 0
      ? Math.round(ws.leads.reduce((sum, l) => sum + l.score, 0) / ws.leads.length)
      : 0
  const scheduled = ws.calendarPosts.filter((p) => p.status === 'scheduled').length

  return [
    {
      label: 'Agents completed',
      value: `${completed}/${ws.agents.length}`,
      detail: failed > 0 ? `${failed} need attention` : 'pipeline healthy',
    },
    {
      label: 'Content drafts',
      value: String(ws.contentDrafts.length),
      detail: `${scheduled} scheduled on calendar`,
    },
    {
      label: 'Leads in pipeline',
      value: String(ws.leads.length),
      detail: `${qualified} qualified · avg score ${avgScore}`,
    },
    {
      label: 'Hours saved / week',
      value: String(roi.weeklyHoursSaved),
      detail: `≈ $${roi.monthlyCostSaved.toLocaleString()} saved monthly`,
    },
  ]
}

function summarizeActions(actions: ChatActionExecuted[]): string {
  const lines: string[] = []
  for (const action of actions) {
    if (action.type === 'run_workflow') {
      lines.push(`Full workflow executed (est. ${action.estimatedTimeSaved ?? 'n/a'} saved).`)
    }
    for (const r of action.results ?? []) {
      lines.push(`${r.agentName}: ${r.status} — ${r.lastOutput}`)
    }
    if (action.type === 'status') lines.push('Status check performed.')
    if (action.type === 'set_prompt') lines.push('Standing instructions updated.')
  }
  return lines.join('\n') || 'No agents were executed for this command.'
}

function workspaceDigest(ws: WorkspaceState): string {
  const roi = computeDynamicROI(ws)
  return [
    `Campaign: ${ws.campaign.companyName || 'Untitled'} — ${ws.campaign.campaignGoal || 'no goal set'}`,
    `Industry: ${ws.campaign.industry || 'n/a'} | Region: ${ws.campaign.region || 'global'} | Platforms: ${ws.campaign.platforms.join(', ') || 'none'}`,
    `Research: ${ws.research ? `done (opportunity ${ws.research.opportunityScore}/100, ${ws.research.painPoints.length} pain points)` : 'not run'}`,
    `Assets: ${ws.topics.length} topics, ${ws.contentDrafts.length} drafts, ${ws.videoScripts.length} video scripts`,
    `Pipeline: ${ws.leads.length} leads, ${ws.outreach.length} outreach drafts, ${ws.publishLogs.filter((p) => p.status === 'success').length} published`,
    `ROI: ${roi.weeklyHoursSaved} hrs/week saved, output +${roi.contentOutputIncrease}%, campaign speed +${roi.campaignSpeedImprovement}%`,
  ].join('\n')
}

function fallbackBriefing(
  ws: WorkspaceState,
  actions: ChatActionExecuted[],
  crustdataContext: string,
): Omit<ManagerBriefing, 'metrics' | 'stack' | 'generatedAt'> {
  const completed = ws.agents.filter((a) => a.status === 'completed')
  const failed = ws.agents.filter((a) => a.status === 'failed')
  const ranSomething = actions.some((a) => a.type === 'run_agent' || a.type === 'run_workflow')
  const roi = computeDynamicROI(ws)

  const headline = ranSomething
    ? `Executed ${actions.flatMap((a) => a.results ?? []).length || 'requested'} agent task${failed.length ? ` — ${failed.length} need review` : 's successfully'}`
    : 'Workspace status briefing'

  const spokenSummary = ranSomething
    ? `Done. ${completed.length} of ${ws.agents.length} agents are completed. You now have ${ws.contentDrafts.length} content drafts and ${ws.leads.length} leads in the pipeline, saving roughly ${roi.weeklyHoursSaved} hours this week.${failed.length ? ` Heads up: ${failed.length} agent${failed.length === 1 ? '' : 's'} failed and need your review.` : ''}`
    : `Here is where we stand. ${completed.length} agents completed, ${ws.contentDrafts.length} drafts ready, ${ws.leads.length} leads tracked, and about ${roi.weeklyHoursSaved} hours saved this week.`

  const insights = [
    `${ws.contentDrafts.length} drafts across ${[...new Set(ws.contentDrafts.map((d) => d.platform))].join(', ') || 'no platforms yet'}.`,
    ws.research
      ? `Market opportunity scored ${ws.research.opportunityScore}/100 with ${ws.research.painPoints.length} documented pain points.`
      : 'Market research has not run yet — insights are limited until it does.',
    `Lead pipeline holds ${ws.leads.length} prospects (${ws.leads.filter((l) => l.status === 'qualified').length} qualified).`,
  ]

  const recommendations = [
    failed.length
      ? `Re-run the ${failed.map((a) => a.name).join(', ')} to unblock the pipeline.`
      : 'Review drafts on the Approval Board and push approved posts to the calendar.',
    ws.leads.length > 0 && ws.outreach.length === 0
      ? 'Leads are waiting — say "draft outreach for my top leads" to activate them.'
      : 'Schedule the next content batch to keep weekly cadence.',
  ]

  const competitiveEdge = crustdataContext
    ? crustdataContext
        .split('\n')
        .filter((line) => /^\d+\./.test(line.trim()))
        .slice(0, 3)
        .map((line) => line.trim())
    : ['Connect CRUSTDATA_API_KEY to ground briefings in real company and market data.']

  return { headline, spokenSummary, insights, recommendations, competitiveEdge }
}

interface GeneratedBriefing {
  headline: string
  spokenSummary: string
  insights: string[]
  recommendations: string[]
  competitiveEdge: string[]
}

async function generateBriefing(
  transcript: string,
  assistantMessage: string,
  ws: WorkspaceState,
  actions: ChatActionExecuted[],
  crustdataContext: string,
  language?: string,
): Promise<GeneratedBriefing> {
  const fallback = fallbackBriefing(ws, actions, crustdataContext)
  if (!hasTextAI()) return fallback

  const langInstruction = voiceLanguageInstruction(language)

  const briefingModel = resolveTaskModel(
    crustdataContext ? MODEL_TASK.ANALYTICS_SUMMARY : MODEL_TASK.CONTENT_GENERATION,
    ws.modelRouting,
  )

  try {
    const result = await generateJSON<Partial<GeneratedBriefing>>({
      model: briefingModel.model,
      fallbackModel: briefingModel.fallbackModel,
      modelChain: briefingModel.modelChain,
      temperature: 0.35,
      maxTokens: 700,
      system: `You are the G-Brain Voice Manager — the executive AI running a content operations team of 11 agents. You just executed a voice command and must deliver a manager-grade briefing.

Language: ${langInstruction}

Return JSON:
{
  "headline": "one punchy line describing the outcome (max 12 words)",
  "spokenSummary": "conversational spoken update, 40-80 words, first person, natural to read aloud, no markdown, no lists, mention concrete numbers",
  "insights": ["3-4 sharp data-driven observations about the workspace"],
  "recommendations": ["2-3 specific next actions, imperative voice"],
  "competitiveEdge": ["2-3 competitive-advantage notes grounded in the real market data provided (name real companies/numbers when present)"]
}

Rules:
- Use the REAL numbers from the workspace digest and execution log. Never invent metrics.
- If CrustData evidence is present, competitiveEdge MUST reference it specifically.
- If something failed, say so plainly and put the fix in recommendations.`,
      user: [
        `Voice command: "${transcript}"`,
        '',
        'Execution log:',
        summarizeActions(actions),
        '',
        'Workspace digest:',
        workspaceDigest(ws),
        crustdataContext ? `\nCrustData competitive evidence:\n${crustdataContext.slice(0, 2400)}` : '',
        assistantMessage ? `\nOrchestrator reply: ${assistantMessage}` : '',
      ].join('\n'),
    })

    return {
      headline: result.headline?.trim() || fallback.headline,
      spokenSummary: result.spokenSummary?.trim() || fallback.spokenSummary,
      insights: Array.isArray(result.insights) && result.insights.length ? result.insights : fallback.insights,
      recommendations:
        Array.isArray(result.recommendations) && result.recommendations.length
          ? result.recommendations
          : fallback.recommendations,
      competitiveEdge:
        Array.isArray(result.competitiveEdge) && result.competitiveEdge.length
          ? result.competitiveEdge
          : fallback.competitiveEdge,
    }
  } catch {
    return fallback
  }
}

/** Execute a voice command through the agent orchestra and compile a briefing. */
export async function handleVoiceCommand(
  transcript: string,
  history: ChatMessage[] = [],
  options?: { allowAnonymous?: boolean; language?: string },
): Promise<VoiceCommandResponse> {
  if (!hasTextAI()) {
    throw new Error(
      'Voice commands need a trained AI model. Add OPENAI_API_KEY and/or KIMI_API_KEY to .env.local, then restart the dev server.',
    )
  }

  const messages: ChatMessage[] = [...history.slice(-8), { role: 'user', content: transcript }]
  const chat = await handleAgentChat(messages, {
    allowAnonymous: options?.allowAnonymous,
    language: options?.language,
  })

  const ctx = await resolveWorkspaceContext({ allowAnonymous: options?.allowAnonymous })
  const ws = await getWorkspace(ctx)

  // Casual chat / greetings — skip CrustData + second LLM briefing for speed.
  if (!needsFullBriefing(transcript, chat.actionsExecuted)) {
    return {
      ...chat,
      briefing: buildConversationalBriefing(ws, chat.message),
    }
  }

  let crustdataContext = ''
  if (hasCrustdata()) {
    crustdataContext = await fetchTaskContext(
      MODEL_TASK.ANALYTICS_SUMMARY,
      mergeCrustdataSignals({}, ws.brandProfile, ws.research, ws.campaign),
    )
  }

  const generated = await generateBriefing(
    transcript,
    chat.message,
    ws,
    chat.actionsExecuted,
    crustdataContext,
    options?.language,
  )

  const briefing: ManagerBriefing = {
    ...generated,
    metrics: buildMetrics(ws),
    stack: buildStack(Boolean(crustdataContext)),
    generatedAt: new Date().toISOString(),
  }

  return { ...chat, briefing }
}
