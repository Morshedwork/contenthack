import { apiSuccess } from '@/lib/api-utils'
import { mediaProvidersAvailable } from '@/lib/ai/media-generate'
import { OPENAI_IMAGE_MODEL } from '@/lib/ai/openai-image'

export async function GET() {
  const providers = mediaProvidersAvailable()
  return apiSuccess({
    ...providers,
    defaultRenderModel: providers.openai ? OPENAI_IMAGE_MODEL : 'flux',
    defaultPromptModel: providers.openai ? 'gpt-4o' : 'kimi-k2.5',
  })
}
