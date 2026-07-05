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

/** A single KPI tile inside a Voice Manager briefing. */
export interface ManagerMetric {
  label: string
  value: string
  detail: string
}

/** Intelligence stack powering a briefing — shown as provenance in the UI. */
export interface ManagerStack {
  /** G-Brain: the orchestration layer that parsed and executed the command. */
  gBrain: boolean
  /** G-Stack: ordered model chain available for generation. */
  gStack: string[]
  /** CrustData: real market/company data enriched this briefing. */
  crustdata: boolean
  /** ElevenLabs voice available for spoken playback. */
  voice: boolean
}

/** Structured report the Voice Manager produces after every command. */
export interface ManagerBriefing {
  headline: string
  /** Short conversational summary optimized for text-to-speech (~30s). */
  spokenSummary: string
  metrics: ManagerMetric[]
  insights: string[]
  recommendations: string[]
  competitiveEdge: string[]
  stack: ManagerStack
  generatedAt: string
}

export interface VoiceCommandResponse extends ChatResponse {
  briefing: ManagerBriefing
}
