import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { generateTopics } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveMcpWorkspaceContext } from '@/lib/mcp/access'
import { getWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveMcpWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const modelConfig = resolveTaskModel(MODEL_TASK.CONTENT_GENERATION, ws.modelRouting)
    const { result: topics, live } = await withOpenAI(() =>
      generateTopics({
        goal: body.goal,
        count: body.count,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
        modelConfig,
      }),
    )
    return apiSuccess({ topics, live })
  } catch (err) {
    return apiFromError(err, 'Topic generation failed')
  }
}
