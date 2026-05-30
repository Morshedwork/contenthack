'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, Circle, Loader2 } from 'lucide-react'

const phases = [
  {
    id: 'plan',
    label: 'Plan',
    description: 'Define goal and strategy',
    steps: ['Campaign Goal', 'Market Research', 'Topic Strategy'],
  },
  {
    id: 'create',
    label: 'Create',
    description: 'Generate content assets',
    steps: ['Content Studio', 'Video Studio'],
  },
  {
    id: 'operate',
    label: 'Operate',
    description: 'Review and distribute',
    steps: ['Approval Board', 'Calendar', 'Publishing'],
  },
  {
    id: 'grow',
    label: 'Grow',
    description: 'Leads and measurement',
    steps: ['Lead Finder', 'Outreach', 'ROI Analytics'],
  },
] as const

const allSteps = phases.flatMap((p) => p.steps)

const totalSteps = allSteps.length

function globalIndex(stepName: string) {
  return allSteps.indexOf(stepName)
}

interface WorkflowShowcaseProps {
  activeIndex?: number
}

export function WorkflowShowcase({ activeIndex = 5 }: WorkflowShowcaseProps) {
  const progressPct = Math.round(((activeIndex + 0.5) / totalSteps) * 100)

  return (
    <div className="space-y-8">
      {/* Overall progress */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-violet-300/80">
              Pipeline progress
            </p>
            <p className="mt-1 text-sm text-white/50">
              Step {activeIndex + 1} of {totalSteps} —{' '}
              <span className="text-white/80">{allSteps[activeIndex]}</span>
            </p>
          </div>
          <span className="font-display text-2xl text-white tabular-nums">{progressPct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-violet-500 to-violet-400"
            initial={{ width: 0 }}
            whileInView={{ width: `${progressPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Phased grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {phases.map((phase, phaseIdx) => {
          const phaseStart = globalIndex(phase.steps[0])
          const phaseEnd = globalIndex(phase.steps[phase.steps.length - 1])
          const phaseComplete = activeIndex > phaseEnd
          const phaseActive = activeIndex >= phaseStart && activeIndex <= phaseEnd
          const phasePending = activeIndex < phaseStart

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: phaseIdx * 0.08 }}
              className={cn(
                'relative rounded-2xl border p-5 transition-colors',
                phaseComplete && 'border-emerald-500/25 bg-emerald-500/[0.06]',
                phaseActive && 'border-violet-400/35 bg-violet-500/[0.08] shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]',
                phasePending && 'border-white/[0.08] bg-white/[0.02]',
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <span
                    className={cn(
                      'font-mono text-[10px] uppercase tracking-widest',
                      phaseComplete && 'text-emerald-400/90',
                      phaseActive && 'text-violet-300',
                      phasePending && 'text-white/35',
                    )}
                  >
                    {String(phaseIdx + 1).padStart(2, '0')} · {phase.label}
                  </span>
                  <p className="mt-1 text-xs text-white/45">{phase.description}</p>
                </div>
                {phaseComplete && (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="size-3.5" />
                  </span>
                )}
                {phaseActive && !phaseComplete && (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/25 text-violet-300">
                    <Loader2 className="size-3.5 animate-spin" />
                  </span>
                )}
              </div>

              <ul className="space-y-2">
                {phase.steps.map((step) => {
                  const idx = globalIndex(step)
                  const isComplete = idx < activeIndex
                  const isActive = idx === activeIndex
                  const isPending = idx > activeIndex

                  return (
                    <li
                      key={step}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                        isActive && 'bg-violet-500/15 ring-1 ring-violet-400/25',
                        isComplete && 'text-white/70',
                        isPending && 'text-white/40',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full border',
                          isComplete && 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400',
                          isActive && 'border-violet-400/50 bg-violet-500/20 text-violet-300',
                          isPending && 'border-white/15 bg-white/[0.03] text-white/30',
                        )}
                      >
                        {isComplete ? (
                          <Check className="size-3" />
                        ) : isActive ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Circle className="size-3" />
                        )}
                      </span>
                      <span className={cn('leading-tight', isActive && 'font-medium text-white')}>
                        {step}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          )
        })}
      </div>

    </div>
  )
}
