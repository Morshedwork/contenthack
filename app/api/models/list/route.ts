import { apiSuccess } from '@/lib/api-utils'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function GET() {
  const ws = await getWorkspace()
  return apiSuccess({ models: ws.models, routing: ws.modelRouting })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const ws = await getWorkspace()

  if (body.defaultModelId) {
    const models = ws.models.map((m) => ({
      ...m,
      isDefault: m.id === body.defaultModelId,
    }))
    await patchWorkspace({ models })
    const updated = await getWorkspace()
    return apiSuccess({ models: updated.models })
  }

  return apiSuccess({ models: ws.models, routing: ws.modelRouting })
}
