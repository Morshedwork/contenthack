import 'server-only'

import { runAgentTask, executeFullWorkflow, WORKFLOW_ORDER } from '@/lib/agents/engine'
import {
  buildWorkspaceSnapshot,
  describeAgentPlan,
  matchAgentsFromMessage,
  resolveAgenticPlan,
  type AgentId,
  type WorkspaceSnapshot,
} from '@/lib/agents/planner'
import { buildChatAgentPlan } from '@/lib/agents/chat-plan'
import { normalizeCustomPromptDetails } from '@/lib/ai/prompt-utils'
import { generateJSON, generateText, generateChat, hasTextAI, withAI } from '@/lib/ai/layer'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import type {
  ChatActionExecuted,
  ChatAgentPlan,
  ChatMessage,
  ChatMode,
  ChatResponse,
  ChatStreamEvent,
} from '@/lib/agents/types'
import {
  buildChatArtifacts,
  buildChatReferences,
  formatArtifactsForPrompt,
  snapshotWorkspaceArtifacts,
} from '@/lib/agents/chat-artifacts'
import { buildBasicChatSuggestedActions, buildChatSuggestedActions } from '@/lib/agents/chat-suggestions'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import { resolveWorkspaceContext } from '@/lib/workspace/context'
import { voiceLanguageInstruction } from '@/lib/voice/languages'
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
  reasoning?: string
}

export type ChatProgressCallback = (event: ChatStreamEvent) => void

function isAbortSignal(signal?: AbortSignal) {
  return Boolean(signal?.aborted)
}

function markRemainingPlanStepsSkipped(
  plan: ChatAgentPlan | null | undefined,
  emit?: ChatProgressCallback,
): ChatAgentPlan | null {
  if (!plan) return plan ?? null
  const steps = plan.steps.map((step) => {
    if (step.status === 'pending' || step.status === 'running') {
      emit?.({ type: 'step', agentId: step.agentId, status: 'skipped', output: 'Stopped' })
      return { ...step, status: 'skipped' as const, output: 'Stopped' }
    }
    return step
  })
  return { ...plan, steps }
}

function buildStoppedMessage(actionsExecuted: ChatActionExecuted[]): string {
  const completed =
    actionsExecuted.flatMap((a) => a.results ?? []).filter((r) => r.status === 'completed').length
  if (completed > 0) {
    return `Stopped. ${completed} agent${completed === 1 ? '' : 's'} finished — results are saved in your workspace. Send another prompt to continue.`
  }
  return 'Stopped before any agents finished. Send another prompt when you are ready.'
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

const CASUAL_CHAT_RE =
  /^(hi|hello|hey|how are you|how'?s it going|good (morning|afternoon|evening)|what'?s up|thanks|thank you|bye|goodbye|nice to meet you)\b/i

function parseIntentFallback(message: string): ParsedIntent {
  const trimmed = message.trim()
  if (CASUAL_CHAT_RE.test(trimmed)) {
    return {
      action: 'respond_only',
      agentIds: [],
      customPromptDetails: '',
      assistantMessage: '',
    }
  }

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
        maxTokens: 450,
        system: `You are the ContentOps autonomous orchestrator — a marketing ops agent that PLANS and EXECUTES, not a passive chatbot.

Available agents:
${agentList}

Actions:
- run_agents: run one or more agents (set agentIds) — chain when the user's goal requires multiple steps
- run_full_workflow: when user wants end-to-end / everything / full pipeline / launch campaign
- get_status: workspace status only (no execution)
- set_custom_prompt: save standing instructions (customPromptDetails)
- respond_only: greetings, help, clarification — no execution

Agentic behavior:
- Think like an ops lead: infer what the user wants DONE, not just what they literally said.
- "LinkedIn posts for Japan SMEs" → content (add strategy if no topics exist — the runtime will expand).
- "Launch my campaign" / "get content ready" → run_full_workflow or research → strategy → content → safety → scheduler.
- "Find leads and reach out" → leadfinder + outreach.
- Chain agents when the outcome clearly needs multiple steps — do NOT ask "shall I proceed?"; state your plan in assistantMessage.
- Extract tone, region, offer, platforms into customPromptDetails.
- agentIds: ${[...VALID_AGENT_IDS].join(', ')}
- Pipeline order: research → strategy → content → video → safety → scheduler → publisher → leadfinder → outreach → analytics
- reasoning: 1–2 sentences on WHY you chose this plan (shown to the user before execution).
- assistantMessage: first-person plan, e.g. "I'll run market research, then draft LinkedIn posts for your Japan SME offer."

Return JSON: { "action", "agentIds", "customPromptDetails", "assistantMessage", "reasoning" }`,
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
    agentIds = resolveAgenticPlan(agentIds, message, wsSnapshot)
  }

  if (CASUAL_CHAT_RE.test(message.trim()) && action !== 'run_agents' && action !== 'run_full_workflow') {
    action = 'respond_only'
    agentIds = []
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
    reasoning:
      typeof result.reasoning === 'string' && result.reasoning.trim()
        ? result.reasoning.trim()
        : action === 'run_agents' && agentIds.length > 0
          ? `Executing ${agentIds.length} step${agentIds.length === 1 ? '' : 's'} to complete your request.`
          : action === 'run_full_workflow'
            ? 'Running the full content operations pipeline end to end.'
            : '',
  }
}

