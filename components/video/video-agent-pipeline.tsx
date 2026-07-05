'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { WorkflowPipeline } from '@/components/agents/workflow-pipeline'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import {
  runVideoAgentPipeline,
  type VideoWorkflowProgress,
} from '@/lib/agents/video-client'
import {
  VIDEO_PIPELINE_LABELS,
  type VideoWorkflowKind,
  type VideoWorkflowStepResult,
} from '@/lib/agents/video-pipeline'
import type { VideoFormat, VideoPromotionType } from '@/types'
import { Bot, ExternalLink, Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'

interface VideoAgentPipelineProps {
  kind: VideoWorkflowKind
  title: string
  description: string
  draftCount: number
  topicCount: number
  promotionType?: VideoPromotionType
  contentDraftIds?: string[]
  format?: VideoFormat
  count?: number
  topic?: string
  onComplete: () => void
  runLabel?: string
  accent?: 'violet' | 'amber' | 'emerald'
}

const ACCENT_BORDER: Record<NonNullable<VideoAgentPipelineProps['accent']>, string> = {
  violet: 'border-violet-500/20 bg-violet-500/5',
  amber: 'border-amber-500/20 bg-amber-500/5',
  emerald: 'border-emerald-500/20 bg-emerald-500/5',
}

export function VideoAgentPipeline({
  kind,
  title,
  description,
  draftCount,
  topicCount,
  promotionType,
  contentDraftIds,
  format = 'reel',
  count = 3,
  topic,
  onComplete,
  runLabel,
  accent = 'violet',
}: VideoAgentPipelineProps) {
  const [running, setRunning] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [steps, setSteps] = useState<VideoWorkflowStepResult[]>([])
  const [customPromptDetails, setCustomPromptDetails] = useState('')
  const [renderVideos, setRenderVideos] = useState(false)

  const pipelineLabels = VIDEO_PIPELINE_LABELS[kind]

  const handleRun = useCallback(async () => {
    setRunning(true)
    setSteps([])
    setActiveIndex(0)
    try {
      const { steps: results } = await runVideoAgentPipeline(
        {
          kind,
          promotionType,
          contentDraftIds,
          format,
          count,
          topic,
          customPromptDetails: customPromptDetails.trim() || undefined,
          renderVideos,
          mergeScripts: true,
        },
        (progress: VideoWorkflowProgress) => {
          if (progress.phase === 'running') {
            const idx = pipelineLabels.findIndex((label) =>
              progress.agentName.toLowerCase().includes(label.toLowerCase()),
            )
            setActiveIndex(idx >= 0 ? idx : 0)
          } else {
            setSteps((prev) => {
              const existing = prev.findIndex((s) => s.agentId === progress.agentId)
              if (existing >= 0) {
                const next = [...prev]
                next[existing] = progress
                return next
              }
              return [...prev, progress]
            })
            const completed = steps.length + 1
            setActiveIndex(Math.min(completed, pipelineLabels.length - 1))
          }
        },
        { draftCount, topicCount },
      )

      setSteps(results)
      setActiveIndex(pipelineLabels.length)
      onComplete()

      const completed = results.filter((s) => s.status === 'completed').length
      const skipped = results.filter((s) => s.status === 'skipped').length
      const failed = results.filter((s) => s.status === 'failed').length

      if (failed > 0) {
        toast.error(`Agent pipeline stopped — ${failed} step${failed === 1 ? '' : 's'} failed`)
      } else {
        toast.success(
          `Multi-agent pipeline complete — ${completed} agent${completed === 1 ? '' : 's'} ran${skipped ? `, ${skipped} skipped` : ''}`,
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Agent pipeline failed')
    } finally {
      setRunning(false)
    }
  }, [
    kind,
    promotionType,
    contentDraftIds,
    format,
    count,
    topic,
    customPromptDetails,
    renderVideos,
    draftCount,
    topicCount,
    onComplete,
    pipelineLabels,
  ])

  return (
    <Card className={ACCENT_BORDER[accent]}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="size-4" />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border border-border/60 bg-background/40 p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-3">
            Multi-agent pipeline
          </p>
          <WorkflowPipeline
            steps={pipelineLabels}
            activeIndex={running ? Math.max(activeIndex, 0) : steps.length > 0 ? pipelineLabels.length : -1}
            compact
          />
        </div>

        {steps.length > 0 && (
          <div className="flex flex-col gap-2">
            {steps.map((step) => (
              <div
                key={`${step.agentId}-${step.label}`}
                className="flex items-start justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium">{step.agentName}</p>
                  <p className="text-muted-foreground line-clamp-2">{step.lastOutput}</p>
                </div>
                <Badge
                  variant={
                    step.status === 'completed'
                      ? 'default'
                      : step.status === 'skipped'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="shrink-0 text-[10px] capitalize"
                >
                  {step.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        <CustomPromptPanel
          value={customPromptDetails}
          onChange={setCustomPromptDetails}
          description="Instructions passed to every agent in this pipeline."
          placeholder="e.g. Japan SME focus, 30s Reels, bold captions, free audit CTA..."
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={renderVideos} onCheckedChange={(v) => setRenderVideos(v === true)} />
          Also render videos with PixVerse after scripts (batch, up to 3)
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/agents">
              <ExternalLink data-icon="inline-start" />
              Agent Command Center
            </Link>
          </Button>
          <Button onClick={() => void handleRun()} disabled={running}>
            {running ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Play data-icon="inline-start" />
            )}
            {running ? 'Agents running…' : runLabel ?? 'Run Agent Pipeline'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** Full campaign orchestrator — strategy through scheduler. */
export function FullReelCampaignPipeline({
  draftCount,
  topicCount,
  onComplete,
}: {
  draftCount: number
  topicCount: number
  onComplete: () => void
}) {
  return (
    <VideoAgentPipeline
      kind="full_reel_campaign"
      title="Full Reel Campaign (Multi-Agent)"
      description="Strategy Agent → Content Agent → Video Agent → Safety Agent → Scheduler Agent — end-to-end reel production."
      draftCount={draftCount}
      topicCount={topicCount}
      accent="emerald"
      runLabel="Run Full Reel Campaign"
      onComplete={onComplete}
    />
  )
}
