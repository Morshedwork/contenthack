import type { AgentDefinition, AgentTask } from '@/types'

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

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatActionExecuted {
  type: 'run_agent' | 'run_workflow' | 'status' | 'set_prompt'
  agentIds?: string[]
  results?: { agentId: string; agentName: string; status: string; lastOutput: string }[]
  workflowId?: string
  estimatedTimeSaved?: string
}

export interface ChatResponse {
  message: string
  actionsExecuted: ChatActionExecuted[]
  agents: AgentDefinition[]
  live: boolean
}

export type { ChatMode } from '@/lib/agents/chat-messages'

export async function sendChatMessage(
  messages: ChatMessage[],
  mode: ChatMode = 'agent',
): Promise<ChatResponse> {
  return parseApi<ChatResponse>(
    await fetch('/api/agents/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, mode }),
    }),
  )
}
