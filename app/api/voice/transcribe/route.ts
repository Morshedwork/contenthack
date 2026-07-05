import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { getOpenAI, hasOpenAI } from '@/lib/ai/openai'
import {
  detectVoiceLanguageFromText,
  isVoiceLanguageCode,
  resolveVoiceLanguage,
  whisperLangToVoiceCode,
} from '@/lib/voice/languages'

export const maxDuration = 60

/** Whisper fallback for browsers without the Web Speech API. */
export async function POST(request: Request) {
  if (!hasOpenAI()) {
    return apiError('OPENAI_API_KEY is required for server-side transcription', 400)
  }

  try {
    const form = await request.formData()
    const audio = form.get('audio')
    const languageField = form.get('language')
    const useAutoDetect =
      typeof languageField !== 'string' ||
      !isVoiceLanguageCode(languageField) ||
      languageField === 'auto'
    const whisperLang =
      !useAutoDetect && typeof languageField === 'string'
        ? resolveVoiceLanguage(languageField).whisperLang
        : undefined

    if (!(audio instanceof File) || audio.size === 0) {
      return apiError('audio file is required', 400)
    }

    const openai = getOpenAI()
    const result = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audio,
      response_format: 'verbose_json',
      ...(whisperLang ? { language: whisperLang } : {}),
    })

    const transcript = result.text?.trim() ?? ''
    const whisperDetected = whisperLangToVoiceCode(result.language)
    const detectedLanguage = whisperDetected ?? detectVoiceLanguageFromText(transcript)

    return apiSuccess({ transcript, detectedLanguage })
  } catch (err) {
    return apiFromError(err, 'Transcription failed')
  }
}
