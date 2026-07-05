import type { ChatActionExecuted, ChatArtifact, ChatReference } from '@/lib/agents/types'
import { AGENT_VIEW_LINKS } from '@/lib/agents/view-links'
import type { WorkspaceState } from '@/lib/workspace/store'

export interface WorkspaceArtifactSnapshot {
  draftIds: Set<string>
  topicIds: Set<string>
  scriptIds: Set<string>
  imageIds: Set<string>
  videoIds: Set<string>
  leadIds: Set<string>
  outreachIds: Set<string>
}

const MAX_ARTIFACTS = 8
const MAX_PER_TYPE = 3

export function snapshotWorkspaceArtifacts(ws: WorkspaceState): WorkspaceArtifactSnapshot {
  return {
    draftIds: new Set(ws.contentDrafts.map((d) => d.id)),
    topicIds: new Set(ws.topics.map((t) => t.id)),
    scriptIds: new Set(ws.videoScripts.map((s) => s.id)),
    imageIds: new Set(ws.generatedImages.map((i) => i.id)),
    videoIds: new Set(ws.generatedVideos.map((v) => v.id)),
    leadIds: new Set(ws.leads.map((l) => l.id)),
    outreachIds: new Set(ws.outreach.map((o) => o.id)),
  }
}

function isNew(id: string, before: WorkspaceArtifactSnapshot, key: keyof WorkspaceArtifactSnapshot): boolean {
  return !before[key].has(id)
}

function completedAgentIds(actions: ChatActionExecuted[]): Set<string> {
  const ids = new Set<string>()
  for (const action of actions) {
    for (const result of action.results ?? []) {
      if (result.status === 'completed') ids.add(result.agentId)
    }
  }
  return ids
}

export function buildChatArtifacts(
  ws: WorkspaceState,
  actions: ChatActionExecuted[],
  before: WorkspaceArtifactSnapshot,
): ChatArtifact[] {
  const ran = completedAgentIds(actions)
  if (!ran.size) return []

  const artifacts: ChatArtifact[] = []

  if (ran.has('research') && ws.research) {
    artifacts.push({
      id: ws.research.id,
      type: 'research',
      title: `Market research · ${ws.research.opportunityScore}/100 opportunity`,
      preview: ws.research.marketSummary,
      agentId: 'research',
      href: '/dashboard/research',
      meta: `${ws.research.painPoints.length} pain points · ${ws.research.competitors.length} competitors`,
    })
  }

  if (ran.has('strategy') || ran.has('content')) {
    for (const topic of ws.topics.filter((t) => isNew(t.id, before, 'topicIds')).slice(0, MAX_PER_TYPE)) {
      artifacts.push({
        id: topic.id,
        type: 'topic',
        title: topic.title,
        preview: topic.contentAngle,
        agentId: 'strategy',
        href: '/dashboard/content',
        meta: `${topic.pillar} · score ${topic.intentScore}`,
      })
    }
  }

  if (ran.has('content')) {
    for (const draft of ws.contentDrafts.filter((d) => isNew(d.id, before, 'draftIds')).slice(0, MAX_PER_TYPE)) {
      artifacts.push({
        id: draft.id,
        type: 'post',
        title: draft.hook.slice(0, 80) || 'New post draft',
        preview: draft.mainCopy,
        agentId: 'content',
        href: '/dashboard/content',
        meta: `${draft.platform} · ${draft.status}`,
      })
    }
  }

  if (ran.has('video')) {
    for (const script of ws.videoScripts.filter((s) => isNew(s.id, before, 'scriptIds')).slice(0, MAX_PER_TYPE)) {
      artifacts.push({
        id: script.id,
        type: 'script',
        title: script.title,
        preview: script.hook,
        agentId: 'video',
        href: '/dashboard/video',
        meta: `${script.duration} · ${script.status}`,
      })
    }
  }

  if (ran.has('leadfinder')) {
    for (const lead of ws.leads.filter((l) => isNew(l.id, before, 'leadIds')).slice(0, MAX_PER_TYPE)) {
      artifacts.push({
        id: lead.id,
        type: 'lead',
        title: `${lead.name} · ${lead.company}`,
        preview: lead.matchReason,
        agentId: 'leadfinder',
        href: '/dashboard/leads',
        meta: `score ${lead.score} · ${lead.status}`,
      })
    }
  }

  if (ran.has('outreach')) {
    for (const msg of ws.outreach.filter((o) => isNew(o.id, before, 'outreachIds')).slice(0, MAX_PER_TYPE)) {
      artifacts.push({
        id: msg.id,
        type: 'outreach',
        title: `Outreach for ${msg.leadName}`,
        preview: msg.linkedinConnection || msg.emailSubject,
        agentId: 'outreach',
        href: '/dashboard/outreach',
        meta: msg.emailSubject ? 'email + LinkedIn' : 'LinkedIn',
      })
    }
  }

  for (const image of ws.generatedImages.filter((i) => isNew(i.id, before, 'imageIds')).slice(0, MAX_PER_TYPE)) {
    artifacts.push({
      id: image.id,
      type: 'image',
      title: image.prompt.slice(0, 80) || 'Generated image',
      preview: image.enhancedPrompt,
      href: '/dashboard/image',
      thumbnailUrl: image.imageUrl,
      mediaUrl: image.imageUrl,
      meta: `${image.model} · ${image.aspectRatio}`,
    })
  }

  for (const video of ws.generatedVideos.filter((v) => isNew(v.id, before, 'videoIds')).slice(0, MAX_PER_TYPE)) {
    if (!video.videoUrl) continue
    artifacts.push({
      id: video.id,
      type: 'video',
      title: video.prompt.slice(0, 80) || 'Generated video',
      preview: video.prompt,
      href: '/dashboard/video',
      mediaUrl: video.videoUrl,
      meta: `${video.model} · ${video.duration}s`,
    })
  }

  return artifacts.slice(0, MAX_ARTIFACTS)
}

export function buildChatReferences(
  actions: ChatActionExecuted[],
  artifacts: ChatArtifact[],
): ChatReference[] {
  const refs: ChatReference[] = []
  const seen = new Set<string>()

  for (const action of actions) {
    for (const result of action.results ?? []) {
      if (result.status !== 'completed') continue
      const link = AGENT_VIEW_LINKS[result.agentId]
      if (!link || seen.has(link.href)) continue
      seen.add(link.href)
      refs.push({
        label: link.label,
        href: link.href,
        description: result.lastOutput,
      })
    }
  }

  if (artifacts.length && !seen.has('/dashboard/library')) {
    refs.push({
      label: 'Content library',
      href: '/dashboard/library',
      description: `${artifacts.length} new item${artifacts.length === 1 ? '' : 's'} from this run`,
    })
  }

  return refs
}

export function formatArtifactsForPrompt(artifacts: ChatArtifact[], references: ChatReference[]): string {
  const lines: string[] = []

  if (artifacts.length) {
    lines.push('New outputs (use these exact markdown links when referencing where to view them):')
    for (const artifact of artifacts) {
      lines.push(
        `- [${artifact.title}](${artifact.href}) — ${artifact.type}${artifact.meta ? ` (${artifact.meta})` : ''}`,
      )
    }
  }

  if (references.length) {
    lines.push('', 'Dashboard destinations:')
    for (const ref of references) {
      lines.push(`- [${ref.label}](${ref.href})${ref.description ? `: ${ref.description}` : ''}`)
    }
  }

  return lines.join('\n') || 'No new workspace artifacts.'
}
