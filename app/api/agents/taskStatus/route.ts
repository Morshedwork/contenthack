import { apiSuccess } from '@/lib/api-utils'
import { getWorkspace } from '@/lib/workspace/store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  const ws = await getWorkspace(undefined, { allowAnonymous: true })
  const task = taskId ? ws.tasks.find((t) => t.id === taskId) : undefined
  return apiSuccess({
    agents: ws.agents,
    task: task ?? ws.tasks[0],
    tasks: ws.tasks,
  })
}
