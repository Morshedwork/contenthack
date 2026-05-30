import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { generateVideoScripts } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveMcpWorkspaceContext } from '@/lib/mcp/access'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveMcpWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const modelConfig = resolveTaskModel(MODEL_TASK.VIDEO_SCRIPTS, ws.modelRouting)

    const { result: scripts, live } = await withOpenAI(() =>
      generateVideoScripts({
        topic: body.topic,
        count: body.count ?? 3,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
        modelConfig,
      }),
    )

    await patchWorkspace({ videoScripts: scripts }, ctx)
    return apiSuccess({ scripts, live })
  } catch (err) {
    return apiFromError(err, 'Video script generation failed')
  }
}
