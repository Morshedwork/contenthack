'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { AssistantMessageBubble, type AssistantMessage } from '@/components/assistant/assistant-message-bubble'
import {
  AssistantAmbientShell,
  AssistantPageHeader,
  ChatPanel,
  ChatPanelQuickChips,
  ChatSectionHeader,
  QuickActionGrid,
  TextWelcomeHero,
} from '@/components/assistant/assistant-page-shell'
import { AgentExecutionTimeline } from '@/components/agents/agent-execution-timeline'
import { ChatHistoryPanel, ChatHistoryStrip } from '@/components/agents/chat-history-panel'
import { ChatModeToggle } from '@/components/agents/chat-mode-toggle'
import { LiveWorkspaceRail } from '@/components/voice/live-workspace-rail'
import {
  sendChatMessage,
  sendChatMessageStream,
  isChatAbortError,
  type ChatAgentPlan,
  type ChatMessage,
  type ChatMode,
  type ChatSuggestedAction,
  type ChatResponse,
} from '@/lib/agents/client'
import {
  createChatSession,
  deleteChatSession,
  getChatSession,
  readChatHistoryStore,
  setActiveChatSession,
  upsertChatSession,
  type StoredChatMessage,
  type StoredChatSession,
} from '@/lib/agents/chat-history'
import {
  AGENT_SUGGESTED_PROMPTS,
  BASIC_SUGGESTED_PROMPTS,
  getChatWelcomeMessage,
} from '@/lib/agents/chat-messages'
import { useWorkspace } from '@/hooks/use-workspace'
import {
  Bot,
  Loader2,
  Send,
  Sparkles,
  Square,
} from 'lucide-react'
import { toast } from 'sonner'

interface UnifiedAssistantProps {
  variant?: 'page' | 'widget'
  className?: string
}

function enrichFromResponse(res: ChatResponse, source: AssistantMessage['source']): AssistantMessage {
  return {
    role: 'assistant',
    content: res.message,
    actionsExecuted: res.actionsExecuted,
    artifacts: res.artifacts,
    references: res.references,
    suggestedActions: res.suggestedActions,
    plan: res.plan,
    source,
  }
}

function buildStoppedPlan(plan: ChatAgentPlan | undefined): ChatAgentPlan | undefined {
  if (!plan) return undefined
  return {
    ...plan,
    steps: plan.steps.map((step) =>
      step.status === 'pending' || step.status === 'running'
        ? { ...step, status: 'skipped' as const, output: 'Stopped' }
        : step,
    ),
  }
}

