import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function GET(request: Request) {
  try {
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    return apiSuccess({ models: ws.models, routing: ws.modelRouting })
  } catch (err) {
    return apiFromError(err, 'Failed to load models')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)

    if (body.defaultModelId) {
      const models = ws.models.map((m) => ({
        ...m,
        isDefault: m.id === body.defaultModelId,
      }))
      await patchWorkspace({ models }, ctx)
      const updated = await getWorkspace(ctx)
      return apiSuccess({ models: updated.models })
    }

    return apiSuccess({ models: ws.models, routing: ws.modelRouting })
  } catch (err) {
    return apiFromError(err, 'Failed to update models')
  }
}
