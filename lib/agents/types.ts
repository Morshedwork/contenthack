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

export type ChatArtifactType =
  | 'post'
  | 'image'
  | 'video'
  | 'script'
  | 'topic'
  | 'research'
  | 'lead'
  | 'outreach'

/** Rich preview of something created or updated during a chat turn. */
export interface ChatArtifact {
  id: string
  type: ChatArtifactType
  title: string
  preview?: string
  agentId?: string
  href: string
  thumbnailUrl?: string
  mediaUrl?: string
  meta?: string
}

/** Dashboard link the assistant can cite so users know where edits landed. */
export interface ChatReference {
  label: string
  href: string
  description?: string
}

/** Contextual follow-up the user can tap to continue the workflow. */
export interface ChatSuggestedAction {
  label: string
  prompt: string
}

export type ChatPlanStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

/** One step in an autonomous agent execution plan. */
export interface ChatPlanStep {
  id: string
  agentId: string
  agentName: string
  label: string
  href?: string
  status: ChatPlanStepStatus
  output?: string
}

/** Visible plan the orchestrator executes — shown live in chat. */
export interface ChatAgentPlan {
  goal: string
  reasoning: string
  steps: ChatPlanStep[]
}

export type ChatStreamEvent =
  | { type: 'plan'; plan: ChatAgentPlan }
  | { type: 'step'; agentId: string; status: ChatPlanStepStatus; output?: string }
  | { type: 'summarizing' }
  | { type: 'done'; response: ChatResponse }
  | { type: 'error'; message: string }

export interface ChatResponse {
  message: string
  actionsExecuted: ChatActionExecuted[]
  agents: AgentDefinition[]
  live: boolean
  artifacts?: ChatArtifact[]
  references?: ChatReference[]
  suggestedActions?: ChatSuggestedAction[]
  plan?: ChatAgentPlan
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
