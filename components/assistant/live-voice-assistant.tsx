'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AudioWaveform, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssistantMessage } from '@/components/assistant/assistant-message-bubble'
import { SectionPanel, VoiceSectionHeader } from '@/components/assistant/assistant-page-shell'
import { ElevenLabsAgentSession } from '@/components/voice/elevenlabs-agent-session'
import { VoiceAuraBackdrop } from '@/components/voice/voice-aura-backdrop'
import { VoiceGlassSession } from '@/components/voice/voice-glass-session'
import { VoiceLanguageSelect } from '@/components/voice/voice-language-select'
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
  const skipNextSpokenRef = useRef(false)

  const isWidget = variant === 'widget'

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
  const latestUserLine = [...messages].reverse().find((m) => m.role === 'user')?.content
  const latestAssistantLine = [...messages].reverse().find((m) => m.role === 'assistant')?.content
  const glassTranscript =
    liveFlowState === 'listening' && latestUserLine
      ? latestUserLine
      : latestAssistantLine || latestUserLine

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

  const glassSession = (
    <VoiceGlassSession
      flowState={liveFlowState}
      transcript={glassTranscript}
      statusLabel={liveStatusLabel}
    />
  )

  if (liveEnabled === null) {
    return (
      <div className={cn('flex w-full flex-col items-center justify-center px-4 py-8', className)}>
        <VoiceAgentConsole loading loadingLabel="Starting voice" className="w-full" />
      </div>
    )
  }

  if (liveEnabled === false) {
    return (
      <div className={cn('flex w-full flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
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
        <SectionPanel variant="voice" className="min-h-0 flex-1">
          <div className="px-3 py-4">
            <VoiceSectionHeader
              flowState={liveFlowState}
              trailing={<VoiceLanguageSelect compact />}
            />
            <div className="mt-4 flex flex-col items-center gap-3">
              {voiceSession}
              {glassSession}
            </div>
          </div>
        </SectionPanel>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <section className="relative overflow-hidden rounded-[1.75rem] border border-sky-400/10 bg-[#05070a] shadow-[0_28px_80px_-32px_rgba(37,99,235,0.45)]">
        <VoiceAuraBackdrop state={liveFlowState} />

        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/15 text-indigo-100">
              <Sparkles className="size-3.5" />
            </div>
            <p className="truncate text-sm font-semibold text-white/90">{campaignName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <VoiceStatusPill flowState={liveFlowState} />
            <VoiceLanguageSelect compact className="h-8 min-w-[7.5rem] border-white/10 bg-white/[0.04] text-xs text-white/80" />
          </div>
        </div>

        <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 xl:gap-12">
            <div className="flex flex-col items-center justify-center gap-6 text-center lg:items-center lg:py-4">
              <div className="lg:hidden">
                <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[1.75rem]">
                  Talk to {campaignName}
                  <span className="block text-base font-normal text-white/50 sm:text-lg">
                    — Smarter, Faster, Better
                  </span>
                </h1>
                <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-white/40">
                  Live voice manager for the 11-agent ContentOps workflow.
                </p>
              </div>

              {voiceSession}

              <SpeakCtaButton
                campaignName={campaignName}
                flowState={liveFlowState}
                onClick={() => orbClickRef.current?.()}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
              <div className="hidden text-left lg:block">
                <h1 className="font-display text-[1.85rem] font-semibold leading-tight tracking-tight text-white xl:text-[2.1rem]">
                  Talk to {campaignName}
                  <span className="block text-lg font-normal text-white/50">
                    — Smarter, Faster, Better
                  </span>
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/40">
                  Live voice manager for the 11-agent ContentOps workflow. Speak naturally and
                  delegate research, content, leads, and publishing.
                </p>
              </div>

              <div className="w-full">{glassSession}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