async function buildStatusMessage(ws: Awaited<ReturnType<typeof getWorkspace>>): Promise<string> {
  const running = ws.agents.filter((a) => a.status === 'running')
  const completed = ws.agents.filter((a) => a.status === 'completed')
  const failed = ws.agents.filter((a) => a.status === 'failed')

  const lines = [
    `Workspace: ${ws.campaign.companyName || 'Untitled campaign'}`,
    `Agents: ${completed.length} completed, ${running.length} running, ${failed.length} failed`,
  ]

  if (running.length) {
    lines.push('', 'Currently running:')
    running.forEach((a) => lines.push(`- ${a.name}: ${a.currentTask} (${a.progress}%)`))
  }

  const recent = ws.agents.filter((a) => a.lastOutput).slice(0, 5)
  if (recent.length) {
    lines.push('', 'Recent outputs:')
    recent.forEach((a) => lines.push(`- ${a.name}: ${a.lastOutput}`))
  }

  return lines.join('\n')
}

function voiceManagerSystemPrompt(
  ws: Awaited<ReturnType<typeof getWorkspace>>,
  language?: string,
): string {
  const campaign = ws.campaign
  const langInstruction = voiceLanguageInstruction(language)
  return `You are the Voice Manager for ContentOps AI${
    campaign.companyName ? `, helping ${campaign.companyName}` : ''
  }.

Language: ${langInstruction}

Answer naturally like a sharp marketing ops lead — warm, direct, easy to speak aloud.
- For greetings or "how are you": respond personally (e.g. you're doing well, energized, ready to help). Do NOT recite workspace metrics unless they ask.
- For help: explain you can run research, content, leads, outreach, or the full workflow on command.
- Keep replies under 3 short sentences. No markdown, no bullet lists, no JSON.
Campaign: ${campaign.companyName || 'not set'} | Goal: ${campaign.campaignGoal || 'not set'}`
}

