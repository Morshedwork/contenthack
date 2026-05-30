import { apiSuccess } from '@/lib/api-utils'
import { normalizeCustomPromptDetails } from '@/lib/ai/prompt-utils'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import type { Campaign } from '@/types'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { customPromptDetails, ...campaignFields } = body

  const ws = await getWorkspace()
  const campaign: Campaign = {
    ...ws.campaign,
    ...campaignFields,
    id: ws.campaign.id || `camp-${Date.now()}`,
    status: 'active',
  }

  const patch: Parameters<typeof patchWorkspace>[0] = { campaign }
  const normalizedPrompt = normalizeCustomPromptDetails(customPromptDetails)
  if (normalizedPrompt) {
    patch.customPromptDetails = normalizedPrompt
  }

  await patchWorkspace(patch)

  return apiSuccess({
    campaign,
    workflowTasks: 11,
    message: 'Campaign created and saved',
  })
}
