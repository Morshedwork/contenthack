'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Conversation } from '@elevenlabs/client'
import type { Status } from '@elevenlabs/client'
import type { ChatResponse } from '@/lib/agents/types'
import { cn } from '@/lib/utils'
import { PhoneOff } from 'lucide-react'
import { toast } from 'sonner'
import type { VoiceFlowState } from '@/components/voice/voice-flow-orb'
import { VoiceParticleSphere } from '@/components/voice/voice-particle-sphere'

type AgentMode = 'listening' | 'speaking' | 'idle'

interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ElevenLabsAgentSessionProps {
  agentId: string | null
  language?: string
  onMessage?: (message: AgentMessage) => void
  onCommandResult?: (response: ChatResponse) => void
  onRefresh?: () => Promise<void> | void
  onFlowStateChange?: (state: VoiceFlowState, label?: string) => void
  onOrbReady?: (click: () => void) => void
  className?: string
  compact?: boolean
  embed?: boolean
  orbSize?: 'sm' | 'md' | 'lg' | 'xl'
  showEndButton?: boolean
}

export function ElevenLabsAgentSession({
  agentId,
  language = 'en',
  onMessage,
  onCommandResult,
  onRefresh,
  onFlowStateChange,
  onOrbReady,
  className,
  compact,
  embed,
  orbSize,
  showEndButton = true,
}: ElevenLabsAgentSessionProps) {
  const conversationRef = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<Status>('disconnected')
  const [agentMode, setAgentMode] = useState<AgentMode>('idle')
  const [starting, setStarting] = useState(false)
  const [toolRunning, setToolRunning] = useState(false)
  const [toolLabel, setToolLabel] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(agentId)

  useEffect(() => {
    setActiveAgentId(agentId)
  }, [agentId])

  const pushMessage = useCallback(
    (msg: AgentMessage) => {
      onMessage?.(msg)
    },
    [onMessage],
  )

  const ensureAgentId = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/voice/agent/provision', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language }),
    })
    const json = await res.json()
    if (!res.ok || !json?.success) throw new Error(json?.error || 'Could not set up agent')

    const id = json.data.agentId as string
    setActiveAgentId(id)
    if (json.data.created) {
      toast.success('Agent ready')
    }
    return id
  }, [language])

  const clientTools = useCallback(
    () => ({
      run_contentops_command: async (parameters: { command?: string }) => {
        const command = parameters?.command?.trim()
        if (!command) return 'No command provided.'

        pushMessage({ role: 'user', content: command })
        setToolRunning(true)
        setToolLabel(truncateLabel(command))

        try {
          const res = await fetch('/api/voice/command', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ transcript: command, history: [], language }),
          })
          const json = await res.json()
          if (!res.ok || !json?.success) {
            return json?.error || 'ContentOps command failed'
          }

          const summary =
            json.data?.briefing?.spokenSummary || json.data?.message || 'Command completed.'
          if (onCommandResult) {
            onCommandResult(json.data as ChatResponse)
          } else {
            pushMessage({ role: 'assistant', content: summary })
          }

          if (
            json.data?.actionsExecuted?.some(
              (a: { type?: string }) => a.type === 'run_agent' || a.type === 'run_workflow',
            )
          ) {
            await onRefresh?.()
          }

          return summary
        } finally {
          setToolRunning(false)
          setToolLabel(null)
        }
      },
      get_workspace_status: async () => {
        setToolRunning(true)
        setToolLabel('Checking workspace')

        try {
          const res = await fetch('/api/workspace')
          const json = await res.json()
          if (!res.ok || !json?.data) return 'Could not load workspace status.'

          const ws = json.data
          const completed = ws.agents?.filter((a: { status: string }) => a.status === 'completed').length ?? 0
          const total = ws.agents?.length ?? 0
          const summary = `${ws.campaign?.companyName || 'Campaign'} — ${completed}/${total} agents · ${ws.leads?.length ?? 0} leads · ${ws.roi?.weeklyHoursSaved ?? 0}h saved`
          pushMessage({ role: 'assistant', content: summary })
          return summary
        } finally {
          setToolRunning(false)
          setToolLabel(null)
        }
      },
    }),
    [onRefresh, onCommandResult, pushMessage, language],
  )

  const stopSession = useCallback(async () => {
    try {
      await conversationRef.current?.endSession()
    } catch {
      // session may already be closed
    }
    conversationRef.current = null
    setAgentMode('idle')
    setConnectionStatus('disconnected')
  }, [])

  const startSession = useCallback(async () => {
    if (starting || connectionStatus === 'connected') return
    setStarting(true)

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      toast.error('Microphone access is required')
      setStarting(false)
      return
    }

    try {
      const id = await ensureAgentId()
      const res = await fetch(`/api/voice/agent/token?agentId=${encodeURIComponent(id)}`)
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Could not start agent session')

      await stopSession()

      const conversation = await Conversation.startSession({
        conversationToken: json.data.token as string,
        connectionType: 'webrtc',
        clientTools: clientTools(),
        onConnect: () => setConnectionStatus('connected'),
        onDisconnect: () => {
          setConnectionStatus('disconnected')
          setAgentMode('idle')
          conversationRef.current = null
        },
        onStatusChange: ({ status }) => setConnectionStatus(status),
        onModeChange: ({ mode }) => setAgentMode(mode === 'speaking' ? 'speaking' : 'listening'),
        onMessage: ({ message, source }) => {
          if (!message?.trim()) return
          if (source === 'user') pushMessage({ role: 'user', content: message })
          if (source === 'ai') pushMessage({ role: 'assistant', content: message })
        },
        onError: (message) => toast.error(typeof message === 'string' ? message : 'Agent error'),
      })

      conversationRef.current = conversation
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not connect agent')
      await stopSession()
    } finally {
      setStarting(false)
    }
  }, [clientTools, connectionStatus, ensureAgentId, pushMessage, starting, stopSession])

  useEffect(
    () => () => {
      void conversationRef.current?.endSession()
    },
    [],
  )

  const connected = connectionStatus === 'connected'

  const flowState: VoiceFlowState = toolRunning
    ? 'executing'
    : starting
      ? 'connecting'
      : connected
        ? agentMode === 'speaking'
          ? 'speaking'
          : 'listening'
        : 'idle'

  const statusText = toolRunning
    ? toolLabel ?? 'Working'
    : starting
      ? 'Connecting'
      : connected
        ? agentMode === 'speaking'
          ? 'Speaking'
          : 'Listening'
        : 'Tap to talk'

  useEffect(() => {
    onFlowStateChange?.(flowState, statusText)
  }, [flowState, statusText, onFlowStateChange])

  const handleOrbClick = useCallback(() => {
    if (starting || toolRunning) return
    if (connected) void stopSession()
    else void startSession()
  }, [connected, startSession, starting, stopSession, toolRunning])

  useEffect(() => {
    onOrbReady?.(handleOrbClick)
  }, [handleOrbClick, onOrbReady])

  const resolvedOrbSize = orbSize ?? (compact || embed ? 'sm' : 'xl')

  const orb = (
    <VoiceParticleSphere
      state={flowState}
      size={resolvedOrbSize}
      onClick={handleOrbClick}
      label={connected ? 'End conversation' : 'Start conversation'}
    />
  )

  if (embed) {
    return orb
  }

  return (
    <div
      className={cn(
        'relative flex w-full flex-col items-center justify-center gap-3 text-center',
        compact ? 'min-h-0 py-1' : 'min-h-0',
        className,
      )}
    >
      {orb}

      {!compact && (
        <AnimatePresence mode="wait">
          <motion.p
            key={statusText}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'text-sm font-medium tracking-wide',
              flowState === 'executing'
                ? 'text-amber-200'
                : flowState === 'speaking'
                  ? 'text-emerald-200'
                  : flowState === 'listening'
                    ? 'text-rose-200'
                    : flowState === 'connecting'
                      ? 'text-violet-200'
                      : 'text-white/45',
            )}
          >
            {statusText}
          </motion.p>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {connected && showEndButton && (
          <motion.button
            type="button"
            onClick={() => void stopSession()}
            initial={{ opacity: 0, y: 4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 4, height: 0 }}
            className="relative z-10 inline-flex size-9 items-center justify-center rounded-full border border-rose-500/25 bg-rose-500/10 text-rose-300 transition-colors hover:bg-rose-500/20"
            aria-label="End call"
          >
            <PhoneOff className="size-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function truncateLabel(text: string, max = 42): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}
