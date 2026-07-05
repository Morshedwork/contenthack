import { apiSuccess } from '@/lib/api-utils'
import {
  configuredEnvVarNames,
  defaultImagePromptModel,
  defaultImageRenderModel,
  defaultVideoModel,
  getAppProviders,
} from '@/lib/env/providers'
import { mediaProvidersAvailable } from '@/lib/ai/media-generate'
import { OPENAI_IMAGE_MODEL } from '@/lib/ai/openai-image'
import { KIMI_MODEL } from '@/lib/ai/kimi'

export async function GET() {
  const providers = getAppProviders()
  const media = mediaProvidersAvailable()

  return apiSuccess({
    providers,
    media,
    defaults: {
      textModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      qualityModel: process.env.OPENAI_MODEL_QUALITY || 'gpt-4o',
      imagePromptModel: defaultImagePromptModel(),
      imageRenderModel: defaultImageRenderModel(),
      openaiImageModel: OPENAI_IMAGE_MODEL,
      kimiModel: KIMI_MODEL,
      videoModel: defaultVideoModel(),
    },
    configured: configuredEnvVarNames(),
    stack: {
      text: providers.openai ? 'openai' : null,
      data: providers.crustdata ? 'crustdata' : null,
      imagePrompt: media.kimi ? 'kimi' : media.openai ? 'openai' : null,
      imageRender: media.openai ? 'openai' : 'pollinations',
      video: media.pixverse ? 'pixverse' : null,
      persistence: providers.supabasePersistence ? 'supabase' : providers.demoMode ? 'demo' : 'memory',
    },
  })
}
