import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { hasElevenLabs } from '@/lib/ai/elevenlabs'
import { provisionContentOpsAgent } from '@/lib/ai/elevenlabs-agents'
import { isVoiceLanguageCode } from '@/lib/voice/languages'

export async function POST(request: Request) {
  if (!hasElevenLabs()) {
    return apiError('ELEVENLABS_API_KEY is not configured', 400)
  }

  const body = await request.json().catch(() => ({}))
  const language =
    typeof body?.language === 'string' && isVoiceLanguageCode(body.language) ? body.language : undefined

  try {
    const result = await provisionContentOpsAgent(language)
    return apiSuccess(result)
  } catch (err) {
    return apiFromError(err, 'Failed to provision ElevenLabs agent')
  }
}
