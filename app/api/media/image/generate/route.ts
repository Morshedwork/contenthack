import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { generateMarketingImage } from '@/lib/ai/media-generate'
import {
  getImageRenderProvider,
  isValidImageAspectRatio,
  isValidImagePromptModel,
  isValidImageRenderModel,
} from '@/lib/models/media-options'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ws = await getWorkspace()
    const prompt = String(body.prompt || '').trim()
    if (!prompt) return apiFromError(new Error('Prompt is required'), 'Prompt is required')

    const promptModel =
      typeof body.promptModel === 'string' && isValidImagePromptModel(body.promptModel)
        ? body.promptModel
        : undefined
    const renderModel =
      typeof body.renderModel === 'string' && isValidImageRenderModel(body.renderModel)
        ? body.renderModel
        : undefined
    const aspectRatio =
      typeof body.aspectRatio === 'string' && isValidImageAspectRatio(body.aspectRatio)
        ? body.aspectRatio
        : undefined
    const openaiQuality =
      body.openaiQuality === 'hd' || body.openaiQuality === 'standard' ? body.openaiQuality : undefined

    const image = await generateMarketingImage({
      prompt,
      brandProfile: ws.brandProfile,
      brandThemeId: body.brandThemeId,
      customPromptDetails: body.customPromptDetails,
      promptModel,
      renderModel,
      aspectRatio,
      openaiQuality,
      modelRouting: ws.modelRouting,
    })

    const images = [image, ...(ws.generatedImages ?? [])].slice(0, 20)
    await patchWorkspace({ generatedImages: images })

    const provider = getImageRenderProvider(renderModel || 'flux') || 'pollinations'
    return apiSuccess({ image, images, live: true, provider })
  } catch (err) {
    return apiFromError(err, 'Image generation failed')
  }
}
