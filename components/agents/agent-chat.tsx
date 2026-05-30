'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ViewGenerationButtons } from '@/components/agents/view-generation-buttons'
import { sendChatMessage, type ChatActionExecuted, type ChatMessage, type ChatMode } from '@/lib/agents/client'
import {
  AGENT_SUGGESTED_PROMPTS,
  BASIC_SUGGESTED_PROMPTS,
  getChatWelcomeMessage,
} from '@/lib/agents/chat-messages'
import { Bot, Loader2, MessageCircle, Send, Sparkles, User, Zap } from 'lucide-react'
import { toast } from 'sonner'

type EnrichedChatMessage = ChatMessage & { actionsExecuted?: ChatActionExecuted[] }

interface AgentChatProps {
  variant?: 'page' | 'widget'
  className?: string
}

function ActionBadge({ action }: { action: ChatActionExecuted }) {
  if (action.type === 'run_workflow') {
    return (
      <Badge variant="secondary" className="text-[10px] gap-1">
        <Zap className="size-3" />
        Full workflow {action.estimatedTimeSaved ? `· ~${action.estimatedTimeSaved} saved` : ''}
      </Badge>
    )
  }
  if (action.type === 'run_agent' && action.results?.length) {
    return (
      <div className="flex flex-wrap gap-1">
        {action.results.map((r) => (
          <Badge
            key={r.agentId}
            variant={r.status === 'failed' ? 'destructive' : 'secondary'}
            className="text-[10px]"
          >
            {r.agentName}
          </Badge>
        ))}
      </div>
    )
  }
  if (action.type === 'status') {
    return (
      <Badge variant="outline" className="text-[10px]">
        Status check
      </Badge>
    )
  }
  return null
}

function renderMarkdownLite(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <p key={i} className={cn('leading-relaxed', i > 0 && 'mt-2')}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="font-semibold text-foreground">
                {part.slice(2, -2)}
              </strong>
            )
          }
          return <span key={j}>{part}</span>
        })}
      </p>
    )
  })
}

function ChatModeToggle({
  mode,
  onChange,
  disabled,
  compact,
}: {
  mode: ChatMode
  onChange: (mode: ChatMode) => void
  disabled?: boolean
  compact?: boolean
}) {
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
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-out disabled:opacity-50',
          mode === 'basic'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <MessageCircle className="size-3.5" />
        Basic Chat
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('agent')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-out disabled:opacity-50',
          mode === 'agent'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Zap className="size-3.5" />
        Agent Mode
      </button>
    </div>
  )
}

export function AgentChat({ variant = 'page', className }: AgentChatProps) {
  const [chatMode, setChatMode] = useState<ChatMode>('basic')
  const [messages, setMessages] = useState<EnrichedChatMessage[]>([
    {
      role: 'assistant',
      content: getChatWelcomeMessage('basic'),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  const handleModeChange = (mode: ChatMode) => {
    if (mode === chatMode || loading) return
    setChatMode(mode)
    setMessages([{ role: 'assistant', content: getChatWelcomeMessage(mode) }])
    setInput('')
  }

  const suggestedPrompts = chatMode === 'basic' ? BASIC_SUGGESTED_PROMPTS : AGENT_SUGGESTED_PROMPTS

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const result = await sendChatMessage(nextMessages, chatMode)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.message, actionsExecuted: result.actionsExecuted },
      ])
      if (
        chatMode === 'agent' &&
        result.actionsExecuted.some((a) => a.type === 'run_agent' || a.type === 'run_workflow')
      ) {
        toast.success(result.live ? 'Agents completed (OpenAI)' : 'Agents completed (demo mode)')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I couldn't complete that request: ${errorMsg}` },
      ])
      toast.error(errorMsg)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  const isWidget = variant === 'widget'

  return (
    <div
      className={cn(
        'flex flex-col',
        isWidget ? 'h-full min-h-0' : 'h-[calc(100vh-12rem)] min-h-[520px]',
        className,
      )}
    >
      {!isWidget && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ChatModeToggle mode={chatMode} onChange={handleModeChange} disabled={loading} />
          <p className="text-xs text-muted-foreground">
            {chatMode === 'basic'
              ? 'Conversational help — no agents run'
              : 'Natural language control for all 10 agents'}
          </p>
        </div>
      )}

      {!isWidget && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              disabled={loading}
              className="rounded-full border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground transition-all duration-300 ease-out hover:bg-violet-500/10 hover:text-foreground hover:border-violet-500/30 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col min-h-0 rounded-xl border border-border/60 bg-background/40 backdrop-blur-sm overflow-hidden">
        {isWidget && (
          <div className="px-3 pt-3 pb-2 border-b border-border/40 shrink-0">
            <ChatModeToggle mode={chatMode} onChange={handleModeChange} disabled={loading} compact />
          </div>
        )}
        <ScrollArea className="flex-1 min-h-0">
          <div ref={scrollRef} className="p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}-${msg.content.slice(0, 32)}`}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                  i === messages.length - 1 && 'message-enter',
                )}
              >
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-500 to-blue-500'
                      : 'bg-violet-500/15 border border-violet-500/20',
                  )}
                >
                  {msg.role === 'user' ? (
                    <User className="size-4 text-white" />
                  ) : (
                    <Bot className="size-4 text-violet-300" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[85%] rounded-xl px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-500/20 to-blue-500/10 border border-violet-500/20'
                      : 'bg-secondary/40 border border-border/40',
                  )}
                >
                  <div className="text-foreground/90">{renderMarkdownLite(msg.content)}</div>
                  {msg.role === 'assistant' && msg.actionsExecuted?.length ? (
                    <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {msg.actionsExecuted.map((action, j) => (
                          <ActionBadge key={j} action={action} />
                        ))}
                      </div>
                      <ViewGenerationButtons actions={msg.actionsExecuted} compact={isWidget} />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 message-enter">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                  <Bot className="size-4 text-violet-300" />
                </div>
                <div className="rounded-xl px-4 py-3 bg-secondary/40 border border-border/40">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {chatMode === 'basic' ? 'Thinking…' : 'Running agents…'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {isWidget && (
          <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto thin-scroll shrink-0">
            {suggestedPrompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                disabled={loading}
                className="shrink-0 rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-violet-500/10 hover:text-foreground disabled:opacity-50"
              >
                {prompt.length > 40 ? `${prompt.slice(0, 40)}…` : prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-border/60 p-3 shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                chatMode === 'basic'
                  ? 'Ask a content or marketing question…'
                  : 'Tell me what to do… e.g. Run research and create LinkedIn posts for Japan SMEs'
              }
              disabled={loading}
              rows={isWidget ? 2 : 2}
              className="min-h-[44px] max-h-32 resize-none bg-secondary/30 border-border/60 text-sm"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0 size-10">
              {loading ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3" />
            Enter to send · Shift+Enter for new line ·{' '}
            {chatMode === 'basic'
              ? 'Basic chat for ideas and copy help'
              : 'Agent mode controls all 10 pipeline agents'}
          </p>
        </form>
      </div>
    </div>
  )
}
