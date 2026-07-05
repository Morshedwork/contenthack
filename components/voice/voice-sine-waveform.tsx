'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type WaveMode = 'idle' | 'listening' | 'speaking' | 'processing'

interface VoiceSineWaveformProps {
  mode: WaveMode
  className?: string
  height?: number
}

const LAYERS: { amplitude: number; opacity: number; speed: number; offset: number; color: string }[] = [
  { amplitude: 0.55, opacity: 0.22, speed: 1.1, offset: 0, color: '59, 130, 246' },
  { amplitude: 0.72, opacity: 0.38, speed: 1.35, offset: 1.2, color: '99, 102, 241' },
  { amplitude: 0.9, opacity: 0.62, speed: 1.6, offset: 2.4, color: '165, 243, 252' },
  { amplitude: 1, opacity: 0.95, speed: 1.85, offset: 3.6, color: '255, 255, 255' },
]

/** Flowing sine-wave visualizer — matches Sandra glass-card reference. */
export function VoiceSineWaveform({ mode, className, height = 88 }: VoiceSineWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modeRef = useRef(mode)
  modeRef.current = mode

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let raf = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      const w = parent.clientWidth
      const h = height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    const draw = () => {
      frame++
      const m = modeRef.current
      const w = canvas.clientWidth
      const h = height
      const active = m !== 'idle'
      const energy = m === 'speaking' ? 1.25 : m === 'listening' ? 1.05 : m === 'processing' ? 0.85 : 0.25

      ctx.clearRect(0, 0, w, h)

      const mid = h / 2

      for (const layer of LAYERS) {
        ctx.beginPath()
        const amp = (h * 0.22 * layer.amplitude * energy * (active ? 1 : 0.35)) / 2

        for (let x = 0; x <= w; x += 2) {
          const t = frame * 0.025 * layer.speed + layer.offset
          const nx = (x / w) * Math.PI * 4
          const y =
            mid +
            Math.sin(nx + t) * amp +
            Math.sin(nx * 1.8 - t * 0.7) * amp * 0.35

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.strokeStyle = `rgba(${layer.color}, ${active ? layer.opacity : layer.opacity * 0.35})`
        ctx.lineWidth = active ? 2.2 : 1.4
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [height])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('w-full', className)}
      style={{ height }}
    />
  )
}
