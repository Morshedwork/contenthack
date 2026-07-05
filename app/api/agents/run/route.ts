import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { runAgentTask } from '@/lib/agents/engine'
import { resolveAgentWorkspaceOptions } from '@/lib/workspace/api-context'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const agentId = body?.agentId as string | undefined
  if (!agentId) return apiError('agentId is required', 400)

  try {
    const { agent, live } = await runAgentTask(agentId, {
      customPromptDetails: body.customPromptDetails,
      url: body.url,
      ...resolveAgentWorkspaceOptions(request),
    })
    return apiSuccess({ agent, live })
  } catch (err) {
    return apiFromError(err, 'Agent run failed')
  }
}
