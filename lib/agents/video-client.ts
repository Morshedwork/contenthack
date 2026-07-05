import type { AgentDefinition } from '@/types'
import type {
  VideoWorkflowInput,
  VideoWorkflowStepResult,
  VideoWorkflowKind,
} from '@/lib/agents/video-pipeline'
import { fetchAgentStatus } from '@/lib/agents/client'
import {
  buildVideoAgentContext,
  shouldSkipPipelineStep,
  VIDEO_PIPELINE_STEPS,
} from '@/lib/agents/video-pipeline'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string }

async function parseApi<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiEnvelope<T>
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || `Request failed (${res.status})`)
  }
  return json.data
}

export type VideoWorkflowProgress = VideoWorkflowStepResult & {
  phase: 'running' | 'done'
}

async function runAgentWithContext(
  agentId: string,
  customPromptDetails?: string,
  extras?: {
    videoContext?: ReturnType<typeof buildVideoAgentContext>
    reviewVideoScripts?: boolean
  },
): Promise<{ agent: AgentDefinition; live: boolean }> {
  return parseApi(
    await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        customPromptDetails,
        videoContext: extras?.videoContext,
        reviewVideoScripts: extras?.reviewVideoScripts,
      }),
    }),
  )
}

/** Server-side batch workflow — all agents in one request (best for renderVideos). */
export async function runVideoWorkflowServer(input: VideoWorkflowInput): Promise<{
  workflowId: string
  kind: VideoWorkflowKind
  steps: VideoWorkflowStepResult[]
  agents: AgentDefinition[]
  live: boolean
  renderedVideos: number
}> {
  return parseApi(
    await fetch('/api/video/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
}

/** Client-side multi-agent orchestration with live step callbacks. */
export async function runVideoAgentPipeline(
  input: VideoWorkflowInput,
  onProgress: (step: VideoWorkflowProgress) => void,
  snapshot?: { draftCount: number; topicCount: number },
): Promise<{ steps: VideoWorkflowStepResult[]; agents: AgentDefinition[] }> {
  const pipeline = VIDEO_PIPELINE_STEPS[input.kind]
  const videoContext = buildVideoAgentContext(input)
  const customPromptDetails = input.customPromptDetails
  const wsSnapshot = snapshot ?? { draftCount: 0, topicCount: 0 }
  const steps: VideoWorkflowStepResult[] = []

  for (const step of pipeline) {
    if (shouldSkipPipelineStep(input.kind, step.agentId, wsSnapshot)) {
      const skipped: VideoWorkflowStepResult = {
        agentId: step.agentId,
        agentName: step.label,
        label: step.task,
        status: 'skipped',
        lastOutput: 'Already available — skipped',
      }
      steps.push(skipped)
      onProgress({ ...skipped, phase: 'done' })
      continue
    }

    onProgress({
      agentId: step.agentId,
      agentName: step.label,
      label: step.task,
      status: 'completed',
      lastOutput: step.task,
      phase: 'running',
    })

    try {
      const { agent } = await runAgentWithContext(step.agentId, customPromptDetails, {
        videoContext: step.agentId === 'video' ? videoContext : undefined,
        reviewVideoScripts: step.agentId === 'safety',
      })
      const result: VideoWorkflowStepResult = {
        agentId: step.agentId,
        agentName: agent.name,
        label: step.task,
        status: agent.status === 'failed' ? 'failed' : 'completed',
        lastOutput: agent.lastOutput,
      }
      steps.push(result)
      onProgress({ ...result, phase: 'done' })
      if (result.status === 'failed') break
    } catch (err) {
      const failed: VideoWorkflowStepResult = {
        agentId: step.agentId,
        agentName: step.label,
        label: step.task,
        status: 'failed',
        lastOutput: err instanceof Error ? err.message : 'Agent run failed',
      }
      steps.push(failed)
      onProgress({ ...failed, phase: 'done' })
      break
    }
  }

  if (input.renderVideos && steps.every((s) => s.status !== 'failed')) {
    onProgress({
      agentId: 'render',
      agentName: 'Media Render',
      label: 'PixVerse batch render',
      status: 'completed',
      lastOutput: 'Rendering reel videos…',
      phase: 'running',
    })
    try {
      const statusRes = await fetch('/api/agents/taskStatus')
      const statusJson = (await statusRes.json()) as ApiEnvelope<{
        agents: AgentDefinition[]
      }>
      const wsRes = await fetch('/api/workspace')
      const wsJson = (await wsRes.json()) as ApiEnvelope<{
        videoScripts?: { id: string; aiVideoPrompt: string; title: string }[]
      }>
      const scripts = (wsJson.data?.videoScripts ?? [])
        .filter((s) => s.aiVideoPrompt)
        .slice(0, 3)
      let rendered = 0
      for (const script of scripts) {
        const res = await fetch('/api/media/video/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: script.aiVideoPrompt, aspectRatio: '9:16', duration: 5 }),
        })
        const json = (await res.json()) as ApiEnvelope<unknown>
        if (json.success) rendered++
      }
      const renderStep: VideoWorkflowStepResult = {
        agentId: 'render',
        agentName: 'Media Render',
        label: 'PixVerse batch render',
        status: 'completed',
        lastOutput: `${rendered} reel video${rendered === 1 ? '' : 's'} rendered`,
      }
      steps.push(renderStep)
      onProgress({ ...renderStep, phase: 'done' })
      const agents = statusJson.data?.agents ?? (await fetchAgentStatus()).agents
      return { steps, agents }
    } catch {
      // Fall through
    }
  }

  const { agents } = await fetchAgentStatus()
  return { steps, agents }
}
