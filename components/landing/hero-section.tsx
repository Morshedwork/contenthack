'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown, Play } from 'lucide-react'

const rotatingWords = ['research', 'create', 'publish', 'scale']

const stats = [
  { value: '10', label: 'specialized AI agents' },
  { value: '6+', label: 'social platforms' },
  { value: '30hrs', label: 'saved per week (avg)' },
]

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % rotatingWords.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="h-full w-full object-cover object-center opacity-90"
        >
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg-hero-0BnFGdr81Ifnj3WbBZoNt1KE4D5DMT.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(139,92,246,0.12),transparent_55%)]" />
      </div>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 z-[2] opacity-[0.12]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute right-0 left-0 h-px bg-white/20"
            style={{ top: `${12.5 * (i + 1)}%` }}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-white/20"
            style={{ left: `${8.33 * (i + 1)}%` }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pt-28 pb-32 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 12 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <span className="mb-8 inline-flex items-center gap-3 font-mono text-base text-white/55">
            <span className="h-px w-8 bg-white/25" />
            AI content operations platform
          </span>

          <h1 className="font-display text-[clamp(2.75rem,6vw,5.25rem)] leading-[0.95] tracking-tight text-white">
            <span className="block">Your AI team that</span>
            <span className="relative mt-1 flex min-h-[1.1em] flex-wrap items-baseline gap-x-3 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={rotatingWords[wordIndex]}
                  initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.45 }}
                  className="bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent"
                >
                  {rotatingWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
              <span className="text-white/90">for you</span>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
            Turn one campaign goal into market research, content, video scripts, scheduled posts,
            leads, and ROI — orchestrated by specialized agents from a single command center.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-violet-500/20">
              <Link href="/dashboard?demo=quick">
                Start 2-min demo
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-white/20 bg-white/5 px-8 text-white backdrop-blur hover:bg-white/10 hover:text-white"
            >
              <a href="#demo">
                <Play data-icon="inline-start" />
                View Live Demo
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 flex flex-wrap gap-10 border-t border-white/10 pt-10 lg:gap-20"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1.5">
              <span className="font-display text-4xl text-white md:text-5xl">{stat.value}</span>
              <span className="max-w-[160px] text-sm leading-snug text-white/50">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <a
        href="#problem"
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-white/40 transition-colors hover:text-white/70"
        aria-label="Scroll to content"
      >
        <span className="font-mono text-xs uppercase tracking-widest">Explore</span>
        <ChevronDown className="size-4 animate-bounce" />
      </a>
    </section>
  )
}
