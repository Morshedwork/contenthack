import type { AgentDefinition, AgentTask } from '@/types'
import type { ChatMessage, ChatMode, ChatResponse, ChatStreamEvent } from '@/lib/agents/types'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string }

async function parseApi<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiEnvelope<T>
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || `Request failed (${res.status})`)
  }
  return json.data
}

export async function fetchAgentStatus(): Promise<{ agents: AgentDefinition[]; tasks: AgentTask[] }> {
  const data = await parseApi<{ agents: AgentDefinition[]; tasks: AgentTask[] }>(
    await fetch('/api/agents/taskStatus'),
  )
  return { agents: data.agents, tasks: data.tasks }
}

export async function runAgent(
  agentId: string,
  customPromptDetails?: string,
): Promise<{ agent: AgentDefinition; live: boolean }> {
  return parseApi<{ agent: AgentDefinition; live: boolean }>(
    await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, customPromptDetails }),
    }),
  )
}

export async function runFullWorkflow(customPromptDetails?: string): Promise<{
  workflowId: string
  steps: { agentId: string; agentName: string; status: string; progress: number }[]
  estimatedTimeSaved: string
  agents: AgentDefinition[]
  live?: boolean
}> {
  return parseApi(
    await fetch('/api/agents/runFullWorkflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customPromptDetails }),
    }),
  )
}

export type {
  ChatActionExecuted,
  ChatAgentPlan,
  ChatArtifact,
  ChatMessage,
  ChatMode,
  ChatReference,
  ChatResponse,
  ChatStreamEvent,
  ChatSuggestedAction,
} from '@/lib/agents/types'

export function isChatAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  )
}

export async function sendChatMessage(
  messages: ChatMessage[],
  mode: ChatMode = 'agent',
  options?: { signal?: AbortSignal },
): Promise<ChatResponse> {
  return parseApi<ChatResponse>(
    await fetch('/api/agents/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, mode }),
      signal: options?.signal,
    }),
  )
}

/** Agent-mode streaming — emits plan, live step updates, then final response. */
export async function sendChatMessageStream(
  messages: ChatMessage[],
  mode: ChatMode,
  onEvent: (event: ChatStreamEvent) => void,
  options?: { signal?: AbortSignal },
): Promise<ChatResponse> {
  const res = await fetch('/api/agents/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, mode }),
    signal: options?.signal,
  })

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(json.error || `Request failed (${res.status})`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('Streaming not supported')

  const decoder = new TextDecoder()
  let buffer = ''
  let finalResponse: ChatResponse | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''

    for (const chunk of chunks) {
      const line = chunk.trim()
      if (!line.startsWith('data:')) continue
      const event = JSON.parse(line.slice(5).trim()) as ChatStreamEvent
      onEvent(event)
      if (event.type === 'done') finalResponse = event.response
      if (event.type === 'error') throw new Error(event.message)
    }
  }

  if (!finalResponse) throw new Error('Stream ended without a response')
  return finalResponse
}
