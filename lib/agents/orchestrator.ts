import 'server-only'

import { runAgentTask, executeFullWorkflow } from '@/lib/agents/engine'
import {
  buildWorkspaceSnapshot,
  describeAgentPlan,
  matchAgentsFromMessage,
  resolveAgentPlan,
  type AgentId,
  type WorkspaceSnapshot,
} from '@/lib/agents/planner'
import { normalizeCustomPromptDetails } from '@/lib/ai/prompt-utils'
import { generateJSON, generateText, generateChat, hasTextAI, withAI } from '@/lib/ai/layer'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import type { ChatActionExecuted, ChatMessage, ChatMode, ChatResponse } from '@/lib/agents/types'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import { resolveWorkspaceContext } from '@/lib/workspace/context'
import type { AgentDefinition } from '@/types'

export const AGENT_CATALOG = [
  { id: 'research', name: 'Research Agent', description: 'Market research, competitor analysis, pain points, trends, keywords' },
  { id: 'strategy', name: 'Strategy Agent', description: 'Content pillars, topic ideas, content strategy' },
  { id: 'content', name: 'Content Agent', description: 'Social posts, captions, hooks for LinkedIn, Instagram, X, etc.' },
  { id: 'brandtheme', name: 'Brand Theme Agent', description: 'Extract brand colors, typography, and visual style from company URLs' },
  { id: 'video', name: 'Video Agent', description: 'Short-form video scripts with scene breakdowns' },
  { id: 'safety', name: 'Brand Safety Agent', description: 'Compliance checks, claim detection, brand safety review' },
  { id: 'scheduler', name: 'Scheduler Agent', description: 'Content calendar scheduling and post timing optimization' },
  { id: 'publisher', name: 'Publisher Agent', description: 'Publish approved content to connected platforms via official APIs' },
  { id: 'leadfinder', name: 'Lead Finder Agent', description: 'Prospect discovery and lead scoring' },
  { id: 'outreach', name: 'Outreach Agent', description: 'Personalized LinkedIn and email outreach messages' },
  { id: 'analytics', name: 'Analytics Agent', description: 'ROI reports, performance metrics, hours saved' },
] as const

export type { AgentId } from '@/lib/agents/planner'

interface ParsedIntent {
  action: 'run_agents' | 'run_full_workflow' | 'get_status' | 'set_custom_prompt' | 'respond_only'
  agentIds: string[]
  customPromptDetails: string
  assistantMessage: string
}

const VALID_AGENT_IDS = new Set<string>(AGENT_CATALOG.map((a) => a.id))

function buildWorkspaceSummary(ws: Awaited<ReturnType<typeof getWorkspace>>): string {
  const agentSummary = ws.agents
    .map((a) => `${a.name} (${a.id}): ${a.status}, ${a.progress}% — ${a.lastOutput || 'no output yet'}`)
    .join('\n')
  return [
    `Campaign: ${ws.campaign.companyName} — ${ws.campaign.campaignGoal}`,
    `Industry: ${ws.campaign.industry}, Region: ${ws.campaign.region}`,
    `Platforms: ${ws.campaign.platforms.join(', ')}`,
    `Research: ${ws.research ? 'available' : 'not run yet'}`,
    `Topics: ${ws.topics.length}, Content drafts: ${ws.contentDrafts.length}`,
    `Leads: ${ws.leads.length}, Outreach: ${ws.outreach.length}`,
    `Custom instructions: ${ws.customPromptDetails || 'none'}`,
    'Agent statuses:',
    agentSummary,
  ].join('\n')
}

function parseIntentFallback(message: string): ParsedIntent {
  const match = matchAgentsFromMessage(message)

  if (match.kind === 'full_workflow') {
    return {
      action: 'run_full_workflow',
      agentIds: [],
      customPromptDetails: message,
      assistantMessage: 'Running the full content operations workflow for you.',
    }
  }

  if (match.kind === 'status') {
    return {
      action: 'get_status',
      agentIds: [],
      customPromptDetails: '',
      assistantMessage: 'Here is the current status of your agents.',
    }
  }

  if (match.kind === 'agents' && match.agentIds.length > 0) {
    return {
      action: 'run_agents',
      agentIds: match.agentIds,
      customPromptDetails: message,
      assistantMessage: describeAgentPlan(match.agentIds, AGENT_CATALOG),
    }
  }

  return {
    action: 'respond_only',
    agentIds: [],
    customPromptDetails: '',
    assistantMessage:
      'Tell me exactly what you need — one task at a time works best. Try: "Run market research", "Generate LinkedIn posts", "Find leads and draft outreach", or "Run the full workflow" when you want every agent.',
  }
}

