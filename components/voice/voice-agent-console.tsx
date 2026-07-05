'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VoiceAuraBackdrop } from '@/components/voice/voice-aura-backdrop'
import type { VoiceFlowState } from '@/components/voice/voice-flow-orb'
import { VoiceParticleSphere } from '@/components/voice/voice-particle-sphere'
import { Mic, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

const STATUS: Record<VoiceFlowState, string> = {
  idle: 'Tap to talk',
  connecting: 'Connecting',
  listening: 'Listening',
  speaking: 'Speaking',
  executing: 'Working',
}

const RING: Record<VoiceFlowState, string> = {
  idle: 'from-violet-500/40 via-violet-400/10 to-violet-600/40',
  connecting: 'from-violet-400 via-fuchsia-400/30 to-violet-500',
  listening: 'from-rose-500 via-rose-400/20 to-rose-600',
  speaking: 'from-emerald-500 via-teal-400/25 to-emerald-600',
  executing: 'from-amber-400 via-violet-500/40 to-amber-500',
}

const CHIP: Record<VoiceFlowState, string> = {
  idle: 'bg-white/[0.04] text-muted-foreground border-white/10',
  connecting: 'bg-sky-500/15 text-sky-200 border-sky-400/25',
  listening: 'bg-blue-500/15 text-blue-200 border-blue-400/25',
  speaking: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/25',
  executing: 'bg-violet-500/15 text-violet-100 border-violet-400/25',
}

interface VoiceAgentConsoleProps {
  campaignName?: string
  flowState?: VoiceFlowState
  statusLabel?: string
  footerTrailing?: ReactNode
  agent?: ReactNode
  transcript?: ReactNode
  hasTranscript?: boolean
  loading?: boolean
  loadingLabel?: string
  className?: string
}

function StreamSkeleton() {
  return (
    <div className="flex h-full min-h-[11rem] flex-col justify-center gap-2.5 px-1" aria-hidden>
      {[0.92, 0.72, 0.55, 0.38].map((w, i) => (
        <div key={i} className="relative h-2 overflow-hidden rounded-full bg-white/[0.04]">
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-violet-300/45 to-transparent"
            animate={{ x: ['-120%', '340%'] }}
            transition={{
              duration: 1.35,
              repeat: Infinity,
              ease: [0.45, 0, 0.55, 1],
              delay: i * 0.12,
            }}
            style={{ maxWidth: `${w * 100}%` }}
          />
        </div>
      ))}
    </div>
  )
}

function AgentPortal({
  state,
  loading,
  agent,
}: {
  state: VoiceFlowState
  loading?: boolean
  agent?: ReactNode
}) {
  const spin = state !== 'idle'

  return (
    <div className="relative mx-auto size-[156px]">
      <motion.div
        className={cn('absolute inset-0 rounded-[2rem] bg-gradient-to-br p-[2px]', RING[state])}
        animate={spin ? { rotate: 360 } : { rotate: 0 }}
        transition={
          spin
            ? { duration: state === 'executing' ? 2.2 : 4.5, repeat: Infinity, ease: 'linear' }
            : { duration: 0.4 }
        }
      >
        <div className="relative size-full overflow-hidden rounded-[1.875rem] bg-[#07050f]">
          <VoiceAuraBackdrop state={state} className="rounded-[1.875rem]" />
          <div className="relative z-10 flex size-full items-center justify-center">
            {loading ? <VoiceParticleSphere state="connecting" size="sm" /> : agent}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/** Split live-agent console — portal + stream, not full-page. */
export function VoiceAgentConsole({
  campaignName = 'Live agent',
  flowState = 'idle',
  statusLabel,
  footerTrailing,
  agent,
  transcript,
  hasTranscript,
  loading,
  loadingLabel = 'Starting voice',
  className,
}: VoiceAgentConsoleProps) {
  const state = loading ? 'connecting' : flowState
  const label = loading ? loadingLabel : (statusLabel ?? STATUS[state])
  const active = state !== 'idle'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative w-full overflow-hidden rounded-[1.35rem]',
        'border border-white/[0.08] bg-card/50 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.65)] backdrop-blur-xl',
        className,
      )}
    >
      <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-0 h-36 w-36 rounded-full bg-rose-500/8 blur-3xl" />

      <div className="relative flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/90 to-violet-600/90 shadow-lg shadow-violet-500/20">
          <Sparkles className="size-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground/95">{campaignName}</p>
          <p className="text-[11px] text-muted-foreground">Live agent · voice commands</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]',
            CHIP[state],
          )}
        >
          {loading ? 'Boot' : active ? 'Live' : 'Ready'}
        </span>
      </div>

      <div className="relative grid gap-0 sm:grid-cols-[11.5rem_minmax(0,1fr)]">
        <div className="flex flex-col items-center border-b border-white/[0.06] px-4 py-5 sm:border-b-0 sm:border-r sm:py-6">
          <AgentPortal state={state} loading={loading} agent={agent} />

          <AnimatePresence mode="wait">
            <motion.p
              key={label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28 }}
              className={cn(
                'mt-4 max-w-[9.5rem] truncate text-center text-xs font-medium',
                state === 'executing' && 'text-violet-200',
                state === 'listening' && 'text-blue-200',
                state === 'speaking' && 'text-cyan-200',
                state === 'connecting' && 'text-sky-200',
                state === 'idle' && 'text-muted-foreground',
              )}
            >
              {label}
            </motion.p>
          </AnimatePresence>

          {(loading || state === 'connecting' || state === 'executing') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'relative mt-3 h-0.5 w-16 overflow-hidden rounded-full',
                state === 'executing' ? 'bg-amber-950/50' : 'bg-violet-950/50',
              )}
            >
              <motion.div
                className={cn(
                  'absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent to-transparent',
                  state === 'executing' ? 'via-amber-300/90' : 'via-violet-300/75',
                )}
                animate={{ x: ['-100%', '220%'] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              />
            </motion.div>
          )}
        </div>

        <div className="flex min-h-[11rem] flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.05] px-4 py-2.5 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Stream
            </p>
            {hasTranscript && !loading ? (
              <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                live
              </span>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {loading ? (
              <div className="px-4 py-4 sm:px-5">
                <StreamSkeleton />
              </div>
            ) : hasTranscript && transcript ? (
              <div className="max-h-52 min-h-[11rem] sm:max-h-60">{transcript}</div>
            ) : (
              <div className="flex h-full min-h-[11rem] flex-col items-center justify-center gap-2 px-6 text-center">
                <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                  <Mic className="size-4 text-muted-foreground/70" />
                </div>
                <p className="max-w-[14rem] text-xs leading-relaxed text-muted-foreground">
                  Ask anything — run agents, check workspace, or just chat.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-2.5 sm:px-5">
        <p className="text-[11px] text-muted-foreground">
          {active && !loading ? 'Tap orb to hang up' : 'Pick a language'}
        </p>
        {footerTrailing}
      </div>
    </motion.div>
  )
}
