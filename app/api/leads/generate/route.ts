import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { generateLeads } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ws = await getWorkspace()
    const modelConfig = resolveTaskModel(MODEL_TASK.LEAD_SCORING, ws.modelRouting)

    const { result: leads, live } = await withOpenAI(() =>
      generateLeads({
        count: body.count ?? 10,
        criteria: body.criteria || ws.research?.marketSummary || ws.campaign.targetAudience,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
        modelConfig,
      }),
    )

    await patchWorkspace({ leads })
    return apiSuccess({ leads, live })
  } catch (err) {
    return apiFromError(err, 'Lead generation failed')
  }
}
