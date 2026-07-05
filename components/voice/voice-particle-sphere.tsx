'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoiceFlowState } from '@/components/voice/voice-flow-orb'

interface VoiceParticleSphereProps {
  state: VoiceFlowState
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  label?: string
}

interface Point3D {
  x: number
  y: number
  z: number
  seed: number
}

const PALETTE: Record<VoiceFlowState, { core: string; glow: string; particle: string }> = {
  idle: { core: '124, 58, 237', glow: 'rgba(99,102,241,0.45)', particle: '167, 139, 250' },
  connecting: { core: '139, 92, 246', glow: 'rgba(129,140,248,0.55)', particle: '196, 181, 253' },
  listening: { core: '59, 130, 246', glow: 'rgba(37,99,235,0.55)', particle: '96, 165, 250' },
  speaking: { core: '6, 182, 212', glow: 'rgba(6,182,212,0.5)', particle: '103, 232, 249' },
  executing: { core: '168, 85, 247', glow: 'rgba(244,63,94,0.35)', particle: '192, 132, 252' },
}

const SPEED: Record<VoiceFlowState, number> = {
  idle: 0.35,
  connecting: 0.65,
  listening: 1.15,
  speaking: 1.45,
  executing: 1.75,
}

const DIM = { sm: 148, md: 200, lg: 240, xl: 300 } as const
const CORE = { sm: 80, md: 110, lg: 132, xl: 168 } as const

function buildSphere(count: number, radius: number): Point3D[] {
  const phi = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i
    return {
      x: Math.cos(theta) * r * radius,
      y: y * radius,
      z: Math.sin(theta) * r * radius,
      seed: Math.random() * Math.PI * 2,
    }
  })
}

/** Sandra-style particle sphere with center mic — themed to ContentOps violet/cyan. */
export function VoiceParticleSphere({
  state,
  onClick,
  size = 'lg',
  className,
  label,
}: VoiceParticleSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const dim = DIM[size]
  const core = CORE[size]
  const palette = PALETTE[state]
  const busy = state === 'connecting' || state === 'executing'
  const active = state !== 'idle'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = dim
    const h = dim
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const count = size === 'xl' ? 880 : size === 'lg' ? 720 : size === 'md' ? 560 : 420
    const radius = core * 0.46
    const points = buildSphere(count, radius)

    let frame = 0
    let raf = 0

    const draw = () => {
      frame++
      const s = stateRef.current
      const colors = PALETTE[s]
      const speed = SPEED[s]
      const cx = w / 2
      const cy = h / 2

      ctx.clearRect(0, 0, w, h)

      const pulse = 0.85 + Math.sin(frame * 0.03 * speed) * 0.12
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, core * 0.95)
      glow.addColorStop(0, `rgba(${colors.core}, ${0.55 * pulse})`)
      glow.addColorStop(0.45, `rgba(${colors.core}, ${0.22 * pulse})`)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      const rotY = frame * 0.004 * speed
      const rotX = Math.sin(frame * 0.002) * 0.18

      const projected: { x: number; y: number; z: number; alpha: number; size: number }[] = []

      for (const p of points) {
        const wave =
          s === 'listening'
            ? Math.sin(frame * 0.09 + p.seed) * 3.5
            : s === 'speaking'
              ? Math.sin(frame * 0.12 + p.seed * 1.4) * 5
              : s === 'executing'
                ? Math.sin(frame * 0.14 + p.seed * 2) * 6
                : Math.sin(frame * 0.04 + p.seed) * 1.2

        let x = p.x
        let y = p.y + wave
        let z = p.z

        const cosY = Math.cos(rotY)
        const sinY = Math.sin(rotY)
        const x1 = x * cosY - z * sinY
        const z1 = x * sinY + z * cosY

        const cosX = Math.cos(rotX)
        const sinX = Math.sin(rotX)
        const y2 = y * cosX - z1 * sinX
        const z2 = y * sinX + z1 * cosX

        const scale = 280 / (280 + z2)
        projected.push({
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          z: z2,
          alpha: 0.25 + scale * 0.65,
          size: (s === 'idle' ? 1.1 : 1.35) * scale,
        })
      }

      projected.sort((a, b) => a.z - b.z)

      for (const dot of projected) {
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${colors.particle}, ${Math.min(1, dot.alpha)})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [core, dim, size])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label ?? 'Voice'}
      className={cn(
        'group relative flex items-center justify-center rounded-full outline-none',
        onClick ? 'cursor-pointer' : 'cursor-default',
        className,
      )}
      style={{ width: dim, height: dim }}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0" />

      {active && (
        <motion.span
          className="absolute rounded-full border border-white/10"
          style={{ width: core + 24, height: core + 24 }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.12, 0.35] }}
          transition={{ duration: SPEED[state], repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.span
        className="relative z-10 flex items-center justify-center rounded-full bg-white shadow-[0_0_40px_-8px_rgba(255,255,255,0.65)]"
        style={{ width: size === 'xl' ? 52 : size === 'lg' ? 44 : 36, height: size === 'xl' ? 52 : size === 'lg' ? 44 : 36 }}
        whileHover={onClick && !busy ? { scale: 1.06 } : undefined}
        whileTap={onClick && !busy ? { scale: 0.94 } : undefined}
        animate={active ? { boxShadow: [`0 0 28px 2px ${palette.glow}`, `0 0 44px 6px ${palette.glow}`, `0 0 28px 2px ${palette.glow}`] } : undefined}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {busy ? (
          <Loader2 className={cn('animate-spin text-violet-700', size === 'sm' ? 'size-4' : 'size-5')} />
        ) : state === 'listening' ? (
          <Square className={cn('fill-violet-700 text-violet-700', size === 'sm' ? 'size-4' : 'size-5')} />
        ) : (
          <Mic className={cn('text-violet-700', size === 'sm' ? 'size-4' : 'size-5')} />
        )}
      </motion.span>
    </button>
  )
}
