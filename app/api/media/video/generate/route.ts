import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { generateMarketingVideo } from '@/lib/ai/media-generate'
import { withPixverse } from '@/lib/ai/pixverse'
import {
  isValidVideoAspectRatio,
  isValidVideoDuration,
  isValidVideoModel,
  isValidVideoQuality,
  normalizePixverseVideoParams,
} from '@/lib/models/media-options'
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const prompt = String(body.prompt || body.topic || '').trim()
    if (!prompt) return apiFromError(new Error('Prompt is required'), 'Prompt is required')

    const model = typeof body.model === 'string' && isValidVideoModel(body.model) ? body.model : 'v4.5'
    const rawDuration = Number(body.duration ?? 5)
    const rawQuality =
      typeof body.quality === 'string' && isValidVideoQuality(body.quality) ? body.quality : '540p'
    const durationFallback = isValidVideoDuration(rawDuration, model) ? rawDuration : 5
    const { duration, quality, warnings } = normalizePixverseVideoParams({
      model,
      duration: durationFallback,
      quality: rawQuality,
    })
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
        research: ws.research,
        signals: mergeCrustdataSignals({ topic: prompt }, ws.brandProfile, ws.research, ws.campaign),
      }),
    )

    const videos = [video, ...(ws.generatedVideos ?? [])].slice(0, 10)
    await patchWorkspace({ generatedVideos: videos }, ctx)

    return apiSuccess({
      video,
      videos,
      live,
      provider: 'pixverse',
      ...(warnings.length ? { warnings } : {}),
    })
  } catch (err) {
    return apiFromError(err, 'Video generation failed')
  }
}
