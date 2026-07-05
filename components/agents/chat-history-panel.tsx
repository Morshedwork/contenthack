'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatMode } from '@/lib/agents/chat-messages'
import {
  formatChatRelativeTime,
  type StoredChatSession,
} from '@/lib/agents/chat-history'
import { cn } from '@/lib/utils'
import { History, MessageCircle, Plus, Trash2, Zap } from 'lucide-react'

interface ChatHistoryPanelProps {
  sessions: StoredChatSession[]
  activeSessionId: string | null
  onSelect: (sessionId: string) => void
  onNewChat: () => void
  onDelete: (sessionId: string) => void
  disabled?: boolean
  className?: string
}

export function ChatHistoryPanel({
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  onDelete,
  disabled,
  className,
}: ChatHistoryPanelProps) {
  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-56 shrink-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.06] bg-card/45 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:w-64',
        className,
      )}
    >
      <div className="shrink-0 space-y-3 border-b border-border/40 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="size-3.5" />
          <p className="text-[11px] font-medium uppercase tracking-[0.12em]">Sessions</p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-10 w-full justify-start rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-sm hover:from-violet-500 hover:to-blue-500 border-0 shadow-md shadow-violet-500/20"
          onClick={onNewChat}
          disabled={disabled}
        >
          <Plus data-icon="inline-start" className="size-4" />
          New chat
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1.5 p-3">
          {sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted-foreground">
              Conversations save here automatically as you work.
            </p>
          ) : (
            sessions.map((session) => {
              const active = session.id === activeSessionId
              return (
                <div key={session.id} className="group relative">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(session.id)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-2.5 pr-9 text-left transition-all',
                      active
                        ? 'border-violet-400/30 bg-gradient-to-r from-violet-500/15 to-blue-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                        : 'border-transparent hover:border-border/50 hover:bg-secondary/40',
                      disabled && 'pointer-events-none opacity-50',
                    )}
                  >
                    <p className="line-clamp-2 text-xs font-medium leading-snug">{session.title}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {session.mode === 'agent' ? (
                        <Zap className="size-2.5 shrink-0 text-violet-400" />
                      ) : (
                        <MessageCircle className="size-2.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatChatRelativeTime(session.updatedAt)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        · {session.messages.filter((m) => m.role === 'user').length}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete chat"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(session.id)
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}

/** Compact history strip for the dashboard widget. */
export function ChatHistoryStrip({
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  disabled,
}: {
  sessions: StoredChatSession[]
  activeSessionId: string | null
  onSelect: (sessionId: string) => void
  onNewChat: () => void
  disabled?: boolean
}) {
  if (sessions.length <= 1) {
    return (
      <button
        type="button"
        onClick={onNewChat}
        disabled={disabled}
        className="shrink-0 px-2 text-[10px] text-muted-foreground hover:text-foreground"
      >
        + New
      </button>
    )
  }

  return (
    <div className="thin-scroll flex shrink-0 items-center gap-1 overflow-x-auto px-2 pb-1">
      <button
        type="button"
        onClick={onNewChat}
        disabled={disabled}
        className="shrink-0 rounded-full border border-violet-500/30 px-2 py-0.5 text-[10px] text-violet-300 hover:text-violet-200"
      >
        + New
      </button>
      {sessions.slice(0, 6).map((session) => (
        <button
          key={session.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(session.id)}
          className={cn(
            'max-w-[120px] shrink-0 truncate rounded-full border px-2 py-0.5 text-[10px] transition-colors',
            session.id === activeSessionId
              ? 'border-violet-500/40 bg-violet-500/15 text-violet-100'
              : 'border-border/50 text-muted-foreground hover:bg-secondary/40',
          )}
          title={session.title}
        >
          {session.title}
        </button>
      ))}
    </div>
  )
}

export type { ChatMode }
