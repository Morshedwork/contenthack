import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Calendar,
  CheckSquare,
  FileText,
  Megaphone,
  Palette,
  Search,
  Send,
  Users,
  Video,
} from 'lucide-react'

export interface AgentViewLink {
  href: string
  label: string
  icon: LucideIcon
}

export const AGENT_VIEW_LINKS: Record<string, AgentViewLink> = {
  research: { href: '/dashboard/research', label: 'View research', icon: Search },
  strategy: { href: '/dashboard/content', label: 'View topics', icon: FileText },
  content: { href: '/dashboard/content', label: 'View posts', icon: FileText },
  brandtheme: { href: '/dashboard/settings', label: 'View brand themes', icon: Palette },
  video: { href: '/dashboard/video', label: 'View video scripts', icon: Video },
  safety: { href: '/dashboard/approval', label: 'View approvals', icon: CheckSquare },
  scheduler: { href: '/dashboard/calendar', label: 'View calendar', icon: Calendar },
  publisher: { href: '/dashboard/publishing', label: 'View publishing', icon: Megaphone },
  leadfinder: { href: '/dashboard/leads', label: 'View leads', icon: Users },
  outreach: { href: '/dashboard/outreach', label: 'View outreach', icon: Send },
  analytics: { href: '/dashboard/analytics', label: 'View analytics', icon: BarChart3 },
}

export function getAgentViewLink(agentId: string): AgentViewLink | undefined {
  return AGENT_VIEW_LINKS[agentId]
}

export function getCompletedAgentViewLinks(
  results: { agentId: string; status: string }[] | undefined,
): { agentId: string; link: AgentViewLink }[] {
  if (!results?.length) return []
  const seen = new Set<string>()
  const links: { agentId: string; link: AgentViewLink }[] = []
  for (const result of results) {
    if (result.status !== 'completed' || seen.has(result.agentId)) continue
    const link = getAgentViewLink(result.agentId)
    if (!link) continue
    seen.add(result.agentId)
    links.push({ agentId: result.agentId, link })
  }
  return links
}

/** Maps agent display names (e.g. task queue) to agent ids */
export const AGENT_NAME_TO_ID: Record<string, string> = {
  'Research Agent': 'research',
  'Strategy Agent': 'strategy',
  'Content Agent': 'content',
  'Brand Theme Agent': 'brandtheme',
  'Video Agent': 'video',
  'Brand Safety Agent': 'safety',
  'Scheduler Agent': 'scheduler',
  'Publisher Agent': 'publisher',
  'Lead Finder Agent': 'leadfinder',
  'Outreach Agent': 'outreach',
  'Analytics Agent': 'analytics',
}

export function getAgentViewLinkByName(agentName: string): AgentViewLink | undefined {
  const id = AGENT_NAME_TO_ID[agentName]
  return id ? getAgentViewLink(id) : undefined
}
