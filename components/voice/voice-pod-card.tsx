'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VoiceAuraBackdrop } from '@/components/voice/voice-aura-backdrop'
import { VoiceFlowOrb, type VoiceFlowState } from '@/components/voice/voice-flow-orb'
import type { ReactNode } from 'react'

const STATUS: Record<VoiceFlowState, string> = {
  idle: 'Tap to talk',
  connecting: 'Connecting',
  listening: 'Listening',
  speaking: 'Speaking',
  executing: 'Working',
}

const STATUS_COLOR: Record<VoiceFlowState, string> = {
  idle: 'text-muted-foreground',
  connecting: 'text-violet-300',
  listening: 'text-rose-300',
  speaking: 'text-emerald-300',
  executing: 'text-amber-300',
}

interface VoicePodCardProps {
  campaignName?: string
  flowState?: VoiceFlowState
  statusLabel?: string
  headerTrailing?: ReactNode
  orb?: ReactNode
  transcript?: ReactNode
  hasTranscript?: boolean
  loading?: boolean
  loadingLabel?: string
  className?: string
}

function LoadingShimmerLines() {
  return (
    <div className="mt-5 flex w-full flex-col gap-2 px-1" aria-hidden>
      {[0.85, 0.65, 0.45].map((width, i) => (
        <div key={i} className="relative h-2 overflow-hidden rounded-full bg-white/[0.04]">
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-violet-300/50 to-transparent"
            animate={{ x: ['-120%', '340%'] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: [0.45, 0, 0.55, 1],
              delay: i * 0.18,
            }}
            style={{ width: `${width * 100}%`, maxWidth: '40%' }}
          />
        </div>
      ))}
    </div>
  )
}

function ProgressShimmer({ tone }: { tone: 'violet' | 'amber' }) {
  const bar = tone === 'amber' ? 'via-amber-300/90' : 'via-violet-300/80'
  const track = tone === 'amber' ? 'bg-amber-950/40' : 'bg-violet-950/40'

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.5 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0 }}
      className={cn('relative mt-3 h-0.5 w-24 overflow-hidden rounded-full', track)}
    >
      <motion.div
        className={cn(
          'absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent to-transparent',
          bar,
        )}
        animate={{ x: ['-100%', '220%'] }}
        transition={{ duration: 1.15, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      />
    </motion.div>
  )
}

/** Compact centered voice card — not full-page. */
export function VoicePodCard({
  campaignName = 'Voice',
  flowState = 'idle',
  statusLabel,
  headerTrailing,
  orb,
  transcript,
  hasTranscript,
  loading,
  loadingLabel = 'Starting voice',
  className,
}: VoicePodCardProps) {
  const state = loading ? 'connecting' : flowState
  const label = loading ? loadingLabel : (statusLabel ?? STATUS[state])
  const showProgress = loading || state === 'connecting' || state === 'executing'
  const progressTone = state === 'executing' ? 'amber' : 'violet'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl',
        'border border-white/[0.08] bg-card/55 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.55)] backdrop-blur-xl',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-rose-500/8 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <p className="min-w-0 truncate text-sm font-medium text-foreground/90">{campaignName}</p>
        {headerTrailing}
      </div>

      <div className="relative px-4 py-5 sm:px-5 sm:py-6">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-[#07050f]/90">
          <VoiceAuraBackdrop state={state} className="rounded-xl" />

          <div className="relative z-10 flex flex-col items-center px-4 py-7 sm:py-8">
            {loading ? (
              <VoiceFlowOrb state="connecting" size="lg" />
            ) : (
              orb
            )}

            <AnimatePresence mode="wait">
              <motion.p
                key={label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'mt-4 max-w-[16rem] truncate text-center text-base font-medium tracking-tight',
                  loading && 'text-violet-200/90',
                  !loading && STATUS_COLOR[state],
                )}
              >
                {label}
              </motion.p>
            </AnimatePresence>

            <AnimatePresence>
              {showProgress && <ProgressShimmer tone={progressTone} />}
            </AnimatePresence>

            {loading && <LoadingShimmerLines />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!loading && hasTranscript && transcript && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-white/[0.06] bg-black/20"
          >
            <div className="max-h-56 min-h-[4.5rem] overflow-hidden sm:max-h-64">{transcript}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
