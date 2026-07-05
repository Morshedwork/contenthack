import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withAI } from '@/lib/ai/layer'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { generateOutreach } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const lead = ws.leads.find((l) => l.id === body.leadId)
    const modelConfig = resolveTaskModel(MODEL_TASK.OUTREACH_WRITING, ws.modelRouting)

    const { result: outreach, live } = await withAI(() =>
      generateOutreach({
        leadId: body.leadId,
        leadName: body.leadName || lead?.name,
        company: body.company || lead?.company,
        painPoint: body.painPoint || lead?.painPoint,
        matchReason: body.matchReason || lead?.matchReason,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
        research: ws.research,
        signals: mergeCrustdataSignals(
          {
            company: body.company || lead?.company,
            leadName: body.leadName || lead?.name,
          },
          ws.brandProfile,
          ws.research,
          ws.campaign,
        ),
        modelConfig,
      }),
    )

    await patchWorkspace(
      {
        outreach: [outreach, ...ws.outreach.filter((o) => o.leadId !== outreach.leadId)],
      },
      ctx,
    )

    return apiSuccess({ outreach, requiresApproval: ws.safetySettings.enableOutreachApproval, live })
  } catch (err) {
    return apiFromError(err, 'Outreach generation failed')
  }
}
