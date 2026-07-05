'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { ViewGenerationButtons } from '@/components/agents/view-generation-buttons'
import { useWorkspace } from '@/hooks/use-workspace'
import type { ChatActionExecuted, ChatMessage, ManagerBriefing } from '@/lib/agents/types'
import { cn } from '@/lib/utils'
import {
  AudioLines,
  Bot,
  Brain,
  Database,
  Layers,
  Lightbulb,
  Loader2,
  Mic,
  Radio,
  Send,
  Sparkles,
  Square,
  Swords,
  Target,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/* Web Speech API (not in the TS lib) — minimal structural typing     */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult:
    | ((event: {
        resultIndex: number
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
      }) => void)
    | null
  onend: (() => void) | null
  onerror: ((event: { error?: string }) => void) | null
}

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type ManagerStatus = 'idle' | 'listening' | 'transcribing' | 'executing' | 'speaking'

interface VoiceMessage extends ChatMessage {
  actionsExecuted?: ChatActionExecuted[]
  briefing?: ManagerBriefing
}

interface VoiceStatus {
  voice: { enabled: boolean; model: string | null }
  transcription: string | null
  gBrain: boolean
  gStack: string[]
  crustdata: boolean
}

const STATUS_COPY: Record<ManagerStatus, string> = {
  idle: 'Standing by — tap the mic and give me an order',
  listening: 'Listening…',
  transcribing: 'Transcribing your command…',
  executing: 'On it — running the agents you asked for…',
  speaking: 'Briefing you… (tap the orb to interrupt)',
}

const SUGGESTED_COMMANDS = [
  'Run the full workflow and brief me on the results',
  'Research the market and give me a competitive analysis',
  'Generate LinkedIn posts about our main offer',
  'Find qualified leads and draft outreach',
  'Give me a full status report with recommendations',
] as const

const WELCOME: VoiceMessage = {
  role: 'assistant',
  content:
    "I'm your Voice Manager — the G-Brain orchestrator. Tell me one task at a time (research, posts, leads, outreach) and I'll run only the agents you need. Say \"run the full workflow\" when you want every agent end-to-end.",
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                       */
/* ------------------------------------------------------------------ */

function PillarChip({
  icon: Icon,
  label,
  active,
  detail,
}: {
  icon: typeof Brain
  label: string
  active: boolean
  detail: string
}) {
  return (
    <div
      title={detail}
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
          : 'border-border/60 bg-secondary/30 text-muted-foreground',
      )}
    >
      <Icon className="size-3.5" />
      {label}
      <span className={cn('size-1.5 rounded-full', active ? 'bg-emerald-400' : 'bg-muted-foreground/40')} />
    </div>
  )
}

function VoiceOrb({ status, onClick }: { status: ManagerStatus; onClick: () => void }) {
  const busy = status === 'transcribing' || status === 'executing'
  const listening = status === 'listening'
  const speaking = status === 'speaking'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={listening ? 'Stop listening' : 'Start voice command'}
      className="relative flex size-24 items-center justify-center rounded-full outline-none disabled:cursor-wait"
    >
      {(listening || speaking) && (
        <>
          <span className="absolute inset-0 rounded-full bg-violet-500/25 animate-ping" />
          <span className="absolute -inset-2 rounded-full bg-violet-500/15 animate-pulse" />
        </>
      )}
      <span
        className={cn(
          'relative flex size-20 items-center justify-center rounded-full border transition-all duration-300 shadow-xl',
          listening
            ? 'bg-gradient-to-br from-rose-500 to-violet-600 border-rose-300/40 shadow-rose-500/40 scale-105'
            : speaking
              ? 'bg-gradient-to-br from-emerald-500 to-blue-600 border-emerald-300/40 shadow-emerald-500/30'
              : 'bg-gradient-to-br from-violet-500 to-blue-600 border-white/15 shadow-violet-500/40 hover:scale-105',
        )}
      >
        {busy ? (
          <Loader2 className="size-8 text-white animate-spin" />
        ) : listening ? (
          <Square className="size-7 text-white fill-white" />
        ) : speaking ? (
          <AudioLines className="size-8 text-white" />
        ) : (
          <Mic className="size-8 text-white" />
        )}
      </span>
    </button>
  )
}

