import type { VideoFormat, VideoPromotionType } from '@/types'
import type { AgentId } from '@/lib/agents/planner'

export type VideoWorkflowKind = 'content_reels' | 'promotion_reels' | 'full_reel_campaign'

export interface VideoPipelineStep {
  agentId: AgentId
  label: string
  task: string
}

export interface VideoWorkflowInput {
  kind: VideoWorkflowKind
  promotionType?: VideoPromotionType
  contentDraftIds?: string[]
  format?: VideoFormat
  count?: number
  topic?: string
  customPromptDetails?: string
  renderVideos?: boolean
  mergeScripts?: boolean
}

export interface VideoAgentContext {
  mode: 'content' | 'promotion' | 'topic'
  promotionType?: VideoPromotionType
  contentDraftIds?: string[]
  format?: VideoFormat
  count?: number
  topic?: string
  mergeScripts?: boolean
}

export interface VideoWorkflowStepResult {
  agentId: string
  agentName: string
  label: string
  status: 'completed' | 'failed' | 'skipped'
  lastOutput: string
}

export interface VideoWorkflowStepRunning {
  agentId: string
  agentName: string
  label: string
  status: 'running'
  lastOutput: string
}

export const VIDEO_PIPELINE_STEPS: Record<VideoWorkflowKind, VideoPipelineStep[]> = {
  content_reels: [
    { agentId: 'content', label: 'Content Agent', task: 'Ensure platform posts exist' },
    { agentId: 'video', label: 'Video Agent', task: 'Adapt content into reel scripts' },
    { agentId: 'safety', label: 'Safety Agent', task: 'Review scripts for compliance' },
    { agentId: 'scheduler', label: 'Scheduler Agent', task: 'Queue reels on calendar' },
  ],
  promotion_reels: [
    { agentId: 'video', label: 'Video Agent', task: 'Write promotion reel scripts' },
    { agentId: 'safety', label: 'Safety Agent', task: 'Review promotional claims' },
    { agentId: 'scheduler', label: 'Scheduler Agent', task: 'Schedule promo reels' },
  ],
  full_reel_campaign: [
    { agentId: 'strategy', label: 'Strategy Agent', task: 'Topic & pillar strategy' },
    { agentId: 'content', label: 'Content Agent', task: 'Multi-platform post drafts' },
    { agentId: 'video', label: 'Video Agent', task: 'Reel scripts from content' },
    { agentId: 'safety', label: 'Safety Agent', task: 'Brand safety review' },
    { agentId: 'scheduler', label: 'Scheduler Agent', task: 'Calendar optimization' },
  ],
}

export const VIDEO_PIPELINE_LABELS: Record<VideoWorkflowKind, string[]> = {
  content_reels: ['Content', 'Video', 'Safety', 'Scheduler'],
  promotion_reels: ['Video', 'Safety', 'Scheduler'],
  full_reel_campaign: ['Strategy', 'Content', 'Video', 'Safety', 'Scheduler'],
}

export function buildVideoAgentContext(input: VideoWorkflowInput): VideoAgentContext {
  if (input.kind === 'promotion_reels') {
    return {
      mode: 'promotion',
      promotionType: input.promotionType ?? 'lead_gen',
      format: input.format ?? 'reel',
      count: input.count ?? 3,
      topic: input.topic,
      mergeScripts: input.mergeScripts ?? true,
    }
  }
  if (input.kind === 'content_reels') {
    return {
      mode: 'content',
      contentDraftIds: input.contentDraftIds,
      format: input.format ?? 'reel',
      mergeScripts: input.mergeScripts ?? true,
    }
  }
  return {
    mode: 'content',
    format: input.format ?? 'reel',
    mergeScripts: input.mergeScripts ?? true,
  }
}

export function shouldSkipPipelineStep(
  kind: VideoWorkflowKind,
  agentId: AgentId,
  snapshot: { draftCount: number; topicCount: number },
): boolean {
  if (kind === 'content_reels' && agentId === 'content' && snapshot.draftCount > 0) return true
  if (kind === 'full_reel_campaign') {
    if (agentId === 'strategy' && snapshot.topicCount > 0) return true
    if (agentId === 'content' && snapshot.draftCount > 0) return true
  }
  return false
}
