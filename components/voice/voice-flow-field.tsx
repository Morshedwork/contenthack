'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { VoiceFlowState } from '@/components/voice/voice-flow-orb'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
}

interface VoiceFlowFieldProps {
  state: VoiceFlowState
  className?: string
}

const STATE_SPEED: Record<VoiceFlowState, number> = {
  idle: 0.15,
  connecting: 0.45,
  listening: 0.75,
  speaking: 1.1,
  executing: 1.3,
}

const STATE_COLOR: Record<VoiceFlowState, string> = {
  idle: '139, 92, 246',
  connecting: '167, 139, 250',
  listening: '244, 63, 94',
  speaking: '16, 185, 129',
  executing: '245, 158, 11',
}

/** Ambient particle field behind the voice orb — reacts to session state. */
export function VoiceFlowField({ state, className }: VoiceFlowFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let raf = 0
    const particles: Particle[] = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.002,
      vy: (Math.random() - 0.5) * 0.002,
      size: 1 + Math.random() * 2.5,
      alpha: 0.15 + Math.random() * 0.45,
    }))

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = parent.clientWidth * dpr
      canvas.height = parent.clientHeight * dpr
      canvas.style.width = `${parent.clientWidth}px`
      canvas.style.height = `${parent.clientHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    const draw = () => {
      frame++
      const s = stateRef.current
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const speed = STATE_SPEED[s]
      const rgb = STATE_COLOR[s]

      ctx.clearRect(0, 0, w, h)

      // Soft center glow
      const pulse = 0.5 + Math.sin(frame * 0.02) * 0.15
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.45)
      grad.addColorStop(0, `rgba(${rgb}, ${0.12 * pulse})`)
      grad.addColorStop(0.5, `rgba(${rgb}, ${0.04 * pulse})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Orbiting arcs when active
      if (s !== 'idle') {
        const arcCount = s === 'speaking' ? 3 : 2
        for (let a = 0; a < arcCount; a++) {
          const angle = frame * 0.012 * speed + (a * Math.PI * 2) / arcCount
          const r = Math.min(w, h) * (0.28 + a * 0.06)
          ctx.beginPath()
          ctx.arc(w / 2, h / 2, r, angle, angle + Math.PI * 0.6)
          ctx.strokeStyle = `rgba(${rgb}, ${0.08 + a * 0.04})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx * speed * 60
        p.y += p.vy * speed * 60
        if (p.x < 0 || p.x > 1) p.vx *= -1
        if (p.y < 0 || p.y > 1) p.vy *= -1

        const flicker = s === 'listening' ? Math.random() * 0.3 : 0
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb}, ${Math.min(1, p.alpha + flicker)})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  )
}
