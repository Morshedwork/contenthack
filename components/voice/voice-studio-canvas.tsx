'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VoiceAuraBackdrop } from '@/components/voice/voice-aura-backdrop'
import type { VoiceFlowState } from '@/components/voice/voice-flow-orb'
import type { ReactNode } from 'react'

const STATUS: Record<VoiceFlowState, string> = {
  idle: 'Tap to talk',
  connecting: 'Connecting',
  listening: 'Listening',
  speaking: 'Speaking',
  executing: 'Working',
}

interface VoiceStudioCanvasProps {
  campaignName: string
  flowState: VoiceFlowState
  statusLabel?: string
  headerTrailing?: ReactNode
  orb: ReactNode
  transcript: ReactNode
  hasTranscript: boolean
  className?: string
}

export function VoiceStudioCanvas({
  campaignName,
  flowState,
  statusLabel,
  headerTrailing,
  orb,
  transcript,
  hasTranscript,
  className,
}: VoiceStudioCanvasProps) {
  const label = statusLabel ?? STATUS[flowState]

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem]',
        'border border-white/[0.05] bg-[#06040c]',
        className,
      )}
    >
      <VoiceAuraBackdrop state={flowState} />

      <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
        <h1 className="truncate font-display text-lg sm:text-xl text-white/90">{campaignName}</h1>
        {headerTrailing}
      </div>

      <div className="relative z-10 flex min-h-[min(52vh,460px)] flex-1 flex-col items-center justify-center gap-5 px-4">
        {orb}
        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'max-w-md truncate text-center font-display text-2xl tracking-tight sm:text-[1.75rem]',
              flowState === 'executing' && 'text-amber-200',
              flowState === 'listening' && 'text-rose-200',
              flowState === 'speaking' && 'text-emerald-200',
              flowState === 'connecting' && 'text-violet-200',
              flowState === 'idle' && 'text-white/35',
            )}
          >
            {label}
          </motion.p>
        </AnimatePresence>
        {flowState === 'executing' && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-0.5 w-28 overflow-hidden rounded-full bg-amber-950/50"
          >
            <motion.div
              className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-amber-300/90 to-transparent"
              animate={{ x: ['-100%', '220%'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
            />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {hasTranscript && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex min-h-0 max-h-[38vh] flex-1 flex-col overflow-hidden border-t border-white/[0.05] bg-black/30 backdrop-blur-md"
          >
            <div className="min-h-0 flex-1 pt-1">{transcript}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
