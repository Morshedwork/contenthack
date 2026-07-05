'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VoiceParticleSphere } from '@/components/voice/voice-particle-sphere'
import { VoiceAuraBackdrop } from '@/components/voice/voice-aura-backdrop'

interface VoiceLoadingCanvasProps {
  label?: string
  className?: string
}

/** Full-area voice boot screen — orb + aurora, no spinners. */
export function VoiceLoadingCanvas({ label = 'Starting voice', className }: VoiceLoadingCanvasProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-[min(60vh,520px)] flex-1 flex-col overflow-hidden rounded-[1.5rem]',
        'border border-white/[0.05] bg-[#06040c]',
        className,
      )}
    >
      <VoiceAuraBackdrop state="connecting" />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-4">
        <VoiceParticleSphere state="connecting" size="xl" />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-2xl tracking-tight text-violet-200/90 sm:text-[1.75rem]"
        >
          {label}
        </motion.p>
      </div>
    </div>
  )
}
