import { apiSuccess } from '@/lib/api-utils'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  const body = await request.json()
  const ws = await getWorkspace()

  if (body.routing) {
    await patchWorkspace({ modelRouting: body.routing })
  }

  const updated = await getWorkspace()
  return apiSuccess({ routing: updated.modelRouting, message: 'Model routing updated' })
}
