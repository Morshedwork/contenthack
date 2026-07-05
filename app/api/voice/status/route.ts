import { apiSuccess } from '@/lib/api-utils'
import { defaultVoiceId, elevenLabsModel, hasElevenLabs, listVoices } from '@/lib/ai/elevenlabs'
import { hasCrustdata } from '@/lib/ai/crustdata'
import { hasKimi, KIMI_MODEL } from '@/lib/ai/kimi'
import { hasOpenAI, OPENAI_MODEL, OPENAI_MODEL_QUALITY } from '@/lib/ai/openai'

export async function GET() {
  const voice = hasElevenLabs()
  const voices = voice ? await listVoices() : []

  const gStack: string[] = []
  if (hasOpenAI()) gStack.push(OPENAI_MODEL_QUALITY, OPENAI_MODEL)
  if (hasKimi()) gStack.push(KIMI_MODEL)

  return apiSuccess({
    voice: {
      enabled: voice,
      provider: voice ? 'elevenlabs' : null,
      model: voice ? elevenLabsModel() : null,
      defaultVoiceId: voice ? defaultVoiceId() : null,
      voices: voices.slice(0, 24),
    },
    transcription: hasOpenAI() ? 'whisper-1' : null,
    gBrain: hasOpenAI() || hasKimi(),
    gStack: [...new Set(gStack)],
    crustdata: hasCrustdata(),
  })
}
