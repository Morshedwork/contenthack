import { apiSuccess } from '@/lib/api-utils'
import { executeFullWorkflow } from '@/lib/agents/engine'
import { resolveAgentWorkspaceOptions } from '@/lib/workspace/api-context'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  try {
    const result = await executeFullWorkflow(body.customPromptDetails, resolveAgentWorkspaceOptions(request))
    return apiSuccess(result)
  } catch (err) {
    return apiSuccess({
      workflowId: `wf-error-${Date.now()}`,
      steps: [],
      estimatedTimeSaved: '0 hours',
      agents: [],
      live: false,
      error: err instanceof Error ? err.message : 'Workflow failed',
    })
  }
}
