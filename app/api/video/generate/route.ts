import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withAI } from '@/lib/ai/layer'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import {
  generatePromotionReels,
  generateReelsFromContent,
  generateVideoScripts,
} from '@/lib/ai/generate'
import { isValidPromotionType, isValidVideoFormat } from '@/lib/models/video-options'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import type { VideoFormat, VideoPromotionType } from '@/types'

type GenerateMode = 'topic' | 'content' | 'promotion'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const modelConfig = resolveTaskModel(MODEL_TASK.VIDEO_SCRIPTS, ws.modelRouting)
    const mode = (body.mode as GenerateMode) || 'topic'
    const format: VideoFormat =
      typeof body.format === 'string' && isValidVideoFormat(body.format) ? body.format : 'reel'

    let scripts
    let live: boolean

    if (mode === 'content') {
      const contentIds: string[] = Array.isArray(body.contentDraftIds) ? body.contentDraftIds : []
      const drafts =
        contentIds.length > 0
          ? ws.contentDrafts.filter((d) => contentIds.includes(d.id))
          : ws.contentDrafts.slice(0, 5)

      if (!drafts.length) {
        return apiFromError(
          new Error('No content drafts found. Generate content in Content Studio first.'),
          'No content drafts available',
        )
      }

      const result = await withAI(() =>
        generateReelsFromContent({
          contentDrafts: drafts,
          format,
          customPromptDetails: body.customPromptDetails,
          brandProfile: ws.brandProfile,
          research: ws.research,
          signals: mergeCrustdataSignals({}, ws.brandProfile, ws.research, ws.campaign),
          modelConfig,
        }),
      )
      scripts = result.result
      live = result.live
    } else if (mode === 'promotion') {
      const promotionType: VideoPromotionType =
        typeof body.promotionType === 'string' && isValidPromotionType(body.promotionType)
          ? body.promotionType
          : 'lead_gen'

      const result = await withAI(() =>
        generatePromotionReels({
          promotionType,
          topic: body.topic,
          count: body.count ?? 3,
          format,
          customPromptDetails: body.customPromptDetails,
          brandProfile: ws.brandProfile,
          research: ws.research,
          signals: mergeCrustdataSignals({ topic: body.topic }, ws.brandProfile, ws.research, ws.campaign),
          modelConfig,
        }),
      )
      scripts = result.result
      live = result.live
    } else {
      const result = await withAI(() =>
        generateVideoScripts({
          topic: body.topic,
          count: body.count ?? 3,
          customPromptDetails: body.customPromptDetails,
          brandProfile: ws.brandProfile,
          research: ws.research,
          signals: mergeCrustdataSignals({ topic: body.topic }, ws.brandProfile, ws.research, ws.campaign),
          modelConfig,
        }),
      )
      scripts = result.result.map((s) => ({ ...s, format }))
      live = result.live
    }

    const merge = body.merge === true
    const videoScripts = merge ? [...scripts, ...(ws.videoScripts ?? [])] : scripts
    await patchWorkspace({ videoScripts }, ctx)

    return apiSuccess({ scripts: videoScripts, generated: scripts, live, mode })
  } catch (err) {
    return apiFromError(err, 'Video script generation failed')
  }
}
