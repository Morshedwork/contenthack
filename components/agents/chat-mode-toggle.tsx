'use client'

import { cn } from '@/lib/utils'
import type { ChatMode } from '@/lib/agents/chat-messages'
import { MessageCircle, Zap } from 'lucide-react'

export function ChatModeToggle({
  mode,
  onChange,
  disabled,
  compact,
  premium,
}: {
  mode: ChatMode
  onChange: (mode: ChatMode) => void
  disabled?: boolean
  compact?: boolean
  premium?: boolean
}) {
  if (premium) {
    return (
      <div className="inline-flex rounded-2xl border border-border/50 bg-secondary/25 p-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('basic')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50',
            mode === 'basic'
              ? 'bg-background text-foreground shadow-sm border border-border/40'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <MessageCircle className="size-4" />
          Basic
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('agent')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50',
            mode === 'agent'
              ? 'bg-gradient-to-r from-violet-600/90 to-blue-600/90 text-white shadow-md shadow-violet-500/20 border-0'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Zap className="size-4" />
          Agent
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-border/60 bg-secondary/30 p-0.5',
        compact && 'text-xs',
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('basic')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
          mode === 'basic' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <MessageCircle className="size-3.5" />
        Basic
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('agent')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
          mode === 'agent' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Zap className="size-3.5" />
        Agent
      </button>
    </div>
  )
}
