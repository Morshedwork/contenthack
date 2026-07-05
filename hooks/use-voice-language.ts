'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  browserSpeechRecognitionLang,
  isVoiceLanguageCode,
  resolveEffectiveLanguageCode,
  resolveEffectiveVoiceLanguage,
  resolveVoiceLanguage,
  VOICE_LANGUAGE_STORAGE_KEY,
  type ResolvedVoiceLanguageCode,
  type VoiceLanguage,
  type VoiceLanguageCode,
} from '@/lib/voice/languages'

export function useVoiceLanguage() {
  const [languageCode, setLanguageCodeState] = useState<VoiceLanguageCode>('auto')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOICE_LANGUAGE_STORAGE_KEY)
      if (stored && isVoiceLanguageCode(stored)) {
        setLanguageCodeState(stored)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const language: VoiceLanguage = useMemo(() => {
    if (languageCode === 'auto') {
      const nav = browserSpeechRecognitionLang()
      if (nav.startsWith('ja')) return resolveVoiceLanguage('ja')
      if (nav.startsWith('bn')) return resolveVoiceLanguage('bn')
      return resolveVoiceLanguage('en')
    }
    return resolveVoiceLanguage(languageCode)
  }, [languageCode])

  const setLanguage = useCallback((code: VoiceLanguageCode) => {
    setLanguageCodeState(code)
    try {
      localStorage.setItem(VOICE_LANGUAGE_STORAGE_KEY, code)
    } catch {
      // ignore storage errors
    }
  }, [])

  const resolveForText = useCallback(
    (text: string): ResolvedVoiceLanguageCode => resolveEffectiveLanguageCode(languageCode, text),
    [languageCode],
  )

  const resolveLanguageForText = useCallback(
    (text: string): VoiceLanguage => resolveEffectiveVoiceLanguage(languageCode, text),
    [languageCode],
  )

  return {
    language,
    languageCode,
    setLanguage,
    resolveForText,
    resolveLanguageForText,
    isAuto: languageCode === 'auto',
  }
}