async function summarizeResults(
  intent: ParsedIntent,
  actionsExecuted: ChatActionExecuted[],
  ws: Awaited<ReturnType<typeof getWorkspace>>,
  userMessage: string,
  history: ChatMessage[] = [],
  enrichment?: Pick<ChatResponse, 'artifacts' | 'references'>,
  language?: string,
): Promise<string> {
  const langInstruction = voiceLanguageInstruction(language)
  const artifactContext = enrichment
    ? formatArtifactsForPrompt(enrichment.artifacts ?? [], enrichment.references ?? [])
    : ''

  if (!hasTextAI()) {
    if (intent.action === 'get_status') return buildStatusMessage(ws)
    const ran = actionsExecuted.flatMap((a) => a.results ?? [])
    if (ran.length === 0) {
      return (
        intent.assistantMessage ||
        "I'm here and ready to help — try research, content, leads, or say run the full workflow."
      )
    }
    const lines = [
      intent.assistantMessage,
      '',
      ...ran.map((r) => `${r.agentName} (${r.status}): ${r.lastOutput}`),
    ]
    if (enrichment?.references?.length) {
      lines.push('', 'Where to view:', ...enrichment.references.map((r) => `- ${r.label}: ${r.href}`))
    }
    return lines.join('\n')
  }

  const chatModel = resolveTaskModel(MODEL_TASK.CONTENT_GENERATION, ws.modelRouting)

  // Fast path: casual chat — one LLM call, natural reply (no workspace dump).
  if (intent.action === 'respond_only' && actionsExecuted.length === 0) {
    const message = await generateChat({
      model: chatModel.model,
      fallbackModel: chatModel.fallbackModel,
      modelChain: chatModel.modelChain,
      temperature: 0.75,
      maxTokens: 220,
      messages: [
        { role: 'system', content: voiceManagerSystemPrompt(ws, language) },
        ...history.slice(-6).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userMessage },
      ],
    })
    return message?.trim() || intent.assistantMessage || "I'm doing well — what should we tackle?"
  }

  if (intent.action === 'get_status' && actionsExecuted.every((a) => a.type === 'status')) {
    const statusText = await buildStatusMessage(ws)
    const { result } = await withAI(() =>
      generateText({
        model: chatModel.model,
        fallbackModel: chatModel.fallbackModel,
        modelChain: chatModel.modelChain,
        temperature: 0.4,
        maxTokens: 400,
        system: `Summarize workspace status for voice playback. Language: ${langInstruction} Use real numbers from the data. Friendly, concise, spoken style — no markdown lists.`,
        user: `User asked: "${userMessage}"\n\nWorkspace status:\n${statusText}`,
      }),
    )
    return result
  }

  const summaryModel = resolveTaskModel(MODEL_TASK.ANALYTICS_SUMMARY, ws.modelRouting)
  const { result } = await withAI(() =>
    generateText({
      model: summaryModel.model,
      fallbackModel: summaryModel.fallbackModel,
      modelChain: summaryModel.modelChain,
      temperature: 0.5,
      maxTokens: 650,
      system: `You are ContentOps AI — an autonomous marketing ops agent reporting results after execution.

Language: ${langInstruction}

Format rules:
- Speak in first person past tense: "I researched…", "I drafted…"
- Use **bold** for key metrics or counts.
- Cite outputs with markdown links exactly as provided, e.g. [View posts](/dashboard/content).
- Structure: outcome paragraph → **Where to find it** with 2–4 links when references exist.
- Be decisive — recommend the obvious next step in the final sentence.`,
      user: [
        `User asked: "${userMessage}"`,
        '',
        `Actions taken: ${JSON.stringify(actionsExecuted, null, 2)}`,
        '',
        `Draft reply: ${intent.assistantMessage}`,
        artifactContext ? `\n${artifactContext}` : '',
      ].join('\n'),
    }),
  )

  return result
}

