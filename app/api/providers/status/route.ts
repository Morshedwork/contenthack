import { apiSuccess } from '@/lib/api-utils'
import {
  configuredEnvVarNames,
  defaultImagePromptModel,
  defaultImageRenderModel,
  defaultOpenRouterVideoModel,
  defaultVideoModel,
  defaultVideoProvider,
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
      openRouterVideoModel: defaultOpenRouterVideoModel(),
      videoProvider: defaultVideoProvider(),
    },
    configured: configuredEnvVarNames(),
    stack: {
      text: providers.textAI
        ? [providers.openai && 'openai', providers.kimi && 'kimi'].filter(Boolean).join('+') || 'layered'
        : null,
      data: [providers.brightdata && 'brightdata', providers.crustdata && 'crustdata'].filter(Boolean).join('+') || null,
      imagePrompt: media.kimi ? 'kimi' : media.openai ? 'openai' : null,
      imageRender: media.openrouter ? 'openrouter' : media.openai ? 'openai' : 'pollinations',
      video: media.openrouter && media.pixverse ? 'layered' : media.openrouter ? 'openrouter' : media.pixverse ? 'pixverse' : null,
      persistence: providers.supabasePersistence ? 'supabase' : providers.demoMode ? 'demo' : 'memory',
    },
  })
}
