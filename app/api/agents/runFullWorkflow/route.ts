import { apiSuccess } from '@/lib/api-utils'
import { executeFullWorkflow, WORKFLOW_ORDER } from '@/lib/agents/engine'
import { resolveAgentWorkspaceOptions, resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { computeDynamicROI, getWorkspace, loadDemoPreset, patchWorkspace } from '@/lib/workspace/store'

async function executeFastDemoWorkflow(request: Request) {
  const ctx = await resolveApiWorkspaceContext(request)
  let ws = await getWorkspace(ctx)
  if (ws.contentDrafts.length === 0 || ws.videoScripts.length === 0 || ws.leads.length === 0) {
    await loadDemoPreset('investor-pitch', ctx)
    ws = await getWorkspace(ctx)
  }

  const workflowId = `wf-demo-${Date.now()}`
  const completed = new Set<string>(WORKFLOW_ORDER)
  const agents = ws.agents.map((agent) =>
    completed.has(agent.id)
      ? {
          ...agent,
          status: 'completed' as const,
          progress: 100,
          confidence: Math.max(agent.confidence, 88),
          currentTask: 'Demo flow complete',
          lastOutput: agent.lastOutput || `${agent.name} completed for demo flow`,
        }
      : agent,
  )
  const roi = computeDynamicROI({ ...ws, agents })
  await patchWorkspace(
    {
      agents,
      roi,
      lastWorkflow: {
        workflowId,
        live: false,
        completedAt: new Date().toISOString(),
        estimatedTimeSaved: `${roi.weeklyHoursSaved} hours`,
      },
    },
    ctx,
  )

  return {
    workflowId,
    steps: WORKFLOW_ORDER.map((agentId) => {
      const agent = agents.find((a) => a.id === agentId)
      return {
        agentId,
        agentName: agent?.name ?? agentId,
        status: agent?.status ?? 'completed',
        progress: agent?.progress ?? 100,
      }
    }),
    estimatedTimeSaved: `${roi.weeklyHoursSaved} hours`,
    agents,
    live: false,
    demo: true,
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  try {
    if (body.demoFast === true) {
      return apiSuccess(await executeFastDemoWorkflow(request))
    }
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
