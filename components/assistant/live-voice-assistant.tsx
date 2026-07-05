'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { AudioLines, AudioWaveform, Sparkles } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { AssistantMessageBubble, type AssistantMessage } from '@/components/assistant/assistant-message-bubble'
import {
  SectionPanel,
  TranscriptSectionHeader,
  VoiceSectionHeader,
} from '@/components/assistant/assistant-page-shell'
import { ElevenLabsAgentSession } from '@/components/voice/elevenlabs-agent-session'
import { VoiceAuraBackdrop } from '@/components/voice/voice-aura-backdrop'
import { VoiceGlassSession } from '@/components/voice/voice-glass-session'
import { VoiceLanguageSelect } from '@/components/voice/voice-language-select'
import { VoiceExecutionShimmer } from '@/components/voice/voice-execution-shimmer'
import { VoiceAgentConsole } from '@/components/voice/voice-agent-console'
import type { VoiceFlowState } from '@/components/voice/voice-flow-orb'
import type { ChatResponse } from '@/lib/agents/types'
import { useVoiceLanguage } from '@/hooks/use-voice-language'
import { useWorkspace } from '@/hooks/use-workspace'

interface LiveVoiceAssistantProps {
  variant?: 'page' | 'widget'
  className?: string
}

function enrichFromResponse(res: ChatResponse): AssistantMessage {
  return {
    role: 'assistant',
    content: res.message,
    actionsExecuted: res.actionsExecuted,
    artifacts: res.artifacts,
    references: res.references,
    suggestedActions: res.suggestedActions,
    plan: res.plan,
    source: 'agent',
  }
}

const FLOW_COPY: Record<VoiceFlowState, { chip: string }> = {
  idle: { chip: 'Ready' },
  connecting: { chip: 'Connecting' },
  listening: { chip: 'Listening' },
  speaking: { chip: 'Speaking' },
  executing: { chip: 'Executing' },
}

const FLOW_TONE: Record<VoiceFlowState, string> = {
  idle: 'border-indigo-400/25 bg-indigo-500/10 text-indigo-100',
  connecting: 'border-sky-400/30 bg-sky-500/12 text-sky-100',
  listening: 'border-blue-400/35 bg-blue-500/14 text-blue-100',
  speaking: 'border-cyan-400/35 bg-cyan-500/14 text-cyan-100',
  executing: 'border-violet-400/35 bg-violet-500/14 text-violet-100',
}

function VoiceStatusPill({ flowState }: { flowState: VoiceFlowState }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
        FLOW_TONE[flowState],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {FLOW_COPY[flowState].chip}
    </span>
  )
}

function SpeakCtaButton({
  campaignName,
  flowState,
  onClick,
  disabled,
}: {
  campaignName: string
  flowState: VoiceFlowState
  onClick: () => void
  disabled?: boolean
}) {
  const active = flowState !== 'idle'
  const label = active
    ? flowState === 'connecting'
      ? 'Connecting…'
      : 'End conversation'
    : `Speak with ${campaignName}`

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || flowState === 'connecting' || flowState === 'executing'}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-shadow',
        active
          ? 'border border-white/15 bg-white/[0.08] shadow-[0_0_32px_-8px_rgba(255,255,255,0.25)] hover:bg-white/[0.12]'
          : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 shadow-[0_0_48px_-6px_rgba(59,130,246,0.75)] hover:shadow-[0_0_56px_-4px_rgba(99,102,241,0.85)]',
        (disabled || flowState === 'connecting' || flowState === 'executing') && 'opacity-70 cursor-wait',
      )}
    >
      <AudioWaveform className="size-4 shrink-0" />
      {label}
    </motion.button>
  )
}

