import { apiSuccess } from '@/lib/api-utils'
import {
  getAppProviders,
  defaultImagePromptModel,
  defaultImageRenderModel,
  defaultOpenRouterVideoModel,
  defaultVideoModel,
  defaultVideoProvider,
  videoLayerSummary,
} from '@/lib/env/providers'
import { mediaProvidersAvailable } from '@/lib/ai/media-generate'
import { OPENAI_IMAGE_MODEL } from '@/lib/ai/openai-image'

export async function GET() {
  const stack = getAppProviders()
  const media = mediaProvidersAvailable()
  return apiSuccess({
    ...stack,
    ...media,
    defaultRenderModel: defaultImageRenderModel(),
    defaultPromptModel: defaultImagePromptModel(),
    defaultVideoModel: defaultVideoModel(),
    defaultOpenRouterVideoModel: defaultOpenRouterVideoModel(),
    defaultVideoProvider: defaultVideoProvider(),
    videoLayer: videoLayerSummary(),
    openaiImageModel: OPENAI_IMAGE_MODEL,
  })
}
