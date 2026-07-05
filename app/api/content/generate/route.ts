import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withAI } from '@/lib/ai/layer'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { generateContentDrafts } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import type { Platform } from '@/types'

const VALID_PLATFORMS: Platform[] = [
  'linkedin',
  'instagram',
  'facebook',
  'x',
  'tiktok',
  'youtube',
  'email',
  'carousel',
]

function resolvePlatforms(bodyPlatforms: unknown, campaignPlatforms: Platform[]): Platform[] {
  if (Array.isArray(bodyPlatforms) && bodyPlatforms.length > 0) {
    const selected = bodyPlatforms.filter(
      (platform): platform is Platform =>
        typeof platform === 'string' && VALID_PLATFORMS.includes(platform as Platform),
    )
    if (selected.length > 0) return selected
  }
  return campaignPlatforms.length > 0 ? campaignPlatforms : ['linkedin', 'instagram', 'facebook', 'x']
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const platforms = resolvePlatforms(body.platforms, ws.campaign.platforms)
    const modelConfig = resolveTaskModel(MODEL_TASK.CONTENT_GENERATION, ws.modelRouting)

    const { result: drafts, live } = await withAI(() =>
      generateContentDrafts({
        platform: body.platform,
        platforms,
        topic: body.topic,
        campaignId: body.campaignId || ws.campaign.id,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
        research: ws.research,
        signals: mergeCrustdataSignals({ topic: body.topic }, ws.brandProfile, ws.research, ws.campaign),
        modelConfig,
      }),
    )

    await patchWorkspace({ contentDrafts: drafts }, ctx)
    return apiSuccess({ drafts, live })
  } catch (err) {
    return apiFromError(err, 'Content generation failed')
  }
}
