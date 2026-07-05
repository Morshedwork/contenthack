'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ElevenLabsAgentSession } from '@/components/voice/elevenlabs-agent-session'
import { VoiceAuraBackdrop } from '@/components/voice/voice-aura-backdrop'
import type { VoiceFlowState } from '@/components/voice/voice-flow-orb'
import { VoiceGlassSession } from '@/components/voice/voice-glass-session'
import { VoiceParticleSphere } from '@/components/voice/voice-particle-sphere'
import { VOICE_STATUS_COPY, type VoiceOrbStatus } from '@/components/voice/voice-orb'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AudioWaveform, Mic, Radio, Sparkles, Volume2, VolumeX } from 'lucide-react'

export type LiveVoiceMode = 'agent' | 'commands'

function statusToFlow(status: VoiceOrbStatus): VoiceFlowState {
  if (status === 'listening') return 'listening'
  if (status === 'speaking') return 'speaking'
  if (status === 'executing') return 'executing'
  if (status === 'transcribing') return 'connecting'
  return 'idle'
}

function useFlowState(initial: VoiceFlowState) {
  const valueRef = useRef(initial)
  const [, bump] = useState(0)
  return {
    get value() {
      return valueRef.current
    },
    set(v: VoiceFlowState) {
      if (valueRef.current === v) return
      valueRef.current = v
      bump((n) => n + 1)
    },
  }
}

interface VoiceLiveStageProps {
  mode: LiveVoiceMode
  onModeChange: (mode: LiveVoiceMode) => void
  agentEnabled: boolean
  agentId: string | null
  language: string
  campaignName: string
  commandStatus: VoiceOrbStatus
  interim: string
  liveMode: boolean
  autoSpeak: boolean
  executing: boolean
  onOrbClick: () => void
  onToggleLive: () => void
  onToggleAutoSpeak: () => void
  onAgentMessage?: (msg: { role: 'user' | 'assistant'; content: string }) => void
  onAgentRefresh?: () => Promise<void> | void
  className?: string
}

export function VoiceLiveStage({
  mode,
  onModeChange,
  agentEnabled,
  agentId,
  language,
  campaignName,
  commandStatus,
  interim,
  liveMode,
  autoSpeak,
  executing,
  onOrbClick,
  onToggleLive,
  onToggleAutoSpeak,
  onAgentMessage,
  onAgentRefresh,
  className,
}: VoiceLiveStageProps) {
  const commandFlow = statusToFlow(commandStatus)
  const agentFlow = useFlowState('idle')
  const displayFlow = mode === 'agent' ? agentFlow.value : commandFlow
  const orbClickRef = useRef<(() => void) | null>(null)

  const statusLabel =
    mode === 'agent'
      ? agentFlow.value === 'executing'
        ? 'Working'
        : agentFlow.value === 'connecting'
          ? 'Connecting…'
          : agentFlow.value === 'speaking'
            ? 'Speaking'
            : agentFlow.value === 'listening'
              ? 'Listening'
              : 'Tap to talk'
      : VOICE_STATUS_COPY[commandStatus]

  const glassText =
    mode === 'commands' && interim
      ? interim
      : statusLabel

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-sky-400/10',
        'bg-[#05070a] shadow-[0_0_90px_-18px_rgba(59,130,246,0.45)]',
        'flex min-h-[min(72vh,640px)] flex-col',
        className,
      )}
    >
      <VoiceAuraBackdrop state={displayFlow} />

      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <p className="min-w-0 truncate font-display text-lg text-white/95 sm:text-xl">{campaignName}</p>

        <div className="flex shrink-0 gap-1 rounded-full border border-white/10 bg-black/30 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onModeChange('agent')}
            disabled={!agentEnabled}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              mode === 'agent'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-white/50 hover:text-white/80 disabled:opacity-30',
            )}
          >
            <Sparkles className="size-3.5" />
            Agent
          </button>
          <button
            type="button"
            onClick={() => onModeChange('commands')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              mode === 'commands'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-white/50 hover:text-white/80',
            )}
          >
            <Mic className="size-3.5" />
            Mic
          </button>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-4 py-4">
        <div className="max-w-xl text-center">
          <h2 className="font-display text-2xl tracking-tight text-white sm:text-3xl">
            Talk to {campaignName}
          </h2>
          <p className="mt-2 text-sm text-white/45">Speak naturally — agent or mic mode</p>
        </div>

        {mode === 'agent' ? (
          <>
            <ElevenLabsAgentSession
              agentId={agentId}
              language={language}
              onRefresh={onAgentRefresh}
              onMessage={onAgentMessage}
              onFlowStateChange={agentFlow.set}
              onOrbReady={(click) => {
                orbClickRef.current = click
              }}
              compact
              showEndButton={false}
              orbSize="xl"
            />
            <motion.button
              type="button"
              onClick={() => orbClickRef.current?.()}
              disabled={displayFlow === 'connecting' || displayFlow === 'executing'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-white',
                displayFlow === 'idle'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 shadow-[0_0_48px_-6px_rgba(59,130,246,0.75)]'
                  : 'border border-white/15 bg-white/[0.08]',
              )}
            >
              <AudioWaveform className="size-4" />
              {displayFlow === 'idle' ? `Speak with ${campaignName}` : 'End conversation'}
            </motion.button>
          </>
        ) : (
          <>
            <VoiceParticleSphere
              state={commandFlow}
              size="xl"
              onClick={executing ? undefined : onOrbClick}
              label={commandStatus === 'listening' ? 'Stop listening' : 'Start speaking'}
            />
            <motion.button
              type="button"
              onClick={executing ? undefined : onOrbClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-white',
                commandStatus === 'idle'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 shadow-[0_0_48px_-6px_rgba(59,130,246,0.75)]'
                  : 'border border-white/15 bg-white/[0.08]',
              )}
            >
              <AudioWaveform className="size-4" />
              {commandStatus === 'listening' ? 'Stop listening' : `Speak with ${campaignName}`}
            </motion.button>
          </>
        )}

        <VoiceGlassSession
          flowState={displayFlow}
          transcript={glassText}
          statusLabel={statusLabel}
        />

        {mode === 'commands' && liveMode && commandStatus === 'idle' && (
          <p className="text-xs text-sky-300/70">Live loop on</p>
        )}
      </div>

      {mode === 'commands' && (
        <div className="relative z-10 flex flex-wrap justify-center gap-2 px-4 pb-5 sm:gap-3 sm:pb-6">
          <Button
            type="button"
            variant={liveMode ? 'default' : 'outline'}
            onClick={onToggleLive}
            disabled={executing}
            className={cn(
              'h-11 rounded-full px-5 text-sm border-white/15 bg-white/5 text-white hover:bg-white/10',
              liveMode && 'border-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
            )}
          >
            <Radio data-icon="inline-start" className="size-4" />
            Live loop
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onToggleAutoSpeak}
            className="h-11 rounded-full px-5 text-sm border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            {autoSpeak ? (
              <Volume2 data-icon="inline-start" className="size-4 text-cyan-400" />
            ) : (
              <VolumeX data-icon="inline-start" className="size-4" />
            )}
            Voice {autoSpeak ? 'on' : 'off'}
          </Button>
        </div>
      )}
    </section>
  )
}
