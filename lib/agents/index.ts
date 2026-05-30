import type { AgentDefinition, AgentTask } from '@/types'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import { buildApprovalItems, buildOverviewKPIs, computeDynamicROI } from '@/lib/workspace/store'
export async function getAgents(): Promise<AgentDefinition[]> {
  const ws = await getWorkspace()
  return ws.agents
}

export async function getAgentById(id: string): Promise<AgentDefinition | undefined> {
  const ws = await getWorkspace()
  return ws.agents.find((a) => a.id === id)
}

export async function getAgentTasks(): Promise<AgentTask[]> {
  const ws = await getWorkspace()
  return ws.tasks
}

export { runAgentTask, executeFullWorkflow } from '@/lib/agents/engine'

export async function applyWorkflowToAgents(
  steps: { agentId: string; status: string; progress: number }[],
): Promise<AgentDefinition[]> {
  const ws = await getWorkspace()
  const updated = ws.agents.map((agent) => {
    const step = steps.find((s) => s.agentId === agent.id)
    if (!step) return agent
    const status = (['idle', 'running', 'completed', 'failed', 'waiting_for_approval'].includes(step.status)
      ? step.status
      : 'running') as AgentDefinition['status']
    return {
      ...agent,
      status,
      progress: step.progress,
      confidence: step.progress > 0 ? Math.min(70 + step.progress / 3, 99) : agent.confidence,
    }
  })
  await patchWorkspace({ agents: updated })
  return updated
}

export const WORKFLOW_NODES = [
  { id: 'goal', label: 'Campaign Goal', type: 'input' },
  { id: 'research', label: 'Research Agent', type: 'agent' },
  { id: 'strategy', label: 'Strategy Agent', type: 'agent' },
  { id: 'content', label: 'Content Agent', type: 'agent' },
  { id: 'video', label: 'Video Agent', type: 'agent' },
  { id: 'safety', label: 'Safety Agent', type: 'agent' },
  { id: 'approval', label: 'Approval', type: 'gate' },
  { id: 'scheduler', label: 'Scheduler Agent', type: 'agent' },
  { id: 'publisher', label: 'Publisher Agent', type: 'agent' },
  { id: 'leadfinder', label: 'Lead Finder Agent', type: 'agent' },
  { id: 'outreach', label: 'Outreach Agent', type: 'agent' },
  { id: 'analytics', label: 'Analytics Agent', type: 'agent' },
]

export { buildApprovalItems, buildOverviewKPIs, computeDynamicROI }
export type { WorkspacePayload } from '@/lib/workspace/client'
