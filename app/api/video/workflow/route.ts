import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { executeVideoWorkflow } from '@/lib/agents/video-workflow'
import { isValidPromotionType, isValidVideoFormat } from '@/lib/models/video-options'
import { resolveAgentWorkspaceOptions } from '@/lib/workspace/api-context'
import type { VideoWorkflowKind } from '@/lib/agents/video-pipeline'

const VALID_KINDS = new Set<VideoWorkflowKind>(['content_reels', 'promotion_reels', 'full_reel_campaign'])

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const kind = body.kind as VideoWorkflowKind
    if (!kind || !VALID_KINDS.has(kind)) {
      return apiFromError(new Error('Invalid workflow kind'), 'kind must be content_reels, promotion_reels, or full_reel_campaign')
    }

    const result = await executeVideoWorkflow(
      {
        kind,
        promotionType:
          typeof body.promotionType === 'string' && isValidPromotionType(body.promotionType)
            ? body.promotionType
            : undefined,
        contentDraftIds: Array.isArray(body.contentDraftIds) ? body.contentDraftIds : undefined,
        format:
          typeof body.format === 'string' && isValidVideoFormat(body.format) ? body.format : undefined,
        count: typeof body.count === 'number' ? body.count : undefined,
        topic: typeof body.topic === 'string' ? body.topic : undefined,
        customPromptDetails: typeof body.customPromptDetails === 'string' ? body.customPromptDetails : undefined,
        renderVideos: body.renderVideos === true,
        mergeScripts: body.mergeScripts !== false,
      },
      resolveAgentWorkspaceOptions(request),
    )

    return apiSuccess(result)
  } catch (err) {
    return apiFromError(err, 'Video agent workflow failed')
  }
}