async function parseIntent(
  message: string,
  workspaceSummary: string,
  history: ChatMessage[],
  wsSnapshot: WorkspaceSnapshot,
  modelRouting?: import('@/types').ModelRouting[],
): Promise<ParsedIntent> {
  const agentList = AGENT_CATALOG.map((a) => `- ${a.id}: ${a.name} — ${a.description}`).join('\n')
  const historyText = history
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')

  const orchestratorModel = resolveTaskModel(MODEL_TASK.ANALYTICS_SUMMARY, modelRouting)

  let result: ParsedIntent
  try {
    const parsed = await withAI(() =>
      generateJSON<ParsedIntent>({
        model: orchestratorModel.model,
        fallbackModel: orchestratorModel.fallbackModel,
        modelChain: orchestratorModel.modelChain,
        temperature: 0.2,
        maxTokens: 800,
        system: `You are the ContentOps AI orchestrator. Parse user requests into the MINIMUM agent actions needed.

Available agents:
${agentList}

Actions:
- run_agents: run one or more specific agents (set agentIds) — prefer ONE agent when the request is single-purpose
- run_full_workflow: ONLY when the user explicitly asks for the full pipeline / everything / end-to-end
- get_status: summarize current agent/workspace status (no agent execution)
- set_custom_prompt: save standing instructions for future agent runs (use customPromptDetails)
- respond_only: answer without running agents (help, clarification, general questions)

Rules:
- DEFAULT TO MINIMAL: "Generate LinkedIn posts" → content only. "Market research" → research only.
- Do NOT run all agents unless the user clearly asks for full workflow / entire pipeline / everything.
- Do NOT add research, strategy, or safety as "helpful extras" unless the user chained steps ("research then write posts") or named that agent.
- Multi-agent runs are allowed ONLY when the user explicitly combines tasks ("find leads and draft outreach", "research then content").
- Extract operational instructions into customPromptDetails (tone, region, offer focus, word limits, etc.)
- agentIds must only use valid ids: ${[...VALID_AGENT_IDS].join(', ')}
- Order agentIds in pipeline order when multiple are truly needed: research → strategy → content → video → safety → scheduler → publisher → leadfinder → outreach → analytics
- Keep assistantMessage concise — name only the agents you will actually run

Return JSON: { "action", "agentIds", "customPromptDetails", "assistantMessage" }`,
        user: `Workspace state:\n${workspaceSummary}\n\nRecent chat:\n${historyText || 'none'}\n\nUser message: ${message}`,
      }),
    )
    result = parsed.result
  } catch {
    result = parseIntentFallback(message)
  }

  let agentIds = (result.agentIds ?? []).filter((id): id is AgentId => VALID_AGENT_IDS.has(id))
  let action = ['run_agents', 'run_full_workflow', 'get_status', 'set_custom_prompt', 'respond_only'].includes(
    result.action,
  )
    ? result.action
    : agentIds.length > 0
      ? 'run_agents'
      : 'respond_only'

  // Guard: models sometimes pick run_full_workflow without an explicit ask.
  if (action === 'run_full_workflow') {
    const explicitFull =
      matchAgentsFromMessage(message).kind === 'full_workflow' ||
      /\bfull workflow\b|\brun everything\b|\bend[\s-]to[\s-]end\b|\bcomplete pipeline\b|\ball agents\b|\bentire pipeline\b/i.test(
        message,
      )
    if (!explicitFull) {
      if (agentIds.length > 0) {
        action = 'run_agents'
      } else {
        const phrase = matchAgentsFromMessage(message)
        if (phrase.kind === 'agents' && phrase.agentIds.length > 0) {
          action = 'run_agents'
          agentIds = phrase.agentIds
        } else {
          action = 'respond_only'
          agentIds = []
        }
      }
    }
  }

  if (action === 'run_agents' && agentIds.length > 0) {
    agentIds = resolveAgentPlan(agentIds, message, wsSnapshot)
  }

  return {
    action,
    agentIds,
    customPromptDetails: normalizeCustomPromptDetails(result.customPromptDetails) ?? '',
    assistantMessage:
      action === 'run_agents' && agentIds.length > 0
        ? describeAgentPlan(agentIds, AGENT_CATALOG)
        : typeof result.assistantMessage === 'string'
          ? result.assistantMessage
          : 'Done.',
  }
}

