import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withAI } from '@/lib/ai/layer'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { generateLeads } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const modelConfig = resolveTaskModel(MODEL_TASK.LEAD_SCORING, ws.modelRouting)

    const { result: leads, live } = await withAI(() =>
      generateLeads({
        count: body.count ?? 10,
        criteria: body.criteria || ws.research?.marketSummary || ws.campaign.targetAudience,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
        research: ws.research,
        signals: mergeCrustdataSignals({ criteria: body.criteria }, ws.brandProfile, ws.research, ws.campaign),
        modelConfig,
      }),
    )

    await patchWorkspace({ leads }, ctx)
    return apiSuccess({ leads, live })
  } catch (err) {
    return apiFromError(err, 'Lead generation failed')
  }
}
