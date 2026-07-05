'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type WaveMode = 'idle' | 'listening' | 'speaking' | 'processing'

interface VoiceWaveformProps {
  mode: WaveMode
  barCount?: number
  className?: string
}

/** Animated audio bars — reacts to voice session state. */
export function VoiceWaveform({ mode, barCount = 28, className }: VoiceWaveformProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const frameRef = useRef<number>(0)
  const tickRef = useRef(0)

  useEffect(() => {
    if (mode === 'idle') {
      barsRef.current.forEach((el) => {
        if (el) el.style.height = '4px'
      })
      return
    }

    const animate = () => {
      tickRef.current += 1
      const t = tickRef.current * 0.08

      barsRef.current.forEach((el, i) => {
        if (!el) return
        const center = barCount / 2
        const dist = Math.abs(i - center) / center
        let h: number

        if (mode === 'processing') {
          h = 6 + Math.sin(t * 2 + i * 0.4) * 4 + (1 - dist) * 6
        } else if (mode === 'speaking') {
          h = 8 + Math.sin(t * 3 + i * 0.55) * 14 + Math.cos(t * 1.5 + i) * 6
        } else {
          h = 6 + Math.random() * 28 * (1 - dist * 0.5) + Math.sin(t + i * 0.7) * 10
        }

        const cap = barCount >= 36 ? 48 : 36
        el.style.height = `${Math.max(4, Math.min(cap, h))}px`
      })

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [mode, barCount])

  return (
    <div
      className={cn('flex items-end justify-center gap-[3px] h-10', className)}
      aria-hidden
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            barsRef.current[i] = el
          }}
          className={cn(
            'w-[3px] rounded-full transition-colors duration-300',
            mode === 'listening' && 'bg-rose-400/80',
            mode === 'speaking' && 'bg-emerald-400/80',
            mode === 'processing' && 'bg-violet-400/70',
            mode === 'idle' && 'bg-muted-foreground/25',
          )}
          style={{ height: 4 }}
        />
      ))}
    </div>
  )
}
