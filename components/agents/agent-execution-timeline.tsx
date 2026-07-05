'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ChatAgentPlan, ChatPlanStepStatus } from '@/lib/agents/types'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'

const statusIcon: Record<ChatPlanStepStatus, typeof Circle> = {
  pending: Circle,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  skipped: Circle,
}

const statusColor: Record<ChatPlanStepStatus, string> = {
  pending: 'text-muted-foreground/50',
  running: 'text-violet-400 animate-spin',
  completed: 'text-emerald-400',
  failed: 'text-rose-400',
  skipped: 'text-muted-foreground/40',
}

interface AgentExecutionTimelineProps {
  plan?: ChatAgentPlan
  phase?: 'planning' | 'executing' | 'summarizing' | 'done'
  compact?: boolean
  className?: string
}

export function AgentExecutionTimeline({
  plan,
  phase = 'executing',
  compact,
  className,
}: AgentExecutionTimelineProps) {
  if (!plan?.steps.length) {
    if (phase === 'summarizing') {
      return (
        <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
          <Loader2 className="size-4 animate-spin text-violet-400" />
          Synthesizing results…
        </div>
      )
    }
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="size-4 animate-spin text-violet-400" />
        {phase === 'planning' ? 'Planning agent workflow…' : 'Thinking…'}
      </div>
    )
  }

  const completed = plan.steps.filter((s) => s.status === 'completed').length
  const total = plan.steps.length

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
            Agent plan
          </p>
          {phase !== 'done' && (
            <Badge variant="secondary" className="text-[10px] tabular-nums">
              {completed}/{total}
            </Badge>
          )}
        </div>
        {plan.reasoning && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{plan.reasoning}</p>
        )}
      </div>

      <ol className="space-y-1.5">
        {plan.steps.map((step, i) => {
          const Icon = statusIcon[step.status]
          const isRunning = step.status === 'running'
          return (
            <li
              key={step.id}
              className={cn(
                'flex gap-2.5 rounded-lg border px-2.5 py-2 transition-colors',
                isRunning && 'border-violet-500/40 bg-violet-500/10',
                step.status === 'completed' && 'border-emerald-500/20 bg-emerald-500/5',
                step.status === 'failed' && 'border-rose-500/20 bg-rose-500/5',
                step.status === 'pending' && 'border-border/40 bg-secondary/20',
              )}
            >
              <div className="flex flex-col items-center pt-0.5">
                <Icon className={cn('size-3.5 shrink-0', statusColor[step.status], isRunning && 'animate-spin')} />
                {i < plan.steps.length - 1 && (
                  <span className="w-px flex-1 min-h-[8px] bg-border/50 mt-1" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('font-medium', compact ? 'text-[11px]' : 'text-xs')}>
                    {step.agentName}
                  </span>
                  {step.href && step.status === 'completed' && (
                    <Link
                      href={step.href}
                      className="text-[10px] text-violet-300 hover:underline"
                    >
                      View →
                    </Link>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">{step.label}</p>
                {step.output && step.status !== 'pending' && (
                  <p className="text-[10px] text-foreground/70 mt-0.5 line-clamp-2">{step.output}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {phase === 'summarizing' && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
          <Loader2 className="size-3 animate-spin text-violet-400" />
          Writing summary with links and previews…
        </div>
      )}
    </div>
  )
}
