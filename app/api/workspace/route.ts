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
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import type { DemoPresetId } from '@/lib/demo/presets'
import type { BrandProfile, Campaign, ContentStatus, SafetySettings } from '@/types'

const PRESET_IDS = new Set<DemoPresetId>(['default', 'investor-pitch', 'empty'])

export async function GET(request: Request) {
  try {
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
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
    const ctx = await resolveApiWorkspaceContext(request)

    if (body.action === 'reset') {
      await resetWorkspace(ctx)
      const ws = await getWorkspace(ctx)
      return apiSuccess({
        ...ws,
        roi: computeDynamicROI(ws),
        approvalItems: buildApprovalItems(ws),
        overviewKPIs: buildOverviewKPIs(ws),
      })
    }

    if (body.action === 'loadPreset' && typeof body.preset === 'string' && PRESET_IDS.has(body.preset as DemoPresetId)) {
      await loadDemoPreset(body.preset as DemoPresetId, ctx)
      const ws = await getWorkspace(ctx)
      return apiSuccess({
        ...ws,
        roi: computeDynamicROI(ws),
        approvalItems: buildApprovalItems(ws),
        overviewKPIs: buildOverviewKPIs(ws),
      })
    }

    if (body.action === 'updateApproval' && body.draftId && body.status) {
      await updateContentDraftStatus(body.draftId as string, body.status as ContentStatus, ctx)
      const ws = await getWorkspace(ctx)
      return apiSuccess({
        ...ws,
        approvalItems: buildApprovalItems(ws),
      })
    }

    if (body.brandProfile) {
      await patchWorkspace({ brandProfile: body.brandProfile as BrandProfile }, ctx)
    }

    if (body.safetySettings) {
      await patchWorkspace({ safetySettings: body.safetySettings as SafetySettings }, ctx)
    }

    if (body.integrations) {
      await patchWorkspace({ integrations: body.integrations }, ctx)
    }

    if (body.modelRouting) {
      await patchWorkspace({ modelRouting: body.modelRouting }, ctx)
    }

    if (body.models) {
      await patchWorkspace({ models: body.models }, ctx)
    }

    if (body.campaign) {
      const ws = await getWorkspace(ctx)
      await patchWorkspace({ campaign: { ...ws.campaign, ...(body.campaign as Partial<Campaign>) } }, ctx)
    }

    if (body.contentDrafts) {
      await patchWorkspace({ contentDrafts: body.contentDrafts }, ctx)
    }

    if (body.calendarPosts) {
      await patchWorkspace({ calendarPosts: body.calendarPosts }, ctx)
    }

    const ws = await getWorkspace(ctx)
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
    const ctx = await resolveApiWorkspaceContext(request)
    if (body.action !== 'reset') return apiError('Unknown action', 400)
    await resetWorkspace(ctx)
    const ws = await getWorkspace(ctx)
    return apiSuccess(ws)
  } catch (err) {
    return apiFromError(err, 'Failed to reset workspace')
  }
}
