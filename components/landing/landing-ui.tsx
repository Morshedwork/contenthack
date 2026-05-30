'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function SectionShell({
  children,
  id,
  className,
  variant = 'default',
}: {
  children: ReactNode
  id?: string
  className?: string
  variant?: 'default' | 'elevated' | 'glow'
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative px-6 py-24 md:py-32',
        variant === 'default' && 'bg-black',
        variant === 'elevated' && 'border-y border-white/[0.06] bg-zinc-950/80',
        variant === 'glow' && 'overflow-hidden bg-black',
        className,
      )}
    >
      {variant === 'glow' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]"
        />
      )}
      <div className="relative mx-auto max-w-6xl">{children}</div>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className={cn(
        'mb-14 md:mb-16',
        align === 'center' && 'mx-auto max-w-2xl text-center',
        align === 'left' && 'max-w-xl text-left',
        className,
      )}
    >
      {eyebrow && (
        <span className="mb-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-violet-300/80">
          <span className="h-px w-6 bg-violet-400/50" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl tracking-tight text-white md:text-4xl lg:text-5xl text-balance">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-white/55 md:text-lg">{description}</p>
      )}
    </motion.div>
  )
}

export function GlassCard({
  children,
  className,
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md',
        hover && 'transition-colors hover:border-violet-400/25 hover:bg-white/[0.06]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function IconBadge({
  children,
  tone = 'violet',
}: {
  children: ReactNode
  tone?: 'violet' | 'red' | 'emerald'
}) {
  const tones = {
    violet: 'bg-violet-500/15 text-violet-300',
    red: 'bg-red-500/15 text-red-300',
    emerald: 'bg-emerald-500/15 text-emerald-300',
  }
  return (
    <div className={cn('mb-4 flex size-10 items-center justify-center rounded-xl', tones[tone])}>
      {children}
    </div>
  )
}
