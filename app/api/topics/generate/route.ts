import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { generateTopics } from '@/lib/ai/generate'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { topicsFromTitles } from '@/lib/workspace/topics'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)
    const modelConfig = resolveTaskModel(MODEL_TASK.CONTENT_GENERATION, ws.modelRouting)
    const { result: topicTitles, live } = await withOpenAI(() =>
      generateTopics({
        goal: body.goal,
        count: body.count,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
        research: ws.research,
        signals: mergeCrustdataSignals({ goal: body.goal }, ws.brandProfile, ws.research, ws.campaign),
        modelConfig,
      }),
    )
    const topics = topicsFromTitles(topicTitles, body.goal)
    await patchWorkspace({ topics }, ctx)
    return apiSuccess({ topics, live })
  } catch (err) {
    return apiFromError(err, 'Topic generation failed')
  }
}
