import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { generateResearch } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ws = await getWorkspace()
    const modelConfig = resolveTaskModel(MODEL_TASK.MARKET_RESEARCH, ws.modelRouting)

    const { result: research, live } = await withOpenAI(() =>
      generateResearch({
        industry: body.industry || ws.campaign.industry,
        targetCustomer: body.targetCustomer || ws.campaign.targetAudience,
        region: body.region || ws.campaign.region,
        offer: body.offer || ws.campaign.mainOffer,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
        modelConfig,
      }),
    )

    await patchWorkspace({ research })
    return apiSuccess({ research, live })
  } catch (err) {
    return apiFromError(err, 'Research generation failed')
  }
}
