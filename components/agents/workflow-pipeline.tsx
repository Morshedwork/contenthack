'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface WorkflowPipelineProps {
  steps: string[]
  activeIndex?: number
  compact?: boolean
  className?: string
}

export function WorkflowPipeline({ steps, activeIndex = 3, compact = false, className }: WorkflowPipelineProps) {
  return (
    <div
      className={cn(
        'w-full',
        !compact && 'overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center',
          compact ? 'min-w-0 flex-wrap justify-center gap-x-1 gap-y-2' : 'min-w-max gap-2',
        )}
      >
        {steps.map((step, i) => {
          const isComplete = i < activeIndex
          const isActive = i === activeIndex
          const isPending = i > activeIndex

          return (
            <div key={step} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className={cn(
                  'flex flex-col items-center',
                  compact ? 'min-w-[72px]' : 'min-w-[90px]',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 transition-colors',
                    compact ? 'size-8' : 'size-10',
                    isComplete && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
                    isActive && 'border-primary bg-primary/10 text-primary',
                    isPending && 'border-border bg-secondary/50 text-muted-foreground',
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className={compact ? 'size-3.5' : 'size-4'} />
                  ) : isActive ? (
                    <Loader2 className={cn('animate-spin', compact ? 'size-3.5' : 'size-4')} />
                  ) : (
                    <Circle className={compact ? 'size-3.5' : 'size-4'} />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-center leading-tight',
                    compact ? 'text-[9px]' : 'text-[10px]',
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
                  )}
                >
                  {step}
                </span>
              </motion.div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 mx-0.5 rounded-full transition-colors',
                    compact ? 'w-4' : 'w-6',
                    i < activeIndex ? 'bg-emerald-500/40' : 'bg-border',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
