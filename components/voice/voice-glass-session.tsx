'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VoiceSineWaveform } from '@/components/voice/voice-sine-waveform'
import type { VoiceFlowState } from '@/components/voice/voice-flow-orb'

const WAVEFORM_MODE: Record<VoiceFlowState, 'idle' | 'listening' | 'speaking' | 'processing'> = {
  idle: 'idle',
  connecting: 'processing',
  listening: 'listening',
  speaking: 'speaking',
  executing: 'processing',
}

interface VoiceGlassSessionProps {
  flowState: VoiceFlowState
  transcript?: string
  statusLabel?: string
  micControl?: ReactNode
  onDismiss?: () => void
  showDismiss?: boolean
  className?: string
}

/** Glassmorphism live-session card — transcript, sine waves, mic slot. */
export function VoiceGlassSession({
  flowState,
  transcript,
  statusLabel,
  micControl,
  onDismiss,
  showDismiss = false,
  className,
}: VoiceGlassSessionProps) {
  const active = flowState !== 'idle'
  const displayText =
    transcript?.trim() ||
    (active
      ? statusLabel ?? 'Listening…'
      : 'Start a live conversation and delegate work to your ContentOps agent team.')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative w-full max-w-lg overflow-hidden rounded-[1.35rem]',
        'border border-sky-300/15 bg-white/[0.07] shadow-[0_24px_80px_-24px_rgba(37,99,235,0.45)] backdrop-blur-[20px]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_at_50%_100%,rgba(59,130,246,0.22),transparent_70%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          backgroundPosition: '0 100%',
          maskImage: 'linear-gradient(to top, black 0%, transparent 55%)',
        }}
      />

      {showDismiss && onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close session"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      ) : null}

      <div className="relative z-10 flex flex-col gap-4 px-5 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
        <AnimatePresence mode="wait">
          <motion.p
            key={displayText.slice(0, 48)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className="min-h-[3.25rem] text-center text-sm leading-relaxed text-white/90 sm:text-[0.95rem]"
          >
            {displayText.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={i} className="font-semibold text-white">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
            {active && flowState === 'listening' ? (
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-sky-200"
              >
                …
              </motion.span>
            ) : null}
          </motion.p>
        </AnimatePresence>

        <VoiceSineWaveform mode={WAVEFORM_MODE[flowState]} height={80} className="mx-auto max-w-md" />

        {micControl ? <div className="flex justify-center pt-1">{micControl}</div> : null}
      </div>
    </motion.div>
  )
}