async function buildStatusMessage(ws: Awaited<ReturnType<typeof getWorkspace>>): Promise<string> {
  const running = ws.agents.filter((a) => a.status === 'running')
  const completed = ws.agents.filter((a) => a.status === 'completed')
  const failed = ws.agents.filter((a) => a.status === 'failed')

  const lines = [
    `**Workspace:** ${ws.campaign.companyName || 'Untitled campaign'}`,
    `**Agents:** ${completed.length} completed, ${running.length} running, ${failed.length} failed`,
  ]

  if (running.length) {
    lines.push('', '**Currently running:**')
    running.forEach((a) => lines.push(`- ${a.name}: ${a.currentTask} (${a.progress}%)`))
  }

  const recent = ws.agents.filter((a) => a.lastOutput).slice(0, 5)
  if (recent.length) {
    lines.push('', '**Recent outputs:**')
    recent.forEach((a) => lines.push(`- ${a.name}: ${a.lastOutput}`))
  }

  return lines.join('\n')
}

async function summarizeResults(
  intent: ParsedIntent,
  actionsExecuted: ChatActionExecuted[],
  ws: Awaited<ReturnType<typeof getWorkspace>>,
): Promise<string> {
  if (!hasTextAI()) {
    if (intent.action === 'get_status') return buildStatusMessage(ws)
    const ran = actionsExecuted.flatMap((a) => a.results ?? [])
    if (ran.length === 0) return intent.assistantMessage
    return [
      intent.assistantMessage,
      '',
      ...ran.map((r) => `**${r.agentName}** (${r.status}): ${r.lastOutput}`),
    ].join('\n')
  }

  const chatModel = resolveTaskModel(MODEL_TASK.ANALYTICS_SUMMARY, ws.modelRouting)
  const { result } = await withAI(() =>
    generateText({
      model: chatModel.model,
      fallbackModel: chatModel.fallbackModel,
      modelChain: chatModel.modelChain,
      temperature: 0.5,
      maxTokens: 600,
      system: `You are ContentOps AI assistant. Summarize agent execution results for the user in a friendly, concise way. Use markdown sparingly (bold for agent names). Be specific about what was produced.`,
      user: `User asked: ${intent.customPromptDetails || '(status check)'}\n\nActions taken: ${JSON.stringify(actionsExecuted, null, 2)}\n\nDraft reply: ${intent.assistantMessage}`,
    }),
  )

  return result
}

