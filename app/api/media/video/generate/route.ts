import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { generateMarketingVideo } from '@/lib/ai/media-generate'
import { withPixverse } from '@/lib/ai/pixverse'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ws = await getWorkspace()
    const prompt = String(body.prompt || body.topic || '').trim()
    if (!prompt) return apiFromError(new Error('Prompt is required'), 'Prompt is required')

    const { result: video, live } = await withPixverse(() =>
      generateMarketingVideo({
        prompt,
        model: body.model || 'v4.5',
        duration: body.duration ?? 5,
        aspectRatio: body.aspectRatio || '16:9',
        brandProfile: ws.brandProfile,
        brandThemeId: body.brandThemeId,
        customPromptDetails: body.customPromptDetails,
        wait: body.wait !== false,
      }),
    )

    const videos = [video, ...(ws.generatedVideos ?? [])].slice(0, 10)
    await patchWorkspace({ generatedVideos: videos })

    return apiSuccess({ video, videos, live, provider: 'pixverse' })
  } catch (err) {
    return apiFromError(err, 'Video generation failed')
  }
}
