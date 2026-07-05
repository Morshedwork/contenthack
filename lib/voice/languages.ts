export const VOICE_LANGUAGE_STORAGE_KEY = 'contentops-voice-language'

export type VoiceLanguageCode = 'auto' | 'en' | 'bn' | 'ja'
export type ResolvedVoiceLanguageCode = Exclude<VoiceLanguageCode, 'auto'>

export interface VoiceLanguage {
  code: VoiceLanguageCode
  label: string
  nativeLabel: string
  /** Web Speech API BCP-47 tag */
  speechRecognitionLang: string
  /** OpenAI Whisper ISO-639-1 code */
  whisperLang: string
  /** ElevenLabs conversational agent language code */
  elevenLabsLang: string
  /** Browser SpeechSynthesisUtterance lang */
  utteranceLang: string
  agentFirstMessage: string
  respondInstruction: string
}

export const VOICE_LANGUAGES: VoiceLanguage[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    speechRecognitionLang: 'en-US',
    whisperLang: 'en',
    elevenLabsLang: 'en',
    utteranceLang: 'en-US',
    agentFirstMessage:
      "Hey — I'm your ContentOps Voice Manager. I can run research, create posts, find leads, or brief you on the campaign. What should we tackle?",
    respondInstruction: 'Respond in English. Use natural spoken English.',
  },
  {
    code: 'bn',
    label: 'Bangla',
    nativeLabel: 'বাংলা',
    speechRecognitionLang: 'bn-BD',
    whisperLang: 'bn',
    elevenLabsLang: 'bn',
    utteranceLang: 'bn-BD',
    agentFirstMessage:
      'হ্যালো — আমি আপনার ContentOps Voice Manager। আমি রিসার্চ, পোস্ট তৈরি, লিড খোঁজা বা ক্যাম্পেইনের আপডেট দিতে পারি। আজ কী করব?',
    respondInstruction: 'Respond in Bengali (Bangla). Use natural spoken Bengali.',
  },
  {
    code: 'ja',
    label: 'Japanese',
    nativeLabel: '日本語',
    speechRecognitionLang: 'ja-JP',
    whisperLang: 'ja',
    elevenLabsLang: 'ja',
    utteranceLang: 'ja-JP',
    agentFirstMessage:
      'こんにちは — ContentOps Voice Managerです。リサーチ、投稿作成、リード発掘、キャンペーンの状況確認ができます。何から始めましょうか？',
    respondInstruction: 'Respond in Japanese. Use natural polite spoken Japanese.',
  },
]

const LANGUAGE_BY_CODE = new Map(VOICE_LANGUAGES.map((lang) => [lang.code, lang]))

export function isVoiceLanguageCode(value: unknown): value is VoiceLanguageCode {
  return value === 'auto' || value === 'en' || value === 'bn' || value === 'ja'
}

export function isResolvedVoiceLanguageCode(value: unknown): value is ResolvedVoiceLanguageCode {
  return value === 'en' || value === 'bn' || value === 'ja'
}

const WHISPER_TO_VOICE: Record<string, ResolvedVoiceLanguageCode> = {
  en: 'en',
  bn: 'bn',
  ja: 'ja',
}

/** Map Whisper ISO-639-1 codes to supported voice languages. */
export function whisperLangToVoiceCode(lang?: string | null): ResolvedVoiceLanguageCode | null {
  if (!lang) return null
  return WHISPER_TO_VOICE[lang.toLowerCase()] ?? null
}

/** Detect spoken language from transcript text using script heuristics. */
export function detectVoiceLanguageFromText(text: string): ResolvedVoiceLanguageCode {
  const trimmed = text.trim()
  if (!trimmed) return 'en'

  const jaCount = (trimmed.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) ?? []).length
  const bnCount = (trimmed.match(/[\u0980-\u09FF]/g) ?? []).length
  const latinCount = (trimmed.match(/[a-zA-Z]/g) ?? []).length

  if (jaCount > 0 && jaCount >= bnCount && jaCount >= latinCount * 0.25) return 'ja'
  if (bnCount > 0 && bnCount > jaCount && bnCount >= latinCount * 0.25) return 'bn'
  return 'en'
}

/** Resolve auto mode (or missing code) using transcript text when available. */
export function resolveEffectiveLanguageCode(
  code?: string | null,
  text?: string,
): ResolvedVoiceLanguageCode {
  if (code === 'auto' || !code) {
    return text?.trim() ? detectVoiceLanguageFromText(text) : 'en'
  }
  if (isResolvedVoiceLanguageCode(code)) return code
  return 'en'
}

export function resolveVoiceLanguage(code?: string | null): VoiceLanguage {
  if (code && isResolvedVoiceLanguageCode(code)) {
    return LANGUAGE_BY_CODE.get(code) ?? VOICE_LANGUAGES[0]
  }
  return VOICE_LANGUAGES[0]
}

export function resolveEffectiveVoiceLanguage(code?: string | null, text?: string): VoiceLanguage {
  return resolveVoiceLanguage(resolveEffectiveLanguageCode(code, text))
}

/** Browser locale hint for Web Speech API when language mode is auto. */
export function browserSpeechRecognitionLang(): string {
  if (typeof navigator === 'undefined') return 'en-US'
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('ja')) return 'ja-JP'
  if (nav.startsWith('bn')) return 'bn-BD'
  return 'en-US'
}

export function voiceLanguageInstruction(code?: string | null, text?: string): string {
  return resolveEffectiveVoiceLanguage(code, text).respondInstruction
}

/** ElevenLabs TTS / convai model for a voice language. */
export function ttsModelForLanguage(code?: string | null, text?: string): string {
  const lang = resolveEffectiveVoiceLanguage(code, text)
  if (lang.code === 'en') {
    return process.env.ELEVENLABS_MODEL?.trim() || 'eleven_turbo_v2_5'
  }
  if (lang.code === 'bn') {
    return process.env.ELEVENLABS_BENGALI_MODEL?.trim() || 'eleven_v3_conversational'
  }
  return process.env.ELEVENLABS_MULTILINGUAL_MODEL?.trim() || 'eleven_multilingual_v2'
}
