import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { checkBrandSafety } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveMcpWorkspaceContext } from '@/lib/mcp/access'
import { getWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveMcpWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const content: string = body.content || ''
    const modelConfig = resolveTaskModel(MODEL_TASK.BRAND_SAFETY, ws.modelRouting)
    const { result, live } = await withOpenAI(() =>
      checkBrandSafety({ content, brandProfile: ws.brandProfile, modelConfig }),
    )
    return apiSuccess({ ...result, live })
  } catch (err) {
    return apiFromError(err, 'Brand safety check failed')
  }
}
