'use client'

import { motion } from 'framer-motion'
import { VoiceWaveform } from '@/components/voice/voice-waveform'
import { cn } from '@/lib/utils'
import { AudioLines, Loader2, Mic, Square } from 'lucide-react'

export type VoiceOrbStatus = 'idle' | 'listening' | 'transcribing' | 'executing' | 'speaking'

interface VoiceOrbProps {
  status: VoiceOrbStatus
  onClick: () => void
  waveformMode: 'idle' | 'listening' | 'speaking' | 'processing'
  size?: 'default' | 'compact'
}

export function VoiceOrb({ status, onClick, waveformMode, size = 'default' }: VoiceOrbProps) {
  const busy = status === 'transcribing' || status === 'executing'
  const listening = status === 'listening'
  const speaking = status === 'speaking'
  const compact = size === 'compact'

  return (
    <div className="flex flex-col items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-label={listening ? 'Stop listening' : 'Start voice command'}
        className={cn(
          'relative flex items-center justify-center rounded-full outline-none disabled:cursor-wait',
          compact ? 'size-28 sm:size-32' : 'size-36 sm:size-40',
        )}
      >
        {(listening || speaking || busy) && (
          <>
            <motion.span
              className={cn(
                'absolute inset-0 rounded-full',
                listening && 'bg-rose-500/20',
                speaking && 'bg-emerald-500/20',
                busy && 'bg-violet-500/15',
              )}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="absolute -inset-3 rounded-full border border-violet-500/20 animate-pulse" />
          </>
        )}
        <motion.span
          className={cn(
            'relative flex items-center justify-center rounded-full border shadow-2xl',
            compact ? 'size-24 sm:size-28' : 'size-[7.5rem] sm:size-[8.5rem]',
            listening
              ? 'bg-gradient-to-br from-rose-500 to-violet-600 border-rose-300/40 shadow-rose-500/40'
              : speaking
                ? 'bg-gradient-to-br from-emerald-500 to-blue-600 border-emerald-300/40 shadow-emerald-500/30'
                : busy
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-700 border-violet-300/30 shadow-violet-500/50'
                  : 'bg-gradient-to-br from-violet-500 to-blue-600 border-white/15 shadow-violet-500/40',
          )}
          whileHover={!busy ? { scale: 1.05 } : undefined}
          whileTap={!busy ? { scale: 0.97 } : undefined}
        >
          {busy ? (
            <Loader2 className={cn('text-white animate-spin', compact ? 'size-9' : 'size-11')} />
          ) : listening ? (
            <Square className={cn('text-white fill-white', compact ? 'size-7' : 'size-9')} />
          ) : speaking ? (
            <AudioLines className={cn('text-white', compact ? 'size-9' : 'size-11')} />
          ) : (
            <Mic className={cn('text-white', compact ? 'size-9' : 'size-11')} />
          )}
        </motion.span>
      </button>
      <VoiceWaveform mode={waveformMode} className={compact ? 'w-36 sm:w-40' : 'w-44 sm:w-52'} />
    </div>
  )
}

export const VOICE_STATUS_COPY: Record<VoiceOrbStatus, string> = {
  idle: 'Tap to speak',
  listening: 'Listening…',
  transcribing: 'Processing…',
  executing: 'Working…',
  speaking: 'Speaking…',
}
