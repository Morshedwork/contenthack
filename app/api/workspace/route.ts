import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import {
  buildApprovalItems,
  buildOverviewKPIs,
  getWorkspace,
  patchWorkspace,
  resetWorkspace,
  loadDemoPreset,
  computeDynamicROI,
  updateContentDraftStatus,
} from '@/lib/workspace/store'
import type { DemoPresetId } from '@/lib/demo/presets'
import type { BrandProfile, Campaign, ContentStatus, SafetySettings } from '@/types'

const PRESET_IDS = new Set<DemoPresetId>(['default', 'investor-pitch', 'empty'])

export async function GET() {
  try {
    const ws = await getWorkspace()
    return apiSuccess({
      ...ws,
      roi: computeDynamicROI(ws),
      approvalItems: buildApprovalItems(ws),
      overviewKPIs: buildOverviewKPIs(ws),
    })
  } catch (err) {
    return apiFromError(err, 'Failed to load workspace')
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (body.action === 'reset') {
      await resetWorkspace()
      const ws = await getWorkspace()
      return apiSuccess({
        ...ws,
        roi: computeDynamicROI(ws),
        approvalItems: buildApprovalItems(ws),
        overviewKPIs: buildOverviewKPIs(ws),
      })
    }

    if (body.action === 'loadPreset' && typeof body.preset === 'string' && PRESET_IDS.has(body.preset as DemoPresetId)) {
      await loadDemoPreset(body.preset as DemoPresetId)
      const ws = await getWorkspace()
      return apiSuccess({
        ...ws,
        roi: computeDynamicROI(ws),
        approvalItems: buildApprovalItems(ws),
        overviewKPIs: buildOverviewKPIs(ws),
      })
    }

    if (body.action === 'updateApproval' && body.draftId && body.status) {
      await updateContentDraftStatus(body.draftId as string, body.status as ContentStatus)
      const ws = await getWorkspace()
      return apiSuccess({
        ...ws,
        approvalItems: buildApprovalItems(ws),
      })
    }

    if (body.brandProfile) {
      await patchWorkspace({ brandProfile: body.brandProfile as BrandProfile })
    }

    if (body.safetySettings) {
      await patchWorkspace({ safetySettings: body.safetySettings as SafetySettings })
    }

    if (body.integrations) {
      await patchWorkspace({ integrations: body.integrations })
    }

    if (body.modelRouting) {
      await patchWorkspace({ modelRouting: body.modelRouting })
    }

    if (body.models) {
      await patchWorkspace({ models: body.models })
    }

    if (body.campaign) {
      const ws = await getWorkspace()
      await patchWorkspace({ campaign: { ...ws.campaign, ...(body.campaign as Partial<Campaign>) } })
    }

    if (body.contentDrafts) {
      await patchWorkspace({ contentDrafts: body.contentDrafts })
    }

    if (body.calendarPosts) {
      await patchWorkspace({ calendarPosts: body.calendarPosts })
    }

    const ws = await getWorkspace()
    return apiSuccess({
      ...ws,
      roi: computeDynamicROI(ws),
      approvalItems: buildApprovalItems(ws),
      overviewKPIs: buildOverviewKPIs(ws),
    })
  } catch (err) {
    return apiFromError(err, 'Failed to update workspace')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (body.action !== 'reset') return apiError('Unknown action', 400)
    await resetWorkspace()
    const ws = await getWorkspace()
    return apiSuccess(ws)
  } catch (err) {
    return apiFromError(err, 'Failed to reset workspace')
  }
}
