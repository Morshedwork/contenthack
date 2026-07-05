import type { ChatAgentPlan, ChatPlanStep } from '@/lib/agents/types'
import type { AgentId } from '@/lib/agents/planner'
import { AGENT_VIEW_LINKS } from '@/lib/agents/view-links'

const AGENT_TASK_LABELS: Record<string, string> = {
  research: 'Analyze market, competitors, and pain points',
  strategy: 'Build content pillars and topic map',
  brandtheme: 'Extract brand colors and visual identity',
  content: 'Draft platform-ready posts and captions',
  video: 'Adapt content into reel scripts or write promotion variants',
  safety: 'Run compliance and brand safety checks',
  scheduler: 'Optimize calendar and post timing',
  publisher: 'Publish to connected platforms',
  leadfinder: 'Discover and score qualified leads',
  outreach: 'Draft personalized outreach messages',
  analytics: 'Compile ROI and performance report',
}

export function buildChatAgentPlan(input: {
  goal: string
  reasoning: string
  agentIds: AgentId[]
  catalog: ReadonlyArray<{ id: string; name: string; description?: string }>
  action: 'run_agents' | 'run_full_workflow' | 'get_status' | 'set_custom_prompt' | 'respond_only'
  workflowAgentIds?: AgentId[]
}): ChatAgentPlan | null {
  const ids =
    input.action === 'run_full_workflow'
      ? (input.workflowAgentIds ?? [])
      : input.action === 'run_agents'
        ? input.agentIds
        : []

  if (!ids.length) return null

  const steps: ChatPlanStep[] = ids.map((agentId) => {
    const agent = input.catalog.find((a) => a.id === agentId)
    return {
      id: agentId,
      agentId,
      agentName: agent?.name ?? agentId,
      label: AGENT_TASK_LABELS[agentId] ?? agent?.description ?? 'Execute task',
      href: AGENT_VIEW_LINKS[agentId]?.href,
      status: 'pending',
    }
  })

  return {
    goal: input.goal,
    reasoning: input.reasoning,
    steps,
  }
}

export function updatePlanStep(
  plan: ChatAgentPlan,
  agentId: string,
  patch: Partial<Pick<ChatPlanStep, 'status' | 'output'>>,
): ChatAgentPlan {
  return {
    ...plan,
    steps: plan.steps.map((step) =>
      step.agentId === agentId ? { ...step, ...patch } : step,
    ),
  }
}
