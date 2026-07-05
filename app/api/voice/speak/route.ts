import { apiError, apiFromError } from '@/lib/api-utils'
import { hasElevenLabs, textToSpeech } from '@/lib/ai/elevenlabs'
import { detectVoiceLanguageFromText, isResolvedVoiceLanguageCode } from '@/lib/voice/languages'

export const maxDuration = 60

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const voiceId = typeof body?.voiceId === 'string' ? body.voiceId.trim() : undefined
  const languageField = typeof body?.language === 'string' ? body.language : undefined
  const language = isResolvedVoiceLanguageCode(languageField)
    ? languageField
    : detectVoiceLanguageFromText(text)

  if (!text) return apiError('text is required', 400)
  if (!hasElevenLabs()) {
    return apiError('ELEVENLABS_API_KEY is not configured — add it to .env.local for neural voice', 400)
  }

  try {
    const audio = await textToSpeech(text, { voiceId, language })
    return new Response(audio, {
      headers: {
        'content-type': 'audio/mpeg',
        'cache-control': 'no-store',
      },
    })
  } catch (err) {
    return apiFromError(err, 'Speech synthesis failed')
  }
}
