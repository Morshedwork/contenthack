'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { VoiceFlowState } from '@/components/voice/voice-flow-orb'

const AURA: Record<VoiceFlowState, { glow: string; wash: string; arc: string }> = {
  idle: {
    glow: 'rgba(99,102,241,0.18)',
    wash: 'rgba(37,99,235,0.1)',
    arc: 'rgba(59,130,246,0.28)',
  },
  connecting: {
    glow: 'rgba(129,140,248,0.26)',
    wash: 'rgba(79,70,229,0.14)',
    arc: 'rgba(96,165,250,0.34)',
  },
  listening: {
    glow: 'rgba(37,99,235,0.3)',
    wash: 'rgba(29,78,216,0.16)',
    arc: 'rgba(59,130,246,0.42)',
  },
  speaking: {
    glow: 'rgba(6,182,212,0.28)',
    wash: 'rgba(8,145,178,0.14)',
    arc: 'rgba(34,211,238,0.38)',
  },
  executing: {
    glow: 'rgba(139,92,246,0.3)',
    wash: 'rgba(124,58,237,0.16)',
    arc: 'rgba(168,85,247,0.4)',
  },
}

const BREATH: Record<VoiceFlowState, number> = {
  idle: 7,
  connecting: 3.5,
  listening: 2.8,
  speaking: 2.2,
  executing: 1.6,
}

/** Smooth gradient aurora — no particles or dots. */
export function VoiceAuraBackdrop({ state, className }: { state: VoiceFlowState; className?: string }) {
  const colors = AURA[state]
  const breath = BREATH[state]

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <AnimatePresence mode="sync">
        <motion.div
          key={state}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute -inset-[30%]"
            animate={
              state === 'executing'
                ? { rotate: [0, 12, 0], scale: [1, 1.08, 1] }
                : { rotate: [0, 6, 0], scale: [1, 1.05, 1] }
            }
            transition={{ duration: state === 'executing' ? 2.4 : 18, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(ellipse 65% 50% at 50% 38%, ${colors.glow}, transparent 68%)`,
            }}
          />
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: breath, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(ellipse 95% 55% at 50% 100%, ${colors.arc}, transparent 62%)`,
            }}
          />
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.2, 0.38, 0.2] }}
            transition={{ duration: breath * 1.15, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(ellipse 70% 45% at 50% 38%, ${colors.glow}, transparent 68%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#05070a] via-[#05070a]/85 to-transparent" />
    </div>
  )
}
