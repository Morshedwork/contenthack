'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { AudioLines, Bot, Brain, Database, Layers, Lightbulb, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PipelineStageId =
  | 'voice-in'
  | 'parse'
  | 'models'
  | 'crustdata'
  | 'agents'
  | 'brief'
  | 'voice-out'

const STAGES: { id: PipelineStageId; label: string; icon: LucideIcon }[] = [
  { id: 'voice-in', label: 'Voice in', icon: Mic },
  { id: 'parse', label: 'Intent', icon: Brain },
  { id: 'models', label: 'Models', icon: Layers },
  { id: 'crustdata', label: 'CrustData', icon: Database },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'brief', label: 'Analysis', icon: Lightbulb },
  { id: 'voice-out', label: 'Voice out', icon: AudioLines },
]

interface DataPipelineFlowProps {
  activeStage: PipelineStageId | null
  crustdataActive?: boolean
  compact?: boolean
  className?: string
}

function stageIndex(id: PipelineStageId | null): number {
  if (!id) return -1
  return STAGES.findIndex((s) => s.id === id)
}

export function DataPipelineFlow({
  activeStage,
  crustdataActive = true,
  compact = false,
  className,
}: DataPipelineFlowProps) {
  const activeIdx = stageIndex(activeStage)

  return (
    <div className={cn('w-full flex justify-center', className)}>
      <div className="flex items-center gap-1 sm:gap-2">
        {STAGES.map((stage, i) => {
          const isActive = i === activeIdx
          const isComplete = activeIdx > i
          const isCrust = stage.id === 'crustdata'
          const dimmed = isCrust && !crustdataActive && !isComplete && !isActive
          const Icon = stage.icon

          return (
            <div key={stage.id} className="flex items-center">
              <div className={cn('relative', dimmed && 'opacity-35')}>
                {isActive && (
                  <motion.span
                    layoutId="pipeline-glow"
                    className="absolute -inset-1 rounded-full bg-violet-500/25 blur-md"
                  />
                )}
                <div
                  className={cn(
                    'relative flex items-center justify-center rounded-full border transition-all duration-500',
                    compact ? 'size-10 sm:size-11' : 'size-9',
                    isComplete && 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
                    isActive && 'border-violet-400/60 bg-violet-500/25 text-violet-100 scale-110',
                    !isComplete && !isActive && 'border-border/50 bg-secondary/30 text-muted-foreground/60',
                  )}
                >
                  <Icon className={compact ? 'size-5' : 'size-4'} />
                </div>
                {!compact && (
                  <span
                    className={cn(
                      'block text-center text-[9px] font-medium mt-1.5 uppercase tracking-wide',
                      isActive ? 'text-violet-200' : 'text-muted-foreground',
                    )}
                  >
                    {stage.label}
                  </span>
                )}
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 rounded-full bg-border/50 overflow-hidden',
                    compact ? 'w-3 sm:w-4 mx-0.5' : 'w-5 mx-0.5',
                  )}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500/70 to-violet-500/70"
                    animate={{ width: isComplete ? '100%' : isActive ? '55%' : '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function pipelineStageForStatus(
  status: 'idle' | 'listening' | 'transcribing' | 'executing' | 'speaking',
  executionPhase?: number,
): PipelineStageId | null {
  if (status === 'listening') return 'voice-in'
  if (status === 'transcribing') return 'parse'
  if (status === 'speaking') return 'voice-out'
  if (status === 'executing') {
    const phases: PipelineStageId[] = ['parse', 'models', 'crustdata', 'agents', 'brief']
    return phases[Math.min(executionPhase ?? 0, phases.length - 1)]
  }
  return null
}
