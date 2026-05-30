import { apiError, apiSuccess } from '@/lib/api-utils'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import type { Campaign } from '@/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Campaign>
    if (!body.companyName?.trim()) {
      return apiError('Company name is required', 400)
    }

    const ws = await getWorkspace()
    const updated: Campaign = {
      ...ws.campaign,
      ...body,
      id: body.id || ws.campaign.id,
    }

    await patchWorkspace({ campaign: updated })

    return apiSuccess({ campaign: updated, message: 'Campaign updated' })
  } catch {
    return apiError('Invalid campaign payload', 400)
  }
}

export async function GET() {
  const ws = await getWorkspace()
  return apiSuccess({ campaign: ws.campaign })
}
