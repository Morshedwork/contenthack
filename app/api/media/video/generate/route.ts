import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { generateMarketingVideo, mediaProvidersAvailable } from '@/lib/ai/media-generate'
import {
  isValidOpenRouterVideoDuration,
  isValidOpenRouterVideoResolution,
  isValidPixverseVideoModel,
  isValidVideoAspectRatio,
  isValidVideoDuration,
  isValidVideoProvider,
  isValidVideoQuality,
  isValidOpenRouterVideoModel,
  normalizeOpenRouterVideoModel,
} from '@/lib/models/media-options'
import {
  defaultOpenRouterGenerateAudio,
  defaultOpenRouterVideoResolution,
  defaultVideoProvider,
  videoLayerSummary,
} from '@/lib/env/providers'
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const prompt = String(body.prompt || body.topic || '').trim()
    if (!prompt) return apiFromError(new Error('Prompt is required'), 'Prompt is required')

    const videoProvider =
      typeof body.videoProvider === 'string' && isValidVideoProvider(body.videoProvider)
        ? body.videoProvider
        : defaultVideoProvider()

    const aspectRatio =
      typeof body.aspectRatio === 'string' && isValidVideoAspectRatio(body.aspectRatio)
        ? body.aspectRatio
        : '16:9'

    const resolution =
      typeof body.resolution === 'string' && isValidOpenRouterVideoResolution(body.resolution)
        ? body.resolution
        : defaultOpenRouterVideoResolution()

    const generateAudio =
      body.generateAudio === true || (body.generateAudio !== false && defaultOpenRouterGenerateAudio())

    const openRouterModel =
      typeof body.model === 'string' && body.model.includes('/') && isValidOpenRouterVideoModel(body.model)
        ? normalizeOpenRouterVideoModel(body.model)
        : undefined
    const pixverseModel =
      typeof body.pixverseModel === 'string' && isValidPixverseVideoModel(body.pixverseModel)
        ? body.pixverseModel
        : typeof body.model === 'string' && isValidPixverseVideoModel(body.model)
          ? body.model
          : undefined

    const rawDuration = Number(body.duration ?? 5)
    const duration =
      videoProvider === 'pixverse' && pixverseModel && isValidVideoDuration(rawDuration, pixverseModel)
        ? rawDuration
        : isValidOpenRouterVideoDuration(rawDuration)
          ? rawDuration
          : 5

    const quality =
      typeof body.quality === 'string' && isValidVideoQuality(body.quality) ? body.quality : '720p'

    const media = mediaProvidersAvailable()
    if (!media.openrouter && !media.pixverse) {
      return apiFromError(
        new Error('No video provider configured. Add OPENROUTER_API_KEY and/or PIXVERSE_API_KEY.'),
        'Video provider not configured',
      )
    }

    const video = await generateMarketingVideo({
      prompt,
      videoProvider,
      model: openRouterModel,
      pixverseModel,
      duration,
      quality,
      resolution,
      aspectRatio,
      generateAudio,
      brandProfile: ws.brandProfile,
      brandThemeId: body.brandThemeId,
      customPromptDetails: body.customPromptDetails,
      wait: body.wait !== false,
      modelRouting: ws.modelRouting,
      research: ws.research,
      signals: mergeCrustdataSignals({ topic: prompt }, ws.brandProfile, ws.research, ws.campaign),
    })

    const videos = [video, ...(ws.generatedVideos ?? [])].slice(0, 10)
    await patchWorkspace({ generatedVideos: videos }, ctx)

    return apiSuccess({
      video,
      videos,
      live: media.openrouter || media.pixverse,
      provider: video.provider.toLowerCase(),
      layer: videoLayerSummary(),
    })
  } catch (err) {
    return apiFromError(err, 'Video generation failed')
  }
}
