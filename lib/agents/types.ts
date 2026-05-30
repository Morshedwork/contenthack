import type { AgentDefinition } from '@/types'

export type { ChatMode } from '@/lib/agents/chat-messages'

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
