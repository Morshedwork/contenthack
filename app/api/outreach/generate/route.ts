import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { generateOutreach } from '@/lib/ai/generate'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ws = await getWorkspace()
    const lead = ws.leads.find((l) => l.id === body.leadId)

    const { result: outreach, live } = await withOpenAI(() =>
      generateOutreach({
        leadId: body.leadId,
        leadName: body.leadName || lead?.name,
        company: body.company || lead?.company,
        painPoint: body.painPoint || lead?.painPoint,
        matchReason: body.matchReason || lead?.matchReason,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
      }),
    )

    await patchWorkspace({
      outreach: [outreach, ...ws.outreach.filter((o) => o.leadId !== outreach.leadId)],
    })

    return apiSuccess({ outreach, requiresApproval: ws.safetySettings.enableOutreachApproval, live })
  } catch (err) {
    return apiFromError(err, 'Outreach generation failed')
  }
}
