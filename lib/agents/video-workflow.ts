import 'server-only'

import { runAgentTask } from '@/lib/agents/engine'
import { generateMarketingVideo } from '@/lib/ai/media-generate'
import { withPixverse } from '@/lib/ai/pixverse'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { normalizePixverseVideoParams } from '@/lib/models/media-options'
import type { AgentDefinition } from '@/types'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import { resolveWorkspaceContext } from '@/lib/workspace/context'
import { demoAgents } from '@/lib/demo/data'
import {
  buildVideoAgentContext,
  shouldSkipPipelineStep,
  VIDEO_PIPELINE_STEPS,
  type VideoWorkflowInput,
  type VideoWorkflowStepResult,
  type VideoWorkflowStepRunning,
} from '@/lib/agents/video-pipeline'

export type {
  VideoWorkflowKind,
  VideoWorkflowInput,
  VideoAgentContext,
  VideoWorkflowStepResult,
  VideoWorkflowStepRunning,
} from '@/lib/agents/video-pipeline'

export { VIDEO_PIPELINE_STEPS, VIDEO_PIPELINE_LABELS, buildVideoAgentContext } from '@/lib/agents/video-pipeline'

export async function executeVideoWorkflow(
  input: VideoWorkflowInput,
  options?: {
    allowAnonymous?: boolean
    onStep?: (step: VideoWorkflowStepRunning) => void
  },
): Promise<{
  workflowId: string
  kind: VideoWorkflowInput['kind']
  steps: VideoWorkflowStepResult[]
  agents: AgentDefinition[]
  live: boolean
  renderedVideos: number
}> {
  const ctx = await resolveWorkspaceContext({ allowAnonymous: options?.allowAnonymous })
  const workflowId = `vwf-${Date.now()}`
  const pipeline = VIDEO_PIPELINE_STEPS[input.kind]
  const videoContext = buildVideoAgentContext(input)
  const customPromptDetails = input.customPromptDetails
  const steps: VideoWorkflowStepResult[] = []
  let anyLive = false
  let renderedVideos = 0

  for (const step of pipeline) {
    const ws = await getWorkspace(ctx)
    const snapshot = { draftCount: ws.contentDrafts.length, topicCount: ws.topics.length }

    if (shouldSkipPipelineStep(input.kind, step.agentId, snapshot)) {
      const skipped: VideoWorkflowStepResult = {
        agentId: step.agentId,
        agentName: step.label,
        label: step.task,
        status: 'skipped',
        lastOutput: 'Already available — skipped',
      }
      steps.push(skipped)
      continue
    }

    options?.onStep?.({
      agentId: step.agentId,
      agentName: step.label,
      label: step.task,
      status: 'running',
      lastOutput: step.task,
    })

    try {
      const reviewVideoScripts = step.agentId === 'safety'
      const { agent, live } = await runAgentTask(step.agentId, {
        customPromptDetails,
        allowAnonymous: options?.allowAnonymous,
        videoContext: step.agentId === 'video' ? videoContext : undefined,
        reviewVideoScripts,
      })
      if (live) anyLive = true
      steps.push({
        agentId: step.agentId,
        agentName: agent.name,
        label: step.task,
        status: agent.status === 'failed' ? 'failed' : 'completed',
        lastOutput: agent.lastOutput,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Agent run failed'
      steps.push({
        agentId: step.agentId,
        agentName: step.label,
        label: step.task,
        status: 'failed',
        lastOutput: message,
      })
      break
    }
  }

  if (input.renderVideos) {
    const ws = await getWorkspace(ctx)
    const scripts = ws.videoScripts.filter((s) => s.aiVideoPrompt).slice(0, 3)
    const { duration, quality } = normalizePixverseVideoParams({
      model: 'v4.5',
      duration: 5,
      quality: '540p',
    })

    for (const script of scripts) {
      try {
        const { result: video, live } = await withPixverse(() =>
          generateMarketingVideo({
            prompt: script.aiVideoPrompt,
            model: 'v4.5',
            duration,
            quality,
            aspectRatio: '9:16',
            brandProfile: ws.brandProfile,
            customPromptDetails,
            wait: true,
            modelRouting: ws.modelRouting,
            research: ws.research,
            signals: mergeCrustdataSignals({ topic: script.title }, ws.brandProfile, ws.research, ws.campaign),
          }),
        )
        if (live) anyLive = true
        renderedVideos++
        const videos = [video, ...(ws.generatedVideos ?? [])].slice(0, 10)
        await patchWorkspace({ generatedVideos: videos }, ctx)
      } catch {
        // Continue batch render on individual failures
      }
    }

    if (renderedVideos > 0) {
      steps.push({
        agentId: 'video',
        agentName: 'Media Render',
        label: 'PixVerse batch render',
        status: 'completed',
        lastOutput: `${renderedVideos} reel video${renderedVideos === 1 ? '' : 's'} rendered`,
      })
    }
  }

  await patchWorkspace(
    {
      lastWorkflow: {
        workflowId,
        live: anyLive,
        completedAt: new Date().toISOString(),
        estimatedTimeSaved: `${Math.max(steps.filter((s) => s.status === 'completed').length * 0.5, 1)} hours`,
      },
    },
    ctx,
  )

  const finalWs = await getWorkspace(ctx)
  return {
    workflowId,
    kind: input.kind,
    steps,
    agents: finalWs.agents.length ? finalWs.agents : demoAgents,
    live: anyLive,
    renderedVideos,
  }
}
