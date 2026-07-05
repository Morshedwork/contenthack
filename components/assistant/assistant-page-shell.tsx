'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Bot, MessageSquare, Mic, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

export type AssistantInputMode = 'chat' | 'live-agent'

export function AssistantAmbientShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[1.75rem]">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-violet-600/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 h-48 w-48 rounded-full bg-rose-500/6 blur-3xl" />
      </div>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.06] bg-card/55 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        {children}
      </div>
    </div>
  )
}

export function AssistantPageHeader({
  campaignName,
  subtitle,
  trailing,
  compact,
}: {
  campaignName: string
  subtitle?: string
  trailing?: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border/40 sm:flex-row sm:items-center sm:justify-between',
        compact ? 'px-4 py-3 sm:px-5' : 'px-5 py-5 sm:px-6 sm:py-6',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/25 sm:size-10">
          <Sparkles className="size-4 text-white" />
        </div>
        <div className="min-w-0">
          <h1
            className={cn(
              'font-display tracking-tight leading-tight truncate',
              compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-[1.75rem]',
            )}
          >
            {campaignName}
          </h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0 sm:self-center">{trailing}</div> : null}
    </div>
  )
}

/** Sticky top bar — clear Text vs Live switch with distinct accent colors. */
export function AssistantModeSwitcher<T extends string>({
  modes,
  value,
  onChange,
  disabled,
  compact,
}: {
  modes: { id: T; label: string; description: string; icon: LucideIcon; accent?: 'violet' | 'rose' }[]
  value: T
  onChange: (id: T) => void
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex w-full rounded-2xl border border-border/50 bg-secondary/20 p-1',
        compact ? 'max-w-none' : 'sm:max-w-lg',
      )}
      role="tablist"
      aria-label="Assistant mode"
    >
      {modes.map(({ id, label, description, icon: Icon, accent = 'violet' }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={cn(
              'relative flex flex-1 flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left transition-all disabled:opacity-50 sm:flex-row sm:items-center sm:gap-2.5 sm:px-4 sm:py-3',
              active
                ? accent === 'rose'
                  ? 'bg-gradient-to-r from-rose-500/90 to-violet-600/90 text-white shadow-md shadow-rose-500/20'
                  : 'bg-gradient-to-r from-violet-600/95 to-blue-600/95 text-white shadow-md shadow-violet-500/20'
                : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground',
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className={cn('size-4 shrink-0', active ? 'text-white' : '')} />
              <span className="text-sm font-semibold leading-none">{label}</span>
            </span>
            {!compact && (
              <span
                className={cn(
                  'hidden text-[11px] leading-snug sm:block sm:ml-auto sm:max-w-[9rem] sm:text-right',
                  active ? 'text-white/80' : 'text-muted-foreground',
                )}
              >
                {description}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function InputModeCards<T extends string>({
  modes,
  value,
  onChange,
  disabled,
  variant = 'default',
}: {
  modes: { id: T; label: string; description: string; icon: LucideIcon; accent?: 'violet' | 'rose' }[]
  value: T
  onChange: (id: T) => void
  disabled?: boolean
  variant?: 'default' | 'minimal'
}) {
  if (variant === 'minimal') {
    return (
      <div className="inline-flex w-full max-w-md rounded-xl border border-border/50 bg-secondary/25 p-1 sm:w-auto">
        {modes.map(({ id, label, icon: Icon, accent = 'violet' }) => {
          const active = value === id
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(id)}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 sm:flex-initial sm:min-w-[7.5rem]',
                active
                  ? accent === 'rose'
                    ? 'bg-gradient-to-r from-rose-500/90 to-violet-600/90 text-white shadow-md shadow-rose-500/15'
                    : 'bg-violet-600 text-white shadow-md shadow-violet-500/15'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
      {modes.map(({ id, label, description, icon: Icon, accent = 'violet' }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(id)}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 disabled:opacity-50',
              active
                ? accent === 'rose'
                  ? 'border-rose-400/35 bg-gradient-to-br from-rose-500/15 via-violet-500/10 to-transparent shadow-[0_0_32px_-8px_rgba(244,63,94,0.35)]'
                  : 'border-violet-400/35 bg-gradient-to-br from-violet-500/15 via-blue-500/8 to-transparent shadow-[0_0_32px_-8px_rgba(139,92,246,0.35)]'
                : 'border-border/50 bg-secondary/20 hover:border-violet-500/25 hover:bg-secondary/35',
            )}
          >
            {active && (
              <motion.span
                layoutId="assistant-mode-glow"
                className={cn(
                  'pointer-events-none absolute inset-0 opacity-60',
                  accent === 'rose'
                    ? 'bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.18),transparent_55%)]'
                    : 'bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_55%)]',
                )}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
              />
            )}
            <div className="relative flex items-start gap-3">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                  active
                    ? accent === 'rose'
                      ? 'border-rose-400/30 bg-rose-500/20 text-rose-100'
                      : 'border-violet-400/30 bg-violet-500/20 text-violet-100'
                    : 'border-border/50 bg-background/40 text-muted-foreground group-hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="font-medium leading-none">{label}</p>
                <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{description}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function QuickActionGrid({
  items,
  onSelect,
  disabled,
}: {
  items: { label: string; prompt: string }[]
  onSelect: (prompt: string) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((item, i) => (
        <motion.button
          key={item.prompt}
          type="button"
          disabled={disabled}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onSelect(item.prompt)}
          className="group flex items-start justify-between gap-3 rounded-2xl border border-border/50 bg-secondary/20 p-4 text-left transition-all hover:border-violet-500/30 hover:bg-violet-500/[0.07] disabled:opacity-50"
        >
          <span className="text-sm font-medium leading-snug text-foreground/90 group-hover:text-foreground">
            {item.label}
          </span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/50 text-muted-foreground transition-all group-hover:border-violet-500/30 group-hover:bg-violet-500/15 group-hover:text-violet-200">
            <ArrowUpRight className="size-4" />
          </span>
        </motion.button>
      ))}
    </div>
  )
}

export function LiveWelcomeHero({ campaignName }: { campaignName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-rose-500/15 bg-gradient-to-b from-rose-500/[0.08] to-transparent px-6 py-8 text-center sm:py-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1),transparent_65%)]" />
      <div className="relative flex size-14 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/10 shadow-[0_0_40px_-8px_rgba(244,63,94,0.45)]">
        <Mic className="size-7 text-rose-200" />
      </div>
      <p className="relative mt-4 font-display text-xl sm:text-2xl tracking-tight">{campaignName}</p>
      <p className="relative mt-1.5 max-w-sm text-sm text-muted-foreground">
        Tap the orb to start a live voice conversation — agents run in the background
      </p>
    </motion.div>
  )
}

export function TextWelcomeHero({ campaignName }: { campaignName: string; message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-violet-500/10 bg-gradient-to-b from-violet-500/[0.08] to-transparent px-6 py-10 text-center sm:py-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12),transparent_65%)]" />
      <div className="relative flex size-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 shadow-[0_0_40px_-8px_rgba(139,92,246,0.5)]">
        <Bot className="size-8 text-violet-200" />
      </div>
      <p className="relative mt-5 font-display text-2xl sm:text-3xl tracking-tight">{campaignName}</p>
      <p className="relative mt-2 text-sm text-muted-foreground">Type a prompt below to run agents</p>
    </motion.div>
  )
}

export function VoiceHeroShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-b from-violet-500/10 via-violet-500/[0.04] to-transparent px-4 py-8 sm:px-6 sm:py-10',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
      {children}
    </div>
  )
}

export function LiveAgentHeroShell({
  children,
  className,
  flowState = 'idle',
}: {
  children: ReactNode
  className?: string
  flowState?: 'idle' | 'connecting' | 'listening' | 'speaking'
}) {
  const glow =
    flowState === 'speaking'
      ? 'rgba(16,185,129,0.18)'
      : flowState === 'listening'
        ? 'rgba(244,63,94,0.16)'
        : flowState === 'connecting'
          ? 'rgba(139,92,246,0.2)'
          : 'rgba(139,92,246,0.12)'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#07060d] px-4 py-5 sm:px-5 sm:py-6',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-[background] duration-700"
          style={{ background: glow }}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
      <div className="relative flex h-full flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function SectionPanel({
  children,
  header,
  className,
  variant = 'default',
}: {
  children: ReactNode
  header?: ReactNode
  className?: string
  variant?: 'default' | 'chat' | 'voice' | 'transcript'
}) {
  const shell = {
    default: 'border-border/50 bg-background/35',
    chat: 'border-violet-500/15 bg-gradient-to-b from-violet-500/[0.04] to-background/30',
    voice: 'border-rose-500/20 bg-[#07060d]',
    transcript: 'border-border/40 bg-background/25',
  }[variant]

  const headerAccent = {
    default: 'border-border/40',
    chat: 'border-violet-500/15 bg-violet-500/[0.03]',
    voice: 'border-rose-500/15 bg-rose-500/[0.04]',
    transcript: 'border-border/40 bg-secondary/20',
  }[variant]

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border', shell, className)}>
      {header ? (
        <div className={cn('shrink-0 border-b px-4 py-3 sm:px-5', headerAccent)}>{header}</div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}

/** @deprecated Use SectionPanel with variant="chat" */
export function ChatPanel({
  children,
  header,
  className,
}: {
  children: ReactNode
  header?: ReactNode
  className?: string
}) {
  return (
    <SectionPanel header={header} className={className} variant="chat">
      {children}
    </SectionPanel>
  )
}

export function ChatSectionHeader({
  title = 'Text chat',
  subtitle,
  trailing,
}: {
  title?: string
  subtitle?: string
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-500/15">
          <MessageSquare className="size-4 text-violet-300" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}

export function VoiceSectionHeader({
  title = 'Live voice',
  subtitle,
  trailing,
  flowState,
}: {
  title?: string
  subtitle?: string
  trailing?: ReactNode
  flowState?: 'idle' | 'connecting' | 'listening' | 'speaking' | 'executing'
}) {
  const statusColor =
    flowState === 'executing'
      ? 'text-amber-300'
      : flowState === 'speaking'
      ? 'text-emerald-300'
      : flowState === 'listening'
        ? 'text-rose-300'
        : flowState === 'connecting'
          ? 'text-violet-300'
          : 'text-rose-200/60'

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-500/15">
          <Mic className="size-4 text-rose-300" />
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-semibold leading-none', statusColor)}>{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-rose-200/60">{subtitle}</p> : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}

export function TranscriptSectionHeader({ count }: { count?: number }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
      <p className="text-sm font-medium">Transcript</p>
      {count ? (
        <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
          {count}
        </span>
      ) : null}
    </div>
  )
}

/** Horizontal chip row for quick actions inside chat panel headers. */
export function ChatPanelQuickChips({
  items,
  onSelect,
  disabled,
}: {
  items: { label: string; prompt: string }[]
  onSelect: (prompt: string) => void
  disabled?: boolean
}) {
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item.prompt)}
          title={item.label}
          className="max-w-full rounded-full border border-border/50 bg-secondary/30 px-3 py-1 text-left text-xs text-muted-foreground transition-colors hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-foreground disabled:opacity-50"
        >
          <span className="line-clamp-1">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
