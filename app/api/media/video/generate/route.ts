import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { generateMarketingVideo } from '@/lib/ai/media-generate'
import { withPixverse } from '@/lib/ai/pixverse'
import {
  isValidVideoAspectRatio,
  isValidVideoDuration,
  isValidVideoModel,
  isValidVideoQuality,
} from '@/lib/models/media-options'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ws = await getWorkspace()
    const prompt = String(body.prompt || body.topic || '').trim()
    if (!prompt) return apiFromError(new Error('Prompt is required'), 'Prompt is required')

    const rawDuration = Number(body.duration ?? 5)
    const duration = isValidVideoDuration(rawDuration) ? rawDuration : 5
    const model = typeof body.model === 'string' && isValidVideoModel(body.model) ? body.model : 'v4.5'
    const quality =
      typeof body.quality === 'string' && isValidVideoQuality(body.quality) ? body.quality : '540p'
    const aspectRatio =
      typeof body.aspectRatio === 'string' && isValidVideoAspectRatio(body.aspectRatio)
        ? body.aspectRatio
        : '16:9'

    const { result: video, live } = await withPixverse(() =>
      generateMarketingVideo({
        prompt,
        model,
        duration,
        quality,
        aspectRatio,
        brandProfile: ws.brandProfile,
        brandThemeId: body.brandThemeId,
        customPromptDetails: body.customPromptDetails,
        wait: body.wait !== false,
        modelRouting: ws.modelRouting,
      }),
    )

    const videos = [video, ...(ws.generatedVideos ?? [])].slice(0, 10)
    await patchWorkspace({ generatedVideos: videos })

    return apiSuccess({ video, videos, live, provider: 'pixverse' })
  } catch (err) {
    return apiFromError(err, 'Video generation failed')
  }
}
