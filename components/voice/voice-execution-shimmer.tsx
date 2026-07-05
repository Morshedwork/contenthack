'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface VoiceExecutionShimmerProps {
  label?: string
  className?: string
}

/** Indeterminate execution bar — smooth sweep, no spinner dots. */
export function VoiceExecutionShimmer({ label = 'Working', className }: VoiceExecutionShimmerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'overflow-hidden rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3',
        className,
      )}
    >
      <p className="text-sm font-medium text-amber-100/90">{label}</p>
      <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-amber-950/40">
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-amber-300/90 to-transparent"
          animate={{ x: ['-100%', '320%'] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
        />
      </div>
    </motion.div>
  )
}