export async function handleBasicChat(
  messages: ChatMessage[],
  options?: { allowAnonymous?: boolean },
): Promise<ChatResponse> {
  const ctx = await resolveWorkspaceContext({ allowAnonymous: options?.allowAnonymous })
  const ws = await getWorkspace(ctx)
  const campaign = ws.campaign

  if (!hasTextAI()) {
    return {
      message:
        'Basic chat needs an AI provider configured (**OPENAI_API_KEY** or **KIMI_API_KEY**). You can still use **Agent Mode** for demo pipeline actions, or add a key in `.env.local`.',
      actionsExecuted: [],
      agents: ws.agents,
      live: false,
    }
  }

  const chatModel = resolveTaskModel(MODEL_TASK.CONTENT_GENERATION, ws.modelRouting)
  const message = await generateChat({
    model: chatModel.model,
    fallbackModel: chatModel.fallbackModel,
    modelChain: chatModel.modelChain,
    temperature: 0.7,
    maxTokens: 1024,
    messages: [
      {
        role: 'system',
        content: `You are a helpful content marketing assistant${
          campaign.companyName ? ` for ${campaign.companyName}` : ''
        }.
Industry: ${campaign.industry || 'general'}
Campaign goal: ${campaign.campaignGoal || 'not specified'}
Region: ${campaign.region || 'global'}

Help with brainstorming, copy feedback, hooks, captions, content strategy, and marketing questions.
You are in basic chat mode — answer conversationally only. Do not claim to run agents, workflows, or tools.
Keep replies concise, practical, and actionable.`,
      },
      ...messages.slice(-20).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  })

  return {
    message: message || 'I could not generate a response.',
    actionsExecuted: [],
    agents: ws.agents,
    live: true,
  }
}

export async function handleAgentChat(
  messages: ChatMessage[],
  options?: { allowAnonymous?: boolean },
): Promise<ChatResponse> {
  const ctx = await resolveWorkspaceContext({ allowAnonymous: options?.allowAnonymous })
  const ws = await getWorkspace(ctx)
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser) throw new Error('No user message provided')

  const workspaceSummary = buildWorkspaceSummary(ws)
  const wsSnapshot = buildWorkspaceSnapshot(ws)
  const intent = await parseIntent(
    lastUser.content,
    workspaceSummary,
    messages.slice(0, -1),
    wsSnapshot,
    ws.modelRouting,
  )

  const actionsExecuted: ChatActionExecuted[] = []
  let anyLive = false

  if (intent.customPromptDetails && intent.action !== 'respond_only') {
    const incoming = normalizeCustomPromptDetails(intent.customPromptDetails) ?? ''
    const existing = normalizeCustomPromptDetails(ws.customPromptDetails) ?? ''
    const merged = existing && incoming !== existing ? `${existing}\n${incoming}` : incoming || existing
    await patchWorkspace({ customPromptDetails: merged }, ctx)
    if (intent.action === 'set_custom_prompt') {
      actionsExecuted.push({ type: 'set_prompt' })
    }
  }

  if (intent.action === 'run_full_workflow') {
    const { workflowId, estimatedTimeSaved, agents, live } = await executeFullWorkflow(
      intent.customPromptDetails || ws.customPromptDetails || undefined,
      { allowAnonymous: options?.allowAnonymous },
    )
    if (live) anyLive = true
    actionsExecuted.push({
      type: 'run_workflow',
      workflowId,
      estimatedTimeSaved,
      results: agents.map((a) => ({
        agentId: a.id,
        agentName: a.name,
        status: a.status,
        lastOutput: a.lastOutput,
      })),
    })
    const finalWs = await getWorkspace(ctx)
    const message = await summarizeResults(intent, actionsExecuted, finalWs)
    return { message, actionsExecuted, agents, live: anyLive || hasTextAI() }
  }

  if (intent.action === 'run_agents' && intent.agentIds.length > 0) {
    const results: ChatActionExecuted['results'] = []
    for (const agentId of intent.agentIds) {
      try {
        const { agent, live } = await runAgentTask(agentId, {
          customPromptDetails: intent.customPromptDetails || ws.customPromptDetails || undefined,
          allowAnonymous: options?.allowAnonymous,
        })
        if (live) anyLive = true
        results.push({
          agentId: agent.id,
          agentName: agent.name,
          status: agent.status,
          lastOutput: agent.lastOutput,
        })
      } catch (err) {
        const agent = AGENT_CATALOG.find((a) => a.id === agentId)
        results.push({
          agentId,
          agentName: agent?.name ?? agentId,
          status: 'failed',
          lastOutput: err instanceof Error ? err.message : 'Agent run failed',
        })
      }
    }
    actionsExecuted.push({ type: 'run_agent', agentIds: intent.agentIds, results })
  }

  if (intent.action === 'get_status') {
    actionsExecuted.push({ type: 'status' })
  }

  const finalWs = await getWorkspace(ctx)
  const message = await summarizeResults(intent, actionsExecuted, finalWs)

  return {
    message,
    actionsExecuted,
    agents: finalWs.agents,
    live: anyLive || (hasTextAI() && intent.action !== 'respond_only'),
  }
}
