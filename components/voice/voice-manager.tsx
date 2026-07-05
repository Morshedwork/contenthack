'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DataPipelineFlow,
  pipelineStageForStatus,
} from '@/components/voice/data-pipeline-flow'
import { LiveWorkspaceRail } from '@/components/voice/live-workspace-rail'
import { VoiceLiveStage } from '@/components/voice/voice-live-stage'
import { VoiceLanguageSelect } from '@/components/voice/voice-language-select'
import type { VoiceOrbStatus } from '@/components/voice/voice-orb'
import { useVoiceLanguage } from '@/hooks/use-voice-language'
import { useWorkspace } from '@/hooks/use-workspace'
import type { WorkspacePayload } from '@/lib/workspace/client'
import type { ChatActionExecuted, ChatMessage, ManagerBriefing } from '@/lib/agents/types'
import { cn } from '@/lib/utils'
import {
  Bot,
  Loader2,
  Send,
  Volume2,
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

type ManagerStatus = VoiceOrbStatus

interface VoiceMessage extends ChatMessage {
  actionsExecuted?: ChatActionExecuted[]
  briefing?: ManagerBriefing
}

interface VoiceStatus {
  voice: { enabled: boolean; model: string | null }
  agent?: { enabled: boolean; configured: boolean; agentId: string | null }
  transcription: string | null
  gBrain: boolean
  gStack: string[]
  crustdata: boolean
}

type VoiceMode = 'commands' | 'agent'

function buildWelcome(data: WorkspacePayload | null): string {
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  if (!data) return `${greet}. Tap the mic when you're ready.`
  const name = data.campaign.companyName || 'your campaign'
  return `${greet}. ${name} — ${data.contentDrafts.length} drafts, ${data.leads.length} leads.`
}

const QUICK_COMMANDS = [
  { label: 'Full workflow', cmd: 'Run the full workflow and brief me' },
  { label: 'Research', cmd: 'Run market research' },
  { label: 'Posts', cmd: 'Generate LinkedIn posts' },
  { label: 'Leads', cmd: 'Find leads and draft outreach' },
] as const

function BriefingPanel({
  briefing,
  onListen,
  listening,
}: {
  briefing: ManagerBriefing
  onListen: () => void
  listening: boolean
}) {
  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h3 className="font-display text-2xl sm:text-3xl leading-tight">{briefing.headline}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {briefing.metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-border/50 bg-secondary/30 p-4 text-center">
            <p className="text-3xl font-semibold tabular-nums font-display leading-none">{m.value}</p>
            <p className="text-sm text-muted-foreground mt-2">{m.label}</p>
          </div>
        ))}
      </div>

      {briefing.recommendations[0] && (
        <p className="text-base sm:text-lg text-foreground/85 leading-relaxed border-l-2 border-emerald-500/50 pl-4">
          {briefing.recommendations[0]}
        </p>
      )}

      <Button
        onClick={onListen}
        disabled={listening}
        className="h-11 w-full sm:w-auto rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500"
      >
        <Volume2 data-icon="inline-start" className="size-4" />
        {listening ? 'Playing…' : 'Listen to briefing'}
      </Button>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export function VoiceManager() {
  const { data, loading, refresh } = useWorkspace()
  const { language, languageCode, resolveForText, resolveLanguageForText } = useVoiceLanguage()
  const [status, setStatus] = useState<ManagerStatus>('idle')
  const [messages, setMessages] = useState<VoiceMessage[]>([
    { role: 'assistant', content: buildWelcome(null) },
  ])
  const [interim, setInterim] = useState('')
  const [input, setInput] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [liveMode, setLiveMode] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null)
  const [latestBriefing, setLatestBriefing] = useState<ManagerBriefing | null>(null)
  const [executionPhase, setExecutionPhase] = useState(0)
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('agent')

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
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
    if (!data) return
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant' && !prev[0].briefing) {
        return [{ role: 'assistant', content: buildWelcome(data) }]
      }
      return prev
    })
  }, [data])

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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

  const speak = useCallback(async (text: string, langCode = resolveForText(text)) => {
    if (!text.trim()) return
    const voiceLang = resolveLanguageForText(text)
    setStatus('speaking')
    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: langCode }),
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
        utterance.lang = voiceLang.utteranceLang
        utterance.rate = 1.02
        utterance.onend = settle
        utterance.onerror = settle
        window.speechSynthesis.speak(utterance)
      })
    } finally {
      audioRef.current = null
      setStatus((s) => (s === 'speaking' ? 'idle' : s))
    }
  }, [resolveForText, resolveLanguageForText])

  /* ------------------------- command flow -------------------------- */

  const runCommand = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || statusRef.current === 'executing') return

      stopSpeaking()
      const history = messages
        .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.briefing))
        .map(({ role, content }) => ({ role, content }))
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
      setInput('')
      setInterim('')
      setExecutionPhase(0)
      setStatus('executing')

      const phaseTimer = window.setInterval(() => {
        setExecutionPhase((p) => Math.min(p + 1, 4))
      }, 800)

      try {
        const res = await fetch('/api/voice/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: trimmed, history, language: languageCode }),
        })
        const json = await res.json()
        if (!res.ok || !json?.success) throw new Error(json?.error || `Command failed (${res.status})`)

        const data = json.data as VoiceMessage & {
          briefing: ManagerBriefing
          live: boolean
          message: string
          detectedLanguage?: 'en' | 'bn' | 'ja'
        }
        const responseLang = data.detectedLanguage ?? resolveForText(trimmed)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message,
            actionsExecuted: data.actionsExecuted,
            briefing: data.briefing,
          },
        ])
        setLatestBriefing(
          data.briefing.insights.length > 0 ||
            data.actionsExecuted?.some((a) => a.type === 'run_agent' || a.type === 'run_workflow')
            ? data.briefing
            : null,
        )

        if (data.actionsExecuted?.some((a) => a.type === 'run_agent' || a.type === 'run_workflow')) {
          await refresh()
        }

        setStatus('idle')
        if (autoSpeak || liveModeRef.current) await speak(data.briefing.spokenSummary, responseLang)
        // Live conversation: hand the mic back automatically after the briefing.
        if (liveModeRef.current && statusRef.current === 'idle') startListeningRef.current()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Voice command failed'
        setMessages((prev) => [...prev, { role: 'assistant', content: `I hit a problem: ${message}` }])
        toast.error(message)
        setStatus('idle')
      } finally {
        window.clearInterval(phaseTimer)
        setExecutionPhase(0)
      }
    },
    [messages, autoSpeak, refresh, speak, stopSpeaking, languageCode, resolveForText],
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
          form.append('language', languageCode)
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
  }, [runCommand, languageCode])

  const startListening = useCallback(() => {
    const recognition = getSpeechRecognition()
    if (!recognition) {
      void startRecorderFallback()
      return
    }

    let finalTranscript = ''
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = language.speechRecognitionLang
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
  }, [runCommand, startRecorderFallback, language.speechRecognitionLang])
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

  const pipelineStage = pipelineStageForStatus(status, executionPhase)
  const showPipeline = pipelineStage !== null
  const campaignName = data?.campaign.companyName || 'Voice Manager'

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground hidden sm:block">Speak naturally — agent or mic mode</p>
        <VoiceLanguageSelect />
      </div>

      <VoiceLiveStage
        mode={voiceMode}
        onModeChange={setVoiceMode}
        agentEnabled={voiceStatus?.voice?.enabled ?? false}
        agentId={voiceStatus?.agent?.agentId ?? null}
        language={languageCode}
        campaignName={campaignName}
        commandStatus={status}
        interim={interim}
        liveMode={liveMode}
        autoSpeak={autoSpeak}
        executing={executing}
        onOrbClick={handleOrbClick}
        onToggleLive={toggleLiveMode}
        onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
        onAgentMessage={(msg) => setMessages((prev) => [...prev, msg].slice(-8))}
        onAgentRefresh={refresh}
      />

      {showPipeline && voiceMode === 'commands' && (
        <div className="rounded-2xl border border-border/40 bg-secondary/20 px-4 py-3">
          <DataPipelineFlow
            activeStage={pipelineStage}
            crustdataActive={voiceStatus?.crustdata ?? false}
            compact
          />
        </div>
      )}

      <LiveWorkspaceRail data={data} loading={loading} className="opacity-90" />

      {voiceMode === 'commands' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_COMMANDS.map(({ label, cmd }) => (
            <Button
              key={label}
              variant="outline"
              disabled={executing}
              onClick={() => void runCommand(cmd)}
              className="h-12 rounded-xl text-sm font-medium border-border/60 hover:bg-violet-500/10"
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      {latestBriefing && (
        <div className="rounded-2xl border border-border/50 bg-background/50 p-5 sm:p-6">
          <BriefingPanel
            briefing={latestBriefing}
            onListen={() => void speak(latestBriefing.spokenSummary)}
            listening={status === 'speaking'}
          />
        </div>
      )}

      <div className="rounded-2xl border border-border/50 bg-background/40 overflow-hidden flex flex-col h-[min(320px,42dvh)] min-h-[220px]">
        <div className="px-4 py-2 border-b border-border/40 flex items-center gap-2">
          <Bot className="size-4 text-violet-400" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transcript</span>
        </div>
        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
          <div className="p-4 space-y-3 pb-2">
            <AnimatePresence initial={false}>
              {messages.slice(-8).map((msg, i) => {
                const text = msg.content
                const isUser = msg.role === 'user'
                return (
                  <motion.div
                    key={`${msg.role}-${i}-${text.slice(0, 20)}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex gap-2 items-start', isUser ? 'justify-end' : 'flex-row')}
                  >
                    {!isUser && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                        <Bot className="size-3.5 text-violet-300" />
                      </div>
                    )}
                    <p
                      className={cn(
                        'max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                        isUser
                          ? 'bg-violet-500/15 text-violet-50'
                          : 'bg-secondary/50 text-foreground/85',
                      )}
                    >
                      {text}
                    </p>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {executing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-3">
                <Loader2 className="size-6 animate-spin text-violet-400" />
              </motion.div>
            )}
            <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
          </div>
        </ScrollArea>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void runCommand(input)
          }}
          className="relative z-10 shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-sm p-3 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Or type here…"
            disabled={executing}
            className="h-10 flex-1 min-w-0 rounded-xl text-sm bg-secondary/30 border-border/50 px-3"
          />
          <Button
            type="submit"
            size="icon"
            disabled={executing || !input.trim()}
            className="size-10 shrink-0 rounded-xl"
          >
            {executing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
