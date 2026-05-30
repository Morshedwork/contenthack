import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { generateOutreach } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveMcpWorkspaceContext } from '@/lib/mcp/access'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveMcpWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const lead = ws.leads.find((l) => l.id === body.leadId)
    const modelConfig = resolveTaskModel(MODEL_TASK.OUTREACH_WRITING, ws.modelRouting)

    const { result: outreach, live } = await withOpenAI(() =>
      generateOutreach({
        leadId: body.leadId,
        leadName: body.leadName || lead?.name,
        company: body.company || lead?.company,
        painPoint: body.painPoint || lead?.painPoint,
        matchReason: body.matchReason || lead?.matchReason,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
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