export function LiveVoiceAssistant({ variant = 'page', className }: LiveVoiceAssistantProps) {
  const router = useRouter()
  const { data, refresh } = useWorkspace()
  const { languageCode } = useVoiceLanguage()
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [liveEnabled, setLiveEnabled] = useState<boolean | null>(null)
  const [liveAgentId, setLiveAgentId] = useState<string | null>(null)
  const [liveFlowState, setLiveFlowState] = useState<VoiceFlowState>('idle')
  const [liveStatusLabel, setLiveStatusLabel] = useState<string>()
  const orbClickRef = useRef<(() => void) | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const skipNextSpokenRef = useRef(false)
  const pinnedRef = useRef(true)

  const isWidget = variant === 'widget'

  const getViewport = useCallback(
    () =>
      (scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null) ??
      null,
    [],
  )

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!pinnedRef.current) return
    requestAnimationFrame(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior, block: 'end' })
    })
  }, [])

  useEffect(() => {
    fetch('/api/voice/status')
      .then((r) => r.json())
      .then((j) => {
        setLiveEnabled(Boolean(j?.data?.voice?.enabled))
        setLiveAgentId(j?.data?.agent?.agentId ?? null)
      })
      .catch(() => setLiveEnabled(false))
  }, [])

  useEffect(() => {
    if (liveEnabled === false && !isWidget) {
      router.replace('/dashboard/chat')
    }
  }, [liveEnabled, isWidget, router])

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
  }, [getViewport, messages.length])

  useEffect(() => {
    if (pinnedRef.current) scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    pinnedRef.current = true
    scrollToBottom('auto')
  }, [scrollToBottom])

  const onLiveAgentMessage = useCallback((msg: { role: 'user' | 'assistant'; content: string }) => {
    if (!msg.content.trim()) return
    if (msg.role === 'assistant' && skipNextSpokenRef.current) {
      skipNextSpokenRef.current = false
      return
    }
    setMessages((prev) => [...prev, { ...msg, source: 'agent' }])
  }, [])

  const onLiveFlowChange = useCallback((state: VoiceFlowState, label?: string) => {
    setLiveFlowState(state)
    setLiveStatusLabel(label)
  }, [])

  const onLiveAgentToolResult = useCallback(
    (res: ChatResponse) => {
      skipNextSpokenRef.current = true
      setMessages((prev) => [...prev, enrichFromResponse(res)])
      if (res.actionsExecuted.some((a) => a.type === 'run_agent' || a.type === 'run_workflow')) {
        void refresh()
      }
    },
    [refresh],
  )

  const campaignName = data?.campaign.companyName || 'ContentOps'
  const hasTranscript = messages.length > 0
  const latestUserLine = [...messages].reverse().find((m) => m.role === 'user')?.content
  const latestAssistantLine = [...messages].reverse().find((m) => m.role === 'assistant')?.content
  const glassTranscript =
    liveFlowState === 'listening' && latestUserLine
      ? latestUserLine
      : latestAssistantLine || latestUserLine

  const messageList = (
    <ScrollArea className="h-full min-h-0">
      <div ref={scrollRef} className="space-y-2.5 px-4 py-3 sm:px-5">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={`live-${i}-${msg.role}-${msg.content.slice(0, 24)}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <AssistantMessageBubble message={msg} compact showSuggestedActions={false} />
            </motion.div>
          ))}
          {liveFlowState === 'executing' && (
            <VoiceExecutionShimmer label={liveStatusLabel ?? 'Working'} />
          )}
        </AnimatePresence>
        <div ref={scrollAnchorRef} className="h-px shrink-0" aria-hidden />
      </div>
    </ScrollArea>
  )

  const voiceSession = (
    <ElevenLabsAgentSession
      agentId={liveAgentId}
      language={languageCode}
      onRefresh={refresh}
      onMessage={onLiveAgentMessage}
      onCommandResult={onLiveAgentToolResult}
      onFlowStateChange={onLiveFlowChange}
      onOrbReady={(click) => {
        orbClickRef.current = click
      }}
      embed
      showEndButton={false}
      orbSize={isWidget ? 'sm' : 'xl'}
    />
  )

  if (liveEnabled === null) {
    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-8 sm:px-6', className)}>
        <VoiceAgentConsole loading loadingLabel="Starting voice" className="max-w-xl" />
      </div>
    )
  }

  if (liveEnabled === false) {
    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          Live voice requires ElevenLabs — add <code className="text-xs">ELEVENLABS_API_KEY</code> to{' '}
          <code className="text-xs">.env.local</code>
        </p>
      </div>
    )
  }

  if (isWidget) {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}>
        <SectionPanel variant="voice" className="shrink-0">
          <div className="px-3 py-4">
            <VoiceSectionHeader
              flowState={liveFlowState}
              trailing={<VoiceLanguageSelect compact />}
            />
            <div className="mt-4 flex flex-col items-center gap-3">
              {voiceSession}
              <VoiceGlassSession
                flowState={liveFlowState}
                transcript={glassTranscript}
                statusLabel={liveStatusLabel}
              />
            </div>
          </div>
        </SectionPanel>

        <SectionPanel
          variant="transcript"
          className="min-h-0 flex-1"
          header={<TranscriptSectionHeader count={hasTranscript ? messages.length : undefined} />}
        >
          {messageList}
        </SectionPanel>
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-auto lg:overflow-hidden', className)}>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-5">
        <section className="relative flex min-h-[34rem] flex-col overflow-hidden rounded-[1.75rem] border border-sky-400/10 bg-[#05070a] shadow-[0_32px_100px_-40px_rgba(37,99,235,0.45)] lg:min-h-0">
          <VoiceAuraBackdrop state={liveFlowState} />

          <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/15 text-indigo-100">
                <Sparkles className="size-4" />
              </div>
              <p className="truncate text-sm font-semibold text-white/90">{campaignName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <VoiceStatusPill flowState={liveFlowState} />
              <VoiceLanguageSelect compact className="h-9 min-w-[8.5rem] border-white/10 bg-white/[0.04] text-xs text-white/80" />
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-8 pt-2 sm:gap-7 sm:px-6 sm:pb-10">
            <div className="max-w-2xl text-center">
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl xl:text-[2.65rem]">
                Talk to {campaignName}
                <span className="block text-white/55">— Smarter, Faster, Better</span>
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/45 sm:text-[0.95rem]">
                Live voice manager for the 11-agent ContentOps workflow. Speak naturally and delegate
                research, content, leads, and publishing.
              </p>
            </div>

            <div className="flex flex-col items-center gap-5">
              {voiceSession}
              <SpeakCtaButton
                campaignName={campaignName}
                flowState={liveFlowState}
                onClick={() => orbClickRef.current?.()}
              />
            </div>

            <VoiceGlassSession
              flowState={liveFlowState}
              transcript={glassTranscript}
              statusLabel={liveStatusLabel}
              className="mt-1"
            />
          </div>
        </section>

        <aside className="flex min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] shadow-[0_24px_70px_-36px_rgba(0,0,0,0.7)] backdrop-blur-xl lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Live transcript</p>
              <p className="truncate text-xs text-muted-foreground">Conversation and tool results</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground">
              <AudioLines className="size-3.5" />
              {messages.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {hasTranscript || liveFlowState === 'executing' ? (
              messageList
            ) : (
              <div className="flex h-full min-h-[14rem] flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-sm text-muted-foreground">Your conversation will appear here</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