function enrichChatResponse(
  ws: Awaited<ReturnType<typeof getWorkspace>>,
  actionsExecuted: ChatActionExecuted[],
  beforeSnapshot: ReturnType<typeof snapshotWorkspaceArtifacts>,
): Pick<ChatResponse, 'artifacts' | 'references' | 'suggestedActions'> {
  const artifacts = buildChatArtifacts(ws, actionsExecuted, beforeSnapshot)
  const references = buildChatReferences(actionsExecuted, artifacts)
  const suggestedActions = buildChatSuggestedActions(actionsExecuted, ws)
  return { artifacts, references, suggestedActions }
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
When helpful, point users to dashboard areas using markdown links like [Content studio](/dashboard/content) or [Image studio](/dashboard/image).
Keep replies concise, practical, and actionable. Use **bold** for emphasis and markdown links for navigation hints.`,
      },
      ...messages.slice(-20).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  })

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')

  return {
    message: message || 'I could not generate a response.',
    actionsExecuted: [],
    agents: ws.agents,
    live: true,
    suggestedActions: lastUser ? buildBasicChatSuggestedActions(lastUser.content) : undefined,
  }
}

export async function handleAgentChat(
  messages: ChatMessage[],
  options?: {
    allowAnonymous?: boolean
    onProgress?: ChatProgressCallback
    language?: string
    signal?: AbortSignal
  },
): Promise<ChatResponse> {
  const emit = options?.onProgress
  const signal = options?.signal
  const ctx = await resolveWorkspaceContext({ allowAnonymous: options?.allowAnonymous })
  const ws = await getWorkspace(ctx)
  const beforeSnapshot = snapshotWorkspaceArtifacts(ws)
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

  const agentIdsForPlan =
    intent.action === 'run_full_workflow'
      ? ([...WORKFLOW_ORDER] as AgentId[])
      : (intent.agentIds as AgentId[])

  let plan = buildChatAgentPlan({
    goal: lastUser.content,
    reasoning: intent.reasoning || intent.assistantMessage,
    agentIds: agentIdsForPlan,
    catalog: AGENT_CATALOG,
    action: intent.action,
    workflowAgentIds: [...WORKFLOW_ORDER] as AgentId[],
  })

  if (plan) {
    emit?.({ type: 'plan', plan })
  }

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
    const { workflowId, estimatedTimeSaved, agents, live, aborted } = await executeFullWorkflow(
      intent.customPromptDetails || ws.customPromptDetails || undefined,
      {
        allowAnonymous: options?.allowAnonymous,
        signal,
        onAgentStep: ({ agentId, status, lastOutput }) => {
          const stepStatus = status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'running'
          emit?.({ type: 'step', agentId, status: stepStatus, output: lastOutput })
          if (plan) {
            plan = {
              ...plan,
              steps: plan.steps.map((s) =>
                s.agentId === agentId ? { ...s, status: stepStatus, output: lastOutput } : s,
              ),
            }
          }
        },
      },
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
    if (aborted || signal?.aborted) {
      plan = markRemainingPlanStepsSkipped(plan, emit)
    }
  } else if (intent.action === 'run_agents' && intent.agentIds.length > 0) {
    const results: ChatActionExecuted['results'] = []
    for (const agentId of intent.agentIds) {
      if (isAbortSignal(signal)) break
      emit?.({ type: 'step', agentId, status: 'running' })
      if (plan) {
        plan = {
          ...plan,
          steps: plan.steps.map((s) =>
            s.agentId === agentId ? { ...s, status: 'running' } : s,
          ),
        }
      }
      try {
        const { agent, live } = await runAgentTask(agentId, {
          customPromptDetails: intent.customPromptDetails || ws.customPromptDetails || undefined,
          allowAnonymous: options?.allowAnonymous,
        })
        if (live) anyLive = true
        const stepStatus = agent.status === 'failed' ? 'failed' : 'completed'
        results.push({
          agentId: agent.id,
          agentName: agent.name,
          status: agent.status,
          lastOutput: agent.lastOutput,
        })
        emit?.({ type: 'step', agentId, status: stepStatus, output: agent.lastOutput })
        if (plan) {
          plan = {
            ...plan,
            steps: plan.steps.map((s) =>
              s.agentId === agentId
                ? { ...s, status: stepStatus, output: agent.lastOutput }
                : s,
            ),
          }
        }
      } catch (err) {
        const agent = AGENT_CATALOG.find((a) => a.id === agentId)
        const lastOutput = err instanceof Error ? err.message : 'Agent run failed'
        results.push({
          agentId,
          agentName: agent?.name ?? agentId,
          status: 'failed',
          lastOutput,
        })
        emit?.({ type: 'step', agentId, status: 'failed', output: lastOutput })
        if (plan) {
          plan = {
            ...plan,
            steps: plan.steps.map((s) =>
              s.agentId === agentId ? { ...s, status: 'failed', output: lastOutput } : s,
            ),
          }
        }
      }
    }
    actionsExecuted.push({ type: 'run_agent', agentIds: intent.agentIds, results })
    if (signal?.aborted) {
      plan = markRemainingPlanStepsSkipped(plan, emit)
    }
  } else if (intent.action === 'get_status') {
    actionsExecuted.push({ type: 'status' })
  }

  if (signal?.aborted) {
    const finalWs = await getWorkspace(ctx)
    const enrichment = enrichChatResponse(finalWs, actionsExecuted, beforeSnapshot)
    const response: ChatResponse = {
      message: buildStoppedMessage(actionsExecuted),
      actionsExecuted,
      agents: finalWs.agents,
      live: anyLive || hasTextAI(),
      ...enrichment,
      plan: plan ?? undefined,
    }
    emit?.({ type: 'done', response })
    return response
  }

  emit?.({ type: 'summarizing' })

  const finalWs = await getWorkspace(ctx)
  const enrichment = enrichChatResponse(finalWs, actionsExecuted, beforeSnapshot)
  const message = await summarizeResults(
    intent,
    actionsExecuted,
    finalWs,
    lastUser.content,
    messages.slice(0, -1),
    enrichment,
    options?.language,
  )

  const response: ChatResponse = {
    message,
    actionsExecuted,
    agents: finalWs.agents,
    live: anyLive || hasTextAI(),
    ...enrichment,
    plan: plan ?? undefined,
  }

  emit?.({ type: 'done', response })
  return response
}
