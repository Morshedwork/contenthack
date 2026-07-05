'use client'

import type { ChatSuggestedAction } from '@/lib/agents/types'
import { cn } from '@/lib/utils'

interface ChatSuggestedActionsProps {
  actions: ChatSuggestedAction[]
  onSelect: (prompt: string) => void
  disabled?: boolean
  compact?: boolean
  className?: string
}

export function ChatSuggestedActions({
  actions,
  onSelect,
  disabled,
  compact,
  className,
}: ChatSuggestedActionsProps) {
  if (!actions.length) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map((action) => (
        <button
          key={action.prompt}
          type="button"
          onClick={() => onSelect(action.prompt)}
          disabled={disabled}
          className={cn(
            'rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-100 transition-all duration-300 ease-out hover:bg-violet-500/20 hover:border-violet-500/40 disabled:opacity-50',
            compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
