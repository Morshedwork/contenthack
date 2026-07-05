import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { resolveAgentWorkspaceOptions } from '@/lib/workspace/api-context'
import { getWorkspace } from '@/lib/workspace/store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const ws = await getWorkspace(undefined, resolveAgentWorkspaceOptions(request))
    const task = taskId ? ws.tasks.find((t) => t.id === taskId) : undefined
    return apiSuccess({
      agents: ws.agents,
      task: task ?? ws.tasks[0],
      tasks: ws.tasks,
    })
  } catch (err) {
    return apiFromError(err, 'Failed to load task status')
  }
}
