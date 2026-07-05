import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { getOpenAI, hasOpenAI } from '@/lib/ai/openai'

export const maxDuration = 60

/** Whisper fallback for browsers without the Web Speech API. */
export async function POST(request: Request) {
  if (!hasOpenAI()) {
    return apiError('OPENAI_API_KEY is required for server-side transcription', 400)
  }

  try {
    const form = await request.formData()
    const audio = form.get('audio')
    if (!(audio instanceof File) || audio.size === 0) {
      return apiError('audio file is required', 400)
    }

    const openai = getOpenAI()
    const result = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audio,
    })

    return apiSuccess({ transcript: result.text?.trim() ?? '' })
  } catch (err) {
    return apiFromError(err, 'Transcription failed')
  }
}
