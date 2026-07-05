'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type VoiceFlowState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'executing'

interface VoiceFlowOrbProps {
  state: VoiceFlowState
  onClick?: () => void
  size?: 'sm' | 'lg' | 'xl'
  className?: string
  label?: string
}

const CORE: Record<VoiceFlowState, { bg: string; glow: string; ring: string; arc?: string }> = {
  idle: {
    bg: 'radial-gradient(circle at 35% 30%, #c4b5fd 0%, #7c3aed 42%, #3b0764 100%)',
    glow: 'rgba(139,92,246,0.35)',
    ring: 'rgba(167,139,250,0.35)',
  },
  connecting: {
    bg: 'radial-gradient(circle at 35% 30%, #ddd6fe 0%, #8b5cf6 42%, #4c1d95 100%)',
    glow: 'rgba(139,92,246,0.45)',
    ring: 'rgba(167,139,250,0.5)',
  },
  listening: {
    bg: 'radial-gradient(circle at 35% 30%, #fecdd3 0%, #e11d48 42%, #4c0519 100%)',
    glow: 'rgba(244,63,94,0.4)',
    ring: 'rgba(251,113,133,0.45)',
  },
  speaking: {
    bg: 'radial-gradient(circle at 35% 30%, #a7f3d0 0%, #059669 42%, #022c22 100%)',
    glow: 'rgba(16,185,129,0.42)',
    ring: 'rgba(52,211,153,0.45)',
  },
  executing: {
    bg: 'radial-gradient(circle at 35% 28%, #fde68a 0%, #f59e0b 38%, #7c3aed 72%, #312e81 100%)',
    glow: 'rgba(245,158,11,0.48)',
    ring: 'rgba(251,191,36,0.55)',
    arc: 'rgba(167,139,250,0.7)',
  },
}

const PULSE: Record<VoiceFlowState, number> = {
  idle: 5.5,
  connecting: 3.2,
  listening: 2.6,
  speaking: 1.8,
  executing: 1.15,
}

const spring = { type: 'spring' as const, stiffness: 260, damping: 22 }

/** Voice orb with smooth ripple rings — no dot/bar ring. */
export function VoiceFlowOrb({ state, onClick, size = 'lg', className, label }: VoiceFlowOrbProps) {
  const dim = size === 'xl' ? 280 : size === 'lg' ? 240 : 148
  const core = size === 'xl' ? 156 : size === 'lg' ? 132 : 80
  const palette = CORE[state]
  const ripples =
    state === 'executing' ? 4 : state === 'speaking' ? 3 : state === 'listening' ? 2 : state === 'connecting' ? 1 : 0

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? 'Voice'}
      disabled={!onClick}
      className={cn(
        'relative flex items-center justify-center rounded-full outline-none',
        onClick ? 'cursor-pointer' : 'cursor-default',
        className,
      )}
      style={{ width: dim, height: dim }}
    >
      {state === 'executing' && (
        <>
          <motion.span
            className="absolute rounded-full border-2"
            style={{
              width: core + 44,
              height: core + 44,
              borderColor: 'transparent',
              borderTopColor: palette.ring,
              borderRightColor: palette.arc,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.span
            className="absolute rounded-full border-2"
            style={{
              width: core + 64,
              height: core + 64,
              borderColor: 'transparent',
              borderBottomColor: palette.arc,
              borderLeftColor: palette.ring,
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'linear' }}
          />
        </>
      )}

      {Array.from({ length: ripples }).map((_, i) => (
        <motion.span
          key={`${state}-ripple-${i}`}
          className="absolute rounded-full border"
          style={{
            width: core,
            height: core,
            borderColor: palette.ring,
          }}
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: [1, 1.5 + i * 0.1], opacity: [0.38, 0] }}
          transition={{
            duration: PULSE[state],
            repeat: Infinity,
            ease: [0.22, 1, 0.36, 1],
            delay: i * (PULSE[state] / (ripples + 1)),
          }}
        />
      ))}

      {state === 'idle' && (
        <motion.span
          className="absolute rounded-full"
          style={{ width: core + 28, height: core + 28, boxShadow: `0 0 72px 10px ${palette.glow}` }}
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.04, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.span
        layout
        className="relative rounded-full"
        style={{
          width: core,
          height: core,
          background: palette.bg,
          boxShadow: `0 0 ${size === 'xl' ? 72 : 52}px -10px ${palette.glow}`,
        }}
        animate={
          state === 'executing'
            ? { scale: [1, 1.07, 1], rotate: [0, 2, 0, -2, 0] }
            : state === 'speaking'
              ? { scale: [1, 1.06, 1] }
              : state === 'listening'
                ? { scale: [1, 1.035, 1] }
                : { scale: [1, 1.02, 1] }
        }
        transition={{
          scale: { duration: PULSE[state], repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
          layout: { ...spring },
        }}
        whileHover={onClick && state !== 'executing' ? { scale: 1.05 } : undefined}
        whileTap={onClick && state !== 'executing' ? { scale: 0.94 } : undefined}
      >
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.45), rgba(255,255,255,0.06) 40%, transparent 58%)',
          }}
          animate={{ rotate: state === 'executing' ? [0, 180, 360] : [0, 8, 0] }}
          transition={{
            duration: state === 'executing' ? 2.8 : 12,
            repeat: Infinity,
            ease: state === 'executing' ? 'linear' : 'easeInOut',
          }}
        />
        <motion.span
          aria-hidden
          className="absolute inset-[8%] rounded-full opacity-40"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.35), transparent 40%)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: state === 'executing' ? 3.5 : state === 'idle' ? 14 : 6,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.span>
    </button>
  )
}
