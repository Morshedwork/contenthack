import 'server-only'

import { ttsModelForLanguage } from '@/lib/voice/languages'

/**
 * ElevenLabs voice layer — gives the G-Brain Voice Manager its voice.
 *
 * - ELEVENLABS_API_KEY   → enables real neural TTS
 * - ELEVENLABS_VOICE_ID  → optional voice override (defaults to "Rachel")
 * - ELEVENLABS_MODEL     → optional model override (defaults to eleven_turbo_v2_5)
 * - ELEVENLABS_MULTILINGUAL_MODEL → optional model for Japanese (eleven_multilingual_v2)
 * - ELEVENLABS_BENGALI_MODEL → optional model for Bangla (eleven_v3_conversational)
 */
const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'

/** "Rachel" — ElevenLabs' default professional narrator voice. */
export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
export const DEFAULT_TTS_MODEL = 'eleven_turbo_v2_5'

function getApiKey(): string | undefined {
  return process.env.ELEVENLABS_API_KEY?.trim()
}

export function hasElevenLabs(): boolean {
  return Boolean(getApiKey())
}

export function defaultVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID
}

export function elevenLabsModel(): string {
  return process.env.ELEVENLABS_MODEL?.trim() || DEFAULT_TTS_MODEL
}

export interface SpeechOptions {
  voiceId?: string
  /** ISO language code — picks multilingual TTS model when not English. */
  language?: string
  /** 0–1: lower = more expressive, higher = more stable. */
  stability?: number
  /** 0–1: how closely output matches the original voice. */
  similarityBoost?: number
  /** 0–1: exaggeration of the voice's style. */
  style?: number
}

/** Convert text to speech via ElevenLabs. Returns MP3 audio bytes. */
export async function textToSpeech(text: string, options: SpeechOptions = {}): Promise<ArrayBuffer> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not configured')

  const trimmed = text.trim()
  if (!trimmed) throw new Error('No text provided for speech synthesis')

  const voiceId = options.voiceId?.trim() || defaultVoiceId()
  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: trimmed.slice(0, 4800),
      model_id: options.language ? ttsModelForLanguage(options.language) : elevenLabsModel(),
      voice_settings: {
        stability: options.stability ?? 0.45,
        similarity_boost: options.similarityBoost ?? 0.8,
        style: options.style ?? 0.35,
        use_speaker_boost: true,
      },
    }),
  })

  if (!res.ok) {
    let message = `ElevenLabs TTS failed (${res.status})`
    try {
      const data = (await res.json()) as { detail?: { message?: string } | string }
      const detail = typeof data.detail === 'string' ? data.detail : data.detail?.message
      if (detail) message = detail
    } catch {
      // keep default message
    }
    throw new Error(message)
  }

  return res.arrayBuffer()
}

export interface ElevenLabsVoice {
  voiceId: string
  name: string
  category?: string
  description?: string
}

/** List voices available on the connected ElevenLabs account. */
export async function listVoices(): Promise<ElevenLabsVoice[]> {
  const apiKey = getApiKey()
  if (!apiKey) return []

  try {
    const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
      headers: { 'xi-api-key': apiKey },
    })
    if (!res.ok) return []
    const data = (await res.json()) as {
      voices?: Array<{ voice_id?: string; name?: string; category?: string; description?: string }>
    }
    return (data.voices ?? [])
      .filter((v) => v.voice_id && v.name)
      .map((v) => ({
        voiceId: v.voice_id as string,
        name: v.name as string,
        category: v.category,
        description: v.description ?? undefined,
      }))
  } catch {
    return []
  }
}
