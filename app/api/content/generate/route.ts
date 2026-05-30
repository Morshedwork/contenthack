import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { generateContentDrafts } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
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
    const ws = await getWorkspace()
    const platforms = resolvePlatforms(body.platforms, ws.campaign.platforms)
    const modelConfig = resolveTaskModel(MODEL_TASK.CONTENT_GENERATION, ws.modelRouting)

    const { result: drafts, live } = await withOpenAI(() =>
      generateContentDrafts({
        platform: body.platform,
        platforms,
        topic: body.topic,
        campaignId: body.campaignId || ws.campaign.id,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
        modelConfig,
      }),
    )

    await patchWorkspace({ contentDrafts: drafts })
    return apiSuccess({ drafts, live })
  } catch (err) {
    return apiFromError(err, 'Content generation failed')
  }
}
