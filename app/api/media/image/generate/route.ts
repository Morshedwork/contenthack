import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { generateMarketingImage } from '@/lib/ai/media-generate'
import { withKimi } from '@/lib/ai/kimi'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ws = await getWorkspace()
    const prompt = String(body.prompt || '').trim()
    if (!prompt) return apiFromError(new Error('Prompt is required'), 'Prompt is required')

    const { result: image, live } = await withKimi(() =>
      generateMarketingImage({
        prompt,
        brandProfile: ws.brandProfile,
        brandThemeId: body.brandThemeId,
        customPromptDetails: body.customPromptDetails,
      }),
    )

    const images = [image, ...(ws.generatedImages ?? [])].slice(0, 20)
    await patchWorkspace({ generatedImages: images })

    return apiSuccess({ image, images, live, provider: 'kimi-k2.5' })
  } catch (err) {
    return apiFromError(err, 'Image generation failed')
  }
}
