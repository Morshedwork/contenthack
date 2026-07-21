import { apiSuccess } from '@/lib/api-utils'
import {
  configuredEnvVarNames,
  defaultImagePromptModel,
  defaultImageRenderModel,
  defaultOpenRouterVideoModel,
  defaultVideoModel,
  defaultVideoProvider,
  getAppProviders,
  videoLayerSummary,
} from '@/lib/env/providers'
import { mediaProvidersAvailable } from '@/lib/ai/media-generate'
import { OPENAI_IMAGE_MODEL } from '@/lib/ai/openai-image'
import { KIMI_MODEL } from '@/lib/ai/kimi'
import { textLayerSummary } from '@/lib/models/routing'
import { buildOpenRouterImageChain } from '@/lib/models/media-options'

export async function GET() {
  const providers = getAppProviders()
  const media = mediaProvidersAvailable()
  const textLayer = textLayerSummary()
  const videoLayer = videoLayerSummary()

  return apiSuccess({
    providers,
    media,
    defaults: {
      textModel: process.env.OPENROUTER_TEXT_MODEL || process.env.OPENAI_MODEL || 'deepseek/deepseek-v3.2',
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
    layers: {
      text: textLayer,
      image: {
        openrouter: buildOpenRouterImageChain(),
        pollinationsFallback: 'flux',
        note: 'OpenRouter has no $0 image models — budget chain first, then free Pollinations Flux',
      },
      video: videoLayer,
    },
    stack: {
      text: providers.textAI
        ? [
            providers.openrouter && 'openrouter',
            providers.kimi && 'kimi',
            providers.openai && 'openai',
          ]
            .filter(Boolean)
            .join('+') || 'layered'
        : null,
      data: [providers.brightdata && 'brightdata', providers.crustdata && 'crustdata'].filter(Boolean).join('+') || null,
      imagePrompt: media.kimi ? 'kimi' : media.openai ? 'openai' : null,
      imageRender: media.openrouter ? 'openrouter→pollinations' : media.openai ? 'openai→pollinations' : 'pollinations',
      video: media.openrouter && media.pixverse ? 'openrouter→pixverse' : media.openrouter ? 'openrouter' : media.pixverse ? 'pixverse' : null,
      persistence: providers.supabasePersistence ? 'supabase' : providers.demoMode ? 'demo' : 'memory',
    },
  })
}