function BriefingPanel({ briefing }: { briefing: ManagerBriefing }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="label-caps mb-1.5">Manager Briefing</p>
        <h3 className="font-display text-lg leading-snug">{briefing.headline}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(briefing.generatedAt).toLocaleTimeString()} · voiced by{' '}
          {briefing.stack.voice ? 'ElevenLabs' : 'browser TTS'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {briefing.metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xl font-semibold leading-none">{m.value}</p>
            <p className="text-xs font-medium mt-1.5">{m.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.detail}</p>
          </div>
        ))}
      </div>

      <section>
        <p className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-violet-300">
          <Lightbulb className="size-3.5" /> Insights
        </p>
        <ul className="space-y-1.5">
          {briefing.insights.map((line, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed pl-3 border-l border-violet-500/30">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-emerald-300">
          <Target className="size-3.5" /> Recommended next moves
        </p>
        <ul className="space-y-1.5">
          {briefing.recommendations.map((line, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed pl-3 border-l border-emerald-500/30">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-amber-300">
          <Swords className="size-3.5" /> Competitive edge · CrustData
        </p>
        <ul className="space-y-1.5">
          {briefing.competitiveEdge.map((line, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed pl-3 border-l border-amber-500/30">
              {line}
            </li>
          ))}
        </ul>
      </section>

      {briefing.stack.gStack.length > 0 && (
        <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-3">
          G-Stack chain: {briefing.stack.gStack.join(' → ')}
          {briefing.stack.crustdata ? ' · grounded in CrustData' : ''}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export function VoiceManager() {
  const { refresh } = useWorkspace()
  const [status, setStatus] = useState<ManagerStatus>('idle')
  const [messages, setMessages] = useState<VoiceMessage[]>([WELCOME])
  const [interim, setInterim] = useState('')
  const [input, setInput] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [liveMode, setLiveMode] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null)
  const [latestBriefing, setLatestBriefing] = useState<ManagerBriefing | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef(status)
  statusRef.current = status
  const liveModeRef = useRef(liveMode)
  liveModeRef.current = liveMode
  // Breaks the runCommand ↔ startListening definition cycle for the live loop.
  const startListeningRef = useRef<() => void>(() => {})
  // Lets stopSpeaking() settle an in-flight playback promise (pause() never fires onended).
  const speechResolveRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    fetch('/api/voice/status')
      .then((r) => r.json())
      .then((json) => json?.data && setVoiceStatus(json.data as VoiceStatus))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [messages, status, interim])

  useEffect(
    () => () => {
      recognitionRef.current?.abort()
      audioRef.current?.pause()
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    },
    [],
  )

  /* ------------------------- speech output ------------------------- */

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis?.cancel()
    speechResolveRef.current?.()
    speechResolveRef.current = null
    setStatus((s) => (s === 'speaking' ? 'idle' : s))
  }, [])

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return
    setStatus('speaking')
    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('elevenlabs unavailable')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      await new Promise<void>((resolve) => {
        const settle = () => {
          URL.revokeObjectURL(url)
          speechResolveRef.current = null
          resolve()
        }
        speechResolveRef.current = settle
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = settle
        audio.onerror = settle
        void audio.play().catch(settle)
      })
    } catch {
      // Graceful fallback to the browser's built-in voice
      await new Promise<void>((resolve) => {
        if (!window.speechSynthesis) return resolve()
        const settle = () => {
          speechResolveRef.current = null
          resolve()
        }
        speechResolveRef.current = settle
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.02
        utterance.onend = settle
        utterance.onerror = settle
        window.speechSynthesis.speak(utterance)
      })
    } finally {
      audioRef.current = null
      setStatus((s) => (s === 'speaking' ? 'idle' : s))
    }
  }, [])

  /* ------------------------- command flow -------------------------- */

  const runCommand = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || statusRef.current === 'executing') return

      stopSpeaking()
      const history = messages.filter((m) => m !== WELCOME).map(({ role, content }) => ({ role, content }))
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
      setInput('')
      setInterim('')
      setStatus('executing')

      try {
        const res = await fetch('/api/voice/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: trimmed, history }),
        })
        const json = await res.json()
        if (!res.ok || !json?.success) throw new Error(json?.error || `Command failed (${res.status})`)

        const data = json.data as VoiceMessage & { briefing: ManagerBriefing; live: boolean; message: string }
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message,
            actionsExecuted: data.actionsExecuted,
            briefing: data.briefing,
          },
        ])
        setLatestBriefing(data.briefing)

        if (data.actionsExecuted?.some((a) => a.type === 'run_agent' || a.type === 'run_workflow')) {
          await refresh()
        }

        setStatus('idle')
        if (autoSpeak || liveModeRef.current) await speak(data.briefing.spokenSummary)
        // Live conversation: hand the mic back automatically after the briefing.
        if (liveModeRef.current && statusRef.current === 'idle') startListeningRef.current()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Voice command failed'
        setMessages((prev) => [...prev, { role: 'assistant', content: `I hit a problem: ${message}` }])
        toast.error(message)
        setStatus('idle')
      }
    },
    [messages, autoSpeak, refresh, speak, stopSpeaking],
  )

  /* ------------------------- speech input -------------------------- */

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }, [])

  const startRecorderFallback = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setStatus('transcribing')
        try {
          const form = new FormData()
          form.append('audio', new File(chunks, 'command.webm', { type: recorder.mimeType || 'audio/webm' }))
          const res = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
          const json = await res.json()
          const transcript: string = json?.data?.transcript ?? ''
          if (!res.ok || !transcript) throw new Error(json?.error || 'Could not hear a command')
          await runCommand(transcript)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Transcription failed')
          setStatus('idle')
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setStatus('listening')
    } catch {
      toast.error('Microphone access denied — type your command instead')
      setStatus('idle')
    }
  }, [runCommand])

  const startListening = useCallback(() => {
    const recognition = getSpeechRecognition()
    if (!recognition) {
      void startRecorderFallback()
      return
    }

    let finalTranscript = ''
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalTranscript += result[0].transcript
        else interimText += result[0].transcript
      }
      setInterim(interimText || finalTranscript)
    }
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') toast.error('Microphone access denied — type your command instead')
      else if (event.error && event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error(`Voice input error: ${event.error}`)
      }
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setInterim('')
      const text = finalTranscript.trim()
      if (text) void runCommand(text)
      else setStatus((s) => (s === 'listening' ? 'idle' : s))
    }

    recognitionRef.current = recognition
    recognition.start()
    setStatus('listening')
  }, [runCommand, startRecorderFallback])
  startListeningRef.current = startListening

  const handleOrbClick = () => {
    if (status === 'speaking') {
      // Barge-in: cut the briefing short and hand the mic back immediately.
      stopSpeaking()
      if (liveModeRef.current) startListening()
      return
    }
    if (status === 'listening') return stopListening()
    if (status === 'idle') startListening()
  }

  const toggleLiveMode = () => {
    const next = !liveMode
    setLiveMode(next)
    if (next) {
      toast.success('Live conversation on — I\u2019ll keep listening after each briefing')
      if (statusRef.current === 'idle') startListening()
    } else if (statusRef.current === 'listening') {
      stopListening()
    }
  }

  /* ---------------------------- render ------------------------------ */

  const executing = status === 'executing' || status === 'transcribing'

  return (
    <div className="flex flex-col gap-5">
      {/* Hero: orb + status + pillars */}
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-background/40 to-blue-500/5 p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <VoiceOrb status={status} onClick={handleOrbClick} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl tracking-tight">Voice Manager</h2>
            <p className={cn('text-sm mt-1', status === 'listening' ? 'text-rose-300' : 'text-muted-foreground')}>
              {STATUS_COPY[status]}
            </p>
            {interim && (
              <p className="text-sm mt-2 text-violet-200 italic truncate">&ldquo;{interim}&rdquo;</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <PillarChip
                icon={Brain}
                label="G-Brain"
                active={voiceStatus?.gBrain ?? false}
                detail="Executive orchestration — parses intent and commands all 11 agents"
              />
              <PillarChip
                icon={Layers}
                label="G-Stack"
                active={(voiceStatus?.gStack.length ?? 0) > 0}
                detail={
                  voiceStatus?.gStack.length
                    ? `Layered model chain: ${voiceStatus.gStack.join(' → ')}`
                    : 'Add OPENAI_API_KEY / KIMI_API_KEY to activate the model stack'
                }
              />
              <PillarChip
                icon={Database}
                label="CrustData"
                active={voiceStatus?.crustdata ?? false}
                detail="Real company & market data grounds every briefing in evidence"
              />
              <PillarChip
                icon={AudioLines}
                label="ElevenLabs"
                active={voiceStatus?.voice.enabled ?? false}
                detail={
                  voiceStatus?.voice.enabled
                    ? `Neural voice via ${voiceStatus.voice.model}`
                    : 'Add ELEVENLABS_API_KEY for neural voice (browser TTS fallback active)'
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <Button
              variant={liveMode ? 'default' : 'outline'}
              size="sm"
              onClick={toggleLiveMode}
              disabled={executing}
              className={cn(
                'h-9 rounded-xl text-xs',
                liveMode && 'bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 text-white border-0',
              )}
            >
              <Radio data-icon="inline-start" className={cn('size-3.5', liveMode && 'animate-pulse')} />
              {liveMode ? 'Live conversation on' : 'Live conversation'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoSpeak((v) => !v)}
              className="h-9 rounded-xl text-xs"
            >
              {autoSpeak ? (
                <Volume2 data-icon="inline-start" className="size-3.5 text-emerald-300" />
              ) : (
                <VolumeX data-icon="inline-start" className="size-3.5" />
              )}
              {autoSpeak ? 'Auto-brief on' : 'Auto-brief off'}
            </Button>
            {latestBriefing && (
              <Button
                variant="outline"
                size="sm"
                disabled={status === 'speaking' || executing}
                onClick={() => void speak(latestBriefing.spokenSummary)}
                className="h-9 rounded-xl text-xs"
              >
                <AudioLines data-icon="inline-start" className="size-3.5 text-violet-300" />
                Replay briefing
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px] items-start">
        {/* Conversation */}
        <div className="flex flex-col rounded-xl border border-border/60 bg-background/40 backdrop-blur-sm overflow-hidden min-h-[480px] h-[calc(100vh-27rem)]">
          <ScrollArea className="flex-1 min-h-0">
            <div ref={scrollRef} className="p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={`${msg.role}-${i}`}
                  className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
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
                      <Mic className="size-4 text-white" />
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
                    <p className="leading-relaxed whitespace-pre-wrap text-foreground/90">{msg.content}</p>
                    {msg.role === 'assistant' && (msg.actionsExecuted?.length || msg.briefing) ? (
                      <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5">
                        {msg.actionsExecuted?.some((a) => a.results?.length) && (
                          <div className="flex flex-wrap gap-1">
                            {msg.actionsExecuted
                              .flatMap((a) => a.results ?? [])
                              .map((r) => (
                                <Badge
                                  key={r.agentId}
                                  variant={r.status === 'failed' ? 'destructive' : 'secondary'}
                                  className="text-[10px]"
                                >
                                  {r.agentName}
                                </Badge>
                              ))}
                          </div>
                        )}
                        {msg.actionsExecuted && (
                          <ViewGenerationButtons actions={msg.actionsExecuted} compact />
                        )}
                        {msg.briefing && (
                          <button
                            type="button"
                            onClick={() => void speak(msg.briefing!.spokenSummary)}
                            disabled={executing || status === 'speaking'}
                            className="inline-flex items-center gap-1.5 text-[11px] text-violet-300 hover:text-violet-200 disabled:opacity-50"
                          >
                            <Volume2 className="size-3" /> Hear this briefing
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {executing && (
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                    <Bot className="size-4 text-violet-300" />
                  </div>
                  <div className="rounded-xl px-4 py-3 bg-secondary/40 border border-border/40">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      {status === 'transcribing' ? 'Transcribing…' : 'Dispatching agents & compiling your briefing…'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto thin-scroll shrink-0">
            {SUGGESTED_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => void runCommand(cmd)}
                disabled={executing}
                className="shrink-0 rounded-full border border-border/60 bg-secondary/30 px-3 py-1 text-[11px] text-muted-foreground hover:bg-violet-500/10 hover:text-foreground hover:border-violet-500/30 disabled:opacity-50 transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void runCommand(input)
            }}
            className="border-t border-border/60 p-3 shrink-0"
          >
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void runCommand(input)
                  }
                }}
                placeholder="Or type a command… e.g. Run research, generate posts, then brief me"
                disabled={executing}
                rows={2}
                className="min-h-[44px] max-h-32 resize-none bg-secondary/30 border-border/60 text-sm"
              />
              <Button type="submit" size="icon" disabled={executing || !input.trim()} className="shrink-0 size-10">
                {executing ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3" />
              The manager executes any agent, the full workflow, or answers with a data briefing
            </p>
          </form>
        </div>

        {/* Briefing panel */}
        <div className="rounded-xl border border-border/60 bg-background/40 backdrop-blur-sm p-5 lg:sticky lg:top-20">
          {latestBriefing ? (
            <BriefingPanel briefing={latestBriefing} />
          ) : (
            <div className="flex flex-col items-center text-center py-10 gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/20">
                <Brain className="size-6 text-violet-300" />
              </div>
              <p className="text-sm font-medium">No briefing yet</p>
              <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                Give the manager a command and it will report back here with metrics, analysis,
                recommendations, and your CrustData competitive edge.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
