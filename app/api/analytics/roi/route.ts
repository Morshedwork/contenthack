import { apiSuccess } from '@/lib/api-utils'
import { computeDynamicROI, getWorkspace } from '@/lib/workspace/store'

export async function GET() {
  const ws = await getWorkspace()
  return apiSuccess({ roi: computeDynamicROI(ws) })
}
