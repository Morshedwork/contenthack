import 'server-only'

export type AgentId =
  | 'research'
  | 'strategy'
  | 'content'
  | 'brandtheme'
  | 'video'
  | 'safety'
  | 'scheduler'
  | 'publisher'
  | 'leadfinder'
  | 'outreach'
  | 'analytics'

/** Canonical pipeline order when multiple agents must run in sequence. */
export const AGENT_PIPELINE_ORDER: AgentId[] = [
  'research',
  'strategy',
  'brandtheme',
  'content',
  'video',
  'safety',
  'scheduler',
  'publisher',
  'leadfinder',
  'outreach',
  'analytics',
]

export interface WorkspaceSnapshot {
  hasResearch: boolean
  topicCount: number
  draftCount: number
  leadCount: number
  outreachCount: number
}

interface PhraseRule {
  pattern: RegExp
  agents: AgentId[]
  /** Higher wins when multiple phrases match. */
  priority: number
}

/** Specific multi-word intents — checked before loose keyword matching. */
const PHRASE_RULES: PhraseRule[] = [
  {
    pattern: /\bfull workflow\b|\brun everything\b|\bend[\s-]to[\s-]end\b|\bcomplete pipeline\b|\ball agents\b|\bentire pipeline\b|\bwhole campaign\b/i,
    agents: [],
    priority: 100,
  },
  {
    pattern: /\bstatus\b|\bhow are\b|\bwhat(?:'s| is) running\b|\bagent status\b|\bprogress report\b|\bbrief me on (?:the )?results\b/i,
    agents: [],
    priority: 95,
  },
  {
    pattern: /\bbrand safety\b|\bsafety check\b|\bcompliance check\b|\breview (?:my )?content for\b|\bcheck (?:for )?compliance\b/i,
    agents: ['safety'],
    priority: 90,
  },
  {
    pattern: /\bfind leads and draft outreach\b|\bleads and (?:draft )?outreach\b|\bprospects? and outreach\b/i,
    agents: ['leadfinder', 'outreach'],
    priority: 90,
  },
  {
    pattern: /\bresearch(?:.+?)(?:then|and then|before).+(?:content|posts?|captions?|write)/i,
    agents: ['research', 'content'],
    priority: 88,
  },
  {
    pattern: /\b(?:market )?research and (?:competitive )?analysis\b|\bcompetitive analysis\b|\bmarket research\b/i,
    agents: ['research'],
    priority: 85,
  },
  {
    pattern: /\bcontent strategy\b|\btopic ideas\b|\bcontent pillars\b|\bcontent plan\b/i,
    agents: ['strategy'],
    priority: 85,
  },
  {
    pattern: /\b(?:linkedin|instagram|twitter|x|tiktok|social) posts?\b|\b(?:write|generate|create|draft) (?:a )?(?:posts?|captions?|hooks?)\b|\bsocial content\b/i,
    agents: ['content'],
    priority: 84,
  },
  {
    pattern: /\bvideo scripts?\b|\bshort[\s-]form video\b|\breels? scripts?\b/i,
    agents: ['video'],
    priority: 84,
  },
  {
    pattern: /\bbrand theme\b|\bextract (?:brand )?(?:colors?|theme|palette)\b|\bvisual identity\b|\bcompany url\b/i,
    agents: ['brandtheme'],
    priority: 84,
  },
  {
    pattern: /\bschedule (?:my )?(?:posts?|content|calendar)\b|\bcontent calendar\b|\bposting schedule\b/i,
    agents: ['scheduler'],
    priority: 83,
  },
  {
    pattern: /\bpublish (?:to |on )?\b|\bgo live\b|\bpost (?:to |on )?(?:linkedin|instagram|twitter|x)\b/i,
    agents: ['publisher'],
    priority: 83,
  },
  {
    pattern: /\bfind leads\b|\bprospect discovery\b|\blead finder\b|\bqualified leads\b/i,
    agents: ['leadfinder'],
    priority: 83,
  },
  {
    pattern: /\bdraft outreach\b|\boutreach messages?\b|\bconnection requests?\b|\bemail (?:to )?leads\b/i,
    agents: ['outreach'],
    priority: 83,
  },
  {
    pattern: /\broi report\b|\bperformance metrics\b|\banalytics report\b|\bhours saved\b/i,
    agents: ['analytics'],
    priority: 83,
  },
  {
    pattern: /\bmarket research\b|\bcompetitor analysis\b|\bpain points\b|\bkeyword research\b/i,
    agents: ['research'],
    priority: 70,
  },
  {
    pattern: /\bstrategy\b|\btopic\b|\bpillar\b/i,
    agents: ['strategy'],
    priority: 60,
  },
  {
    pattern: /\b(?:write|generate|create|draft)\b.*\bcontent\b|\bposts?\b|\bcaptions?\b|\bhooks?\b/i,
    agents: ['content'],
    priority: 60,
  },
  {
    pattern: /\bvideo\b|\bscript\b|\breel\b/i,
    agents: ['video'],
    priority: 55,
  },
  {
    pattern: /\bsafety\b|\bcompliance\b|\bbrand check\b/i,
    agents: ['safety'],
    priority: 55,
  },
  {
    pattern: /\bschedule\b|\bcalendar\b|\btiming\b/i,
    agents: ['scheduler'],
    priority: 50,
  },
  {
    pattern: /\bpublish\b|\bposting\b/i,
    agents: ['publisher'],
    priority: 50,
  },
  {
    pattern: /\bleads?\b|\bprospects?\b/i,
    agents: ['leadfinder'],
    priority: 45,
  },
  {
    pattern: /\boutreach\b|\bemail lead\b/i,
    agents: ['outreach'],
    priority: 45,
  },
  {
    pattern: /\banalytics\b|\broi\b|\bmetrics\b|\bperformance\b|\breport\b/i,
    agents: ['analytics'],
    priority: 45,
  },
]

const CHAIN_PATTERN = /\b(?:then|and then|after that|followed by|before)\b/i

/** Hard prerequisites — only injected when the user chained steps or asked for a compound outcome. */
const AUTO_PREREQUISITES: Partial<
  Record<AgentId, { when: (ws: WorkspaceSnapshot) => boolean; add: AgentId[] }>
> = {
  outreach: {
    when: (ws) => ws.leadCount === 0,
    add: ['leadfinder'],
  },
  publisher: {
    when: (ws) => ws.draftCount === 0,
    add: ['content'],
  },
  safety: {
    when: (ws) => ws.draftCount === 0,
    add: ['content'],
  },
  scheduler: {
    when: (ws) => ws.draftCount === 0,
    add: ['content'],
  },
}

function sortPipeline(ids: AgentId[]): AgentId[] {
  const order = new Map(AGENT_PIPELINE_ORDER.map((id, i) => [id, i]))
  return [...new Set(ids)].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
}

function hasExplicitChain(message: string): boolean {
  return CHAIN_PATTERN.test(message)
}

function hasCompoundIntent(message: string, agents: AgentId[]): boolean {
  if (agents.length <= 1) return false
  if (hasExplicitChain(message)) return true
  return /\band\b/i.test(message) && agents.length === 2
}

export function buildWorkspaceSnapshot(ws: {
  research: unknown
  topics: unknown[]
  contentDrafts: unknown[]
  leads: unknown[]
  outreach: unknown[]
}): WorkspaceSnapshot {
  return {
    hasResearch: Boolean(ws.research),
    topicCount: ws.topics.length,
    draftCount: ws.contentDrafts.length,
    leadCount: ws.leads.length,
    outreachCount: ws.outreach.length,
  }
}

/** Phrase-first fallback: returns the single best matching agent set, not every keyword hit. */
export function matchAgentsFromMessage(message: string): {
  kind: 'full_workflow' | 'status' | 'agents' | 'none'
  agentIds: AgentId[]
} {
  const matches = PHRASE_RULES.filter((rule) => rule.pattern.test(message))
  if (matches.length === 0) return { kind: 'none', agentIds: [] }

  const best = matches.reduce((top, rule) => (rule.priority > top.priority ? rule : top))

  if (best.priority >= 100 && best.agents.length === 0) {
    return { kind: 'full_workflow', agentIds: [] }
  }
  if (best.priority === 95 && best.agents.length === 0) {
    return { kind: 'status', agentIds: [] }
  }
  if (best.agents.length > 0) {
    return { kind: 'agents', agentIds: sortPipeline(best.agents) }
  }

  return { kind: 'none', agentIds: [] }
}

/**
 * Trim AI-selected agents and add prerequisites only when the user clearly needs them.
 * Never expands a single-agent request into a full pipeline.
 */
export function resolveAgentPlan(
  requestedIds: AgentId[],
  message: string,
  ws: WorkspaceSnapshot,
): AgentId[] {
  if (requestedIds.length === 0) return []

  let plan = sortPipeline(requestedIds)

  // If the model returned too many agents without an explicit multi-step ask, keep the most specific matches.
  if (plan.length > 3 && !hasExplicitChain(message) && !/\band\b.+\band\b/i.test(message)) {
    const phraseMatch = matchAgentsFromMessage(message)
    if (phraseMatch.kind === 'agents' && phraseMatch.agentIds.length > 0) {
      plan = phraseMatch.agentIds
    } else {
      plan = plan.slice(0, 2)
    }
  }

  const chained = hasCompoundIntent(message, plan)
  if (!chained && plan.length === 1) {
    return plan
  }

  const expanded: AgentId[] = [...plan]
  for (const agentId of plan) {
    const prereq = AUTO_PREREQUISITES[agentId]
    if (!prereq || !prereq.when(ws)) continue
    for (const dep of prereq.add) {
      if (!expanded.includes(dep)) expanded.push(dep)
    }
  }

  return sortPipeline(expanded)
}

export function describeAgentPlan(agentIds: AgentId[], catalog: ReadonlyArray<{ id: string; name: string }>): string {
  if (agentIds.length === 0) return 'No agents selected.'
  const names = agentIds.map((id) => catalog.find((a) => a.id === id)?.name ?? id)
  if (names.length === 1) return `Running ${names[0]}.`
  return `Running ${names.slice(0, -1).join(', ')} then ${names[names.length - 1]}.`
}