export function UnifiedAssistant({
  variant = 'page',
  className,
}: UnifiedAssistantProps) {
  const { data, loading: workspaceLoading, refresh } = useWorkspace()
  const [chatMode, setChatMode] = useState<ChatMode>('agent')
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: 'assistant', content: getChatWelcomeMessage('agent'), source: 'chat' },
  ])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<StoredChatSession[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentPhase, setAgentPhase] = useState<'idle' | 'planning' | 'executing' | 'summarizing'>('idle')
  const [livePlan, setLivePlan] = useState<ChatAgentPlan | undefined>()
  const [dynamicPrompts, setDynamicPrompts] = useState<ChatSuggestedAction[]>([])
  const [, startTransition] = useTransition()

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const skipPersist = useRef(false)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const livePlanRef = useRef<ChatAgentPlan | undefined>(undefined)
  const pinnedRef = useRef(true)

  const isWidget = variant === 'widget'

  const INPUT_MIN_HEIGHT = 40
  const INPUT_MAX_HEIGHT = 112

  const syncInputHeight = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = `${INPUT_MIN_HEIGHT}px`
    if (!input.trim()) {
      el.style.overflowY = 'hidden'
      return
    }
    const next = Math.min(Math.max(el.scrollHeight, INPUT_MIN_HEIGHT), INPUT_MAX_HEIGHT)
    el.style.height = `${next}px`
    el.style.overflowY = next >= INPUT_MAX_HEIGHT ? 'auto' : 'hidden'
  }, [input])

  useLayoutEffect(() => {
    syncInputHeight()
  }, [syncInputHeight])

  const getViewport = useCallback(
    () =>
      (scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null) ??
      null,
    [],
  )

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      if (!pinnedRef.current) return
      requestAnimationFrame(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior, block: 'end' })
      })
    },
    [],
  )

  useEffect(() => {
    livePlanRef.current = livePlan
  }, [livePlan])

  const stopWork = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  useEffect(() => {
    const viewport = getViewport()
    if (!viewport) return
    const onScroll = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
      pinnedRef.current = distanceFromBottom < 96
    }
    onScroll()
    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', onScroll)
  }, [getViewport, hydrated, messages.length])

  useEffect(() => {
    if (pinnedRef.current) scrollToBottom()
  }, [messages, loading, livePlan, agentPhase, scrollToBottom])

  useEffect(() => {
    const content = scrollRef.current
    if (!content) return
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) scrollToBottom('auto')
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [scrollToBottom, hydrated])

  useEffect(() => {
    pinnedRef.current = true
    scrollToBottom('auto')
  }, [hydrated, scrollToBottom])

  const persistSession = useCallback(
    (id: string, mode: ChatMode, msgs: StoredChatMessage[]) => {
      const existing = getChatSession(id)
      const store = upsertChatSession({
        id,
        title: existing?.title ?? 'New chat',
        mode,
        messages: msgs,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setSessions(store.sessions)
    },
    [],
  )

  useEffect(() => {
    const store = readChatHistoryStore()
    let active = store.activeSessionId ? getChatSession(store.activeSessionId) : undefined
    if (!active) {
      const welcome: StoredChatMessage[] = [
        { role: 'assistant', content: getChatWelcomeMessage('agent') },
      ]
      active = createChatSession('agent', welcome)
      upsertChatSession(active)
    }
    skipPersist.current = true
    setSessionId(active.id)
    setSessions(readChatHistoryStore().sessions)
    setChatMode(active.mode)
    setMessages(
      active.messages.length
        ? active.messages.map((m) => ({ ...m, source: 'chat' as const }))
        : [{ role: 'assistant', content: getChatWelcomeMessage(active.mode), source: 'chat' }],
    )
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || !sessionId || loading) return
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      persistSession(sessionId, chatMode, messages)
    }, 400)
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [messages, chatMode, sessionId, hydrated, loading, persistSession])

  const startNewChat = useCallback(() => {
    if (loading) return
    if (sessionId) persistSession(sessionId, chatMode, messages)
    const welcome: AssistantMessage[] = [
      { role: 'assistant', content: getChatWelcomeMessage(chatMode), source: 'chat' },
    ]
    const session = createChatSession(chatMode, welcome)
    const store = upsertChatSession(session)
    skipPersist.current = true
    setSessionId(session.id)
    setSessions(store.sessions)
    setMessages(welcome)
    setDynamicPrompts([])
    setInput('')
  }, [chatMode, loading, messages, persistSession, sessionId])

  const loadSession = useCallback(
    (id: string) => {
      if (loading || id === sessionId) return
      if (sessionId) persistSession(sessionId, chatMode, messages)
      const session = getChatSession(id)
      if (!session) return
      setActiveChatSession(id)
      skipPersist.current = true
      setSessionId(id)
      setChatMode(session.mode)
      setMessages(session.messages.map((m) => ({ ...m, source: 'chat' as const })))
      setDynamicPrompts([])
      setSessions(readChatHistoryStore().sessions)
    },
    [chatMode, loading, messages, persistSession, sessionId],
  )

  const removeSession = useCallback(
    (id: string) => {
      if (loading) return
      const store = deleteChatSession(id)
      setSessions(store.sessions)
      if (id !== sessionId) return
      const next = store.sessions[0]
      if (next) loadSession(next.id)
      else startNewChat()
    },
    [loading, loadSession, sessionId, startNewChat],
  )

  const applyAssistantResponse = useCallback(
    (res: ChatResponse, source: AssistantMessage['source']) => {
      setMessages((prev) => [...prev, enrichFromResponse(res, source)])
      if (res.suggestedActions?.length) setDynamicPrompts(res.suggestedActions)
      if (
        res.actionsExecuted.some((a) => a.type === 'run_agent' || a.type === 'run_workflow')
      ) {
        void refresh()
      }
    },
    [refresh],
  )

  const sendText = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const apiMessages: ChatMessage[] = [
      ...messages.map(({ role, content }) => ({ role, content } as ChatMessage)),
      { role: 'user', content: trimmed },
    ]
    pinnedRef.current = true
    setMessages((prev) => [...prev, { role: 'user', content: trimmed, source: 'chat' }])
    setInput('')
    setLoading(true)
    setLivePlan(undefined)
    setAgentPhase(chatMode === 'agent' ? 'planning' : 'idle')
    abortRef.current = new AbortController()
    let aborted = false

    try {
      const signal = abortRef.current.signal
      if (chatMode === 'agent') {
        const result = await sendChatMessageStream(
          apiMessages,
          chatMode,
          (event) => {
            if (event.type === 'plan') {
              setLivePlan(event.plan)
              setAgentPhase('executing')
            } else if (event.type === 'step') {
              setLivePlan((prev) =>
                prev
                  ? {
                      ...prev,
                      steps: prev.steps.map((s) =>
                        s.agentId === event.agentId
                          ? { ...s, status: event.status, output: event.output ?? s.output }
                          : s,
                      ),
                    }
                  : prev,
              )
            } else if (event.type === 'summarizing') {
              setAgentPhase('summarizing')
            }
          },
          { signal },
        )
        applyAssistantResponse(result, 'chat')
      } else {
        const result = await sendChatMessage(apiMessages, chatMode, { signal })
        applyAssistantResponse(result, 'chat')
      }
    } catch (err) {
      if (isChatAbortError(err)) {
        aborted = true
        const stoppedPlan = buildStoppedPlan(livePlanRef.current)
        const completed = stoppedPlan?.steps.filter((s) => s.status === 'completed').length ?? 0
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              completed > 0
                ? `Stopped. ${completed} agent${completed === 1 ? '' : 's'} finished — results are saved in your workspace. Send another prompt to continue.`
                : 'Stopped before any agents finished. Send another prompt when you are ready.',
            plan: stoppedPlan,
            source: 'chat',
          },
        ])
        if (completed > 0) void refresh()
        toast.info('Agent run stopped')
      } else {
        const msg = err instanceof Error ? err.message : 'Request failed'
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Sorry — ${msg}`, source: 'chat' },
        ])
        toast.error(msg)
      }
    } finally {
      abortRef.current = null
      setLoading(false)
      setAgentPhase('idle')
      if (!aborted) setLivePlan(undefined)
      inputRef.current?.focus()
    }
  }

  const submit = () => {
    void sendText(input)
  }

  const campaignName = data?.campaign.companyName || 'AI Assistant'
  const hasConversation = messages.some((m) => m.role === 'user')
  const chatExpanded = hasConversation || loading

  const suggestedPrompts = chatMode === 'basic' ? BASIC_SUGGESTED_PROMPTS : AGENT_SUGGESTED_PROMPTS
  const activePrompts =
    dynamicPrompts.length > 0
      ? dynamicPrompts
      : suggestedPrompts.map((p) => ({ label: p, prompt: p }))

  const quickActions = activePrompts.slice(0, 4)

  const runPrompt = (prompt: string) => {
    void sendText(prompt)
  }

  const inputForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="relative z-10 shrink-0 border-t border-border/40 px-4 py-2.5 sm:px-5 sm:py-3"
    >
      <div className="mx-auto flex w-full items-center gap-2 rounded-2xl border border-border/50 bg-secondary/30 p-1.5 pl-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:pl-4">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            requestAnimationFrame(syncInputHeight)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Ask anything or tell agents what to run…"
          disabled={loading}
          rows={1}
          style={{ height: INPUT_MIN_HEIGHT }}
          className="max-h-28 min-h-10 w-full flex-1 resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-sm leading-5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        />
        {loading ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={stopWork}
            className="size-10 shrink-0 rounded-xl sm:size-11"
            title="Stop agents"
          >
            <Square className="size-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="size-10 shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-md shadow-violet-500/25 hover:from-violet-400 hover:to-blue-400 sm:size-11"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>
      {!isWidget && (
        <p className="mt-2 flex items-center gap-1.5 pl-11 text-[11px] text-muted-foreground">
          <Sparkles className="size-3 shrink-0" />
          {chatMode === 'agent' ? 'Agent mode orchestrates multi-step workflows' : 'Basic mode for quick answers'}
        </p>
      )}
    </form>
  )

  const messageList = (
    <ScrollArea className="min-h-0 flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        className="mx-auto flex w-full max-w-3xl flex-col items-stretch justify-start space-y-3 px-4 py-3 sm:px-5 sm:py-4"
      >
        {!messages.length && !loading && !isWidget ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-border/50 bg-secondary/30">
              <Bot className="size-5 text-violet-300" />
            </div>
            <p className="text-sm">Your conversation will appear here</p>
          </div>
        ) : null}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={`${sessionId}-${i}-${msg.role}-${msg.content.slice(0, 24)}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <AssistantMessageBubble
                message={msg}
                compact={isWidget}
                showSuggestedActions={
                  i === messages.length - 1 && msg.role === 'assistant' && (isWidget || hasConversation)
                }
                onSuggestedAction={(p) => void sendText(p)}
                actionsDisabled={loading}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full max-w-[min(85%,28rem)] gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
              <Bot className="size-4 text-violet-300" />
            </div>
            <div className="min-w-[12rem] max-w-full rounded-xl border border-border/40 bg-secondary/40 px-4 py-3">
              {chatMode === 'agent' && agentPhase !== 'idle' ? (
                <AgentExecutionTimeline plan={livePlan} phase={agentPhase} compact={isWidget} />
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-violet-400" />
                  Thinking…
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={stopWork}
                className="mt-3 h-7 text-xs border-rose-500/30 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
              >
                <Square className="size-3 fill-current" data-icon="inline-start" />
                Stop
              </Button>
            </div>
          </motion.div>
        )}
        <div ref={scrollAnchorRef} className="h-px w-full shrink-0" aria-hidden />
      </div>
    </ScrollArea>
  )

  const chatPanelBody = (
      <ChatPanel
        className={cn('min-h-0', isWidget || chatExpanded ? 'flex-1' : 'shrink-0')}
        header={
          isWidget ? undefined : (
            <div className="space-y-2.5">
              <ChatSectionHeader
                subtitle={
                  hasConversation
                    ? `${messages.filter((m) => m.role === 'user').length} prompt${messages.filter((m) => m.role === 'user').length === 1 ? '' : 's'}`
                    : 'Type below to start'
                }
                trailing={
                  hasConversation ? (
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {messages.length} messages
                    </span>
                  ) : null
                }
              />
              {hasConversation && quickActions.length > 0 ? (
                <ChatPanelQuickChips
                  items={quickActions.slice(0, 3)}
                  onSelect={runPrompt}
                  disabled={loading}
                />
              ) : null}
            </div>
          )
        }
      >
        {hydrated && isWidget && (
          <div className="px-3 pt-2 border-b border-violet-500/10 shrink-0">
            <ChatHistoryStrip
              sessions={sessions}
              activeSessionId={sessionId}
              onSelect={loadSession}
              onNewChat={startNewChat}
              disabled={loading}
            />
          </div>
        )}
        {messageList}
        {inputForm}
      </ChatPanel>
  )

  const chatPanel = isWidget ? (
    <>
      <ChatModeToggle
        mode={chatMode}
        premium={false}
        onChange={(m) => {
          startTransition(() => {
            setChatMode(m)
            if (messages.length <= 1) {
              setMessages([{ role: 'assistant', content: getChatWelcomeMessage(m), source: 'chat' }])
            }
          })
        }}
        disabled={loading}
        compact
      />
      {chatPanelBody}
    </>
  ) : (
    chatPanelBody
  )

  if (isWidget) {
    return <div className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}>{chatPanel}</div>
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-row gap-3 lg:gap-4', className)}>
      {hydrated && (
        <ChatHistoryPanel
          sessions={sessions}
          activeSessionId={sessionId}
          onSelect={loadSession}
          onNewChat={startNewChat}
          onDelete={removeSession}
          disabled={loading}
          className="hidden h-full min-h-0 sm:flex"
        />
      )}

      <AssistantAmbientShell className="min-h-0 min-w-0 flex-1">
        <AssistantPageHeader
          campaignName={campaignName}
          subtitle={
            chatMode === 'agent'
              ? 'Text chat · multi-step agent workflows'
              : 'Text chat · quick answers'
          }
        />

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 pb-3 sm:px-4 sm:pb-4 lg:px-5 lg:pb-5">
          <div className="shrink-0 space-y-3 border-b border-border/30 pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ChatModeToggle
                mode={chatMode}
                premium={!hasConversation}
                onChange={(m) => {
                  startTransition(() => {
                    setChatMode(m)
                    if (messages.length <= 1) {
                      setMessages([{ role: 'assistant', content: getChatWelcomeMessage(m), source: 'chat' }])
                    }
                  })
                }}
                disabled={loading}
              />
              {!hasConversation && (
                <p className="text-xs text-muted-foreground sm:text-right">
                  {chatMode === 'agent' ? 'Orchestrates research → content → outreach' : 'Fast Q&A without running agents'}
                </p>
              )}
            </div>
          </div>

          {!chatExpanded && (
            <LiveWorkspaceRail data={data} loading={workspaceLoading} className="shrink-0" />
          )}

          {!chatExpanded && <TextWelcomeHero campaignName={campaignName} />}

          {quickActions.length > 0 && !chatExpanded && (
            <div className="space-y-2.5 shrink-0">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Try next</p>
              <QuickActionGrid items={quickActions} onSelect={runPrompt} disabled={loading} />
            </div>
          )}

          <div className={cn('flex min-h-0 flex-col', chatExpanded ? 'min-h-0 flex-1' : 'shrink-0')}>
            {chatPanel}
          </div>
        </div>
      </AssistantAmbientShell>
    </div>
  )
}
