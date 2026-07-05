import type { ChatActionExecuted, ChatSuggestedAction } from '@/lib/agents/types'
import type { WorkspaceState } from '@/lib/workspace/store'

export function buildChatSuggestedActions(
  actions: ChatActionExecuted[],
  ws: WorkspaceState,
): ChatSuggestedAction[] {
  const ran = new Set(actions.flatMap((a) => a.results?.map((r) => r.agentId) ?? []))
  const suggestions: ChatSuggestedAction[] = []

  if (actions.some((a) => a.type === 'status')) {
    suggestions.push(
      { label: 'Run full workflow', prompt: 'Run the full content workflow end to end' },
      { label: 'Generate posts', prompt: 'Generate LinkedIn posts for my campaign' },
    )
    return suggestions.slice(0, 4)
  }

  if (ran.has('research') && !ran.has('content')) {
    suggestions.push({
      label: 'Write posts from research',
      prompt: 'Generate LinkedIn posts based on the latest research',
    })
  }

  if (ran.has('content') && !ran.has('safety') && ws.contentDrafts.length > 0) {
    suggestions.push({
      label: 'Brand safety check',
      prompt: 'Run brand safety on my latest content drafts',
    })
  }

  if (ran.has('content') && !ran.has('scheduler')) {
    suggestions.push({
      label: 'Schedule posts',
      prompt: 'Schedule the new posts on the content calendar',
    })
  }

  if (ran.has('video') && ws.videoScripts.length > 0) {
    suggestions.push({
      label: 'Generate video',
      prompt: 'Create a short video from my latest script',
    })
  }

  if (ran.has('leadfinder') && !ran.has('outreach') && ws.leads.length > 0) {
    suggestions.push({
      label: 'Draft outreach',
      prompt: 'Draft personalized outreach for my top leads',
    })
  }

  if (actions.some((a) => a.type === 'run_workflow' || a.type === 'run_agent')) {
    suggestions.push({
      label: 'View status',
      prompt: 'What is the status of all agents?',
    })
  }

  if (suggestions.length < 2) {
    suggestions.push(
      { label: 'Market research', prompt: 'Run market research focused on my target region' },
      { label: 'Find leads', prompt: 'Find qualified leads and draft outreach' },
    )
  }

  const seen = new Set<string>()
  return suggestions.filter((s) => {
    if (seen.has(s.prompt)) return false
    seen.add(s.prompt)
    return true
  }).slice(0, 4)
}

export function buildBasicChatSuggestedActions(userMessage: string): ChatSuggestedAction[] {
  const lower = userMessage.toLowerCase()
  const suggestions: ChatSuggestedAction[] = []

  if (/linkedin|post|caption|hook|copy/i.test(lower)) {
    suggestions.push(
      { label: 'More hook ideas', prompt: 'Give me 5 more hook variations for the same topic' },
      { label: 'Run in Agent Mode', prompt: 'Generate LinkedIn posts for my campaign' },
    )
  } else if (/video|reel|script/i.test(lower)) {
    suggestions.push(
      { label: 'Reels from content', prompt: 'Convert my content drafts into reel scripts with the agent pipeline' },
      { label: 'Promotion reels', prompt: 'Run promotion reel agents — lead gen variants with safety review' },
      { label: 'Full reel campaign', prompt: 'Run full reel campaign: strategy, content, video, safety, scheduler' },
    )
  } else if (/calendar|schedule|cadence/i.test(lower)) {
    suggestions.push(
      { label: 'Weekly plan', prompt: 'Outline a weekly posting cadence for LinkedIn and Instagram' },
      { label: 'Schedule content', prompt: 'Schedule the new posts on the content calendar' },
    )
  } else {
    suggestions.push(
      { label: 'Brainstorm posts', prompt: 'Brainstorm 5 LinkedIn post ideas for my campaign' },
      { label: 'Improve a hook', prompt: 'What makes a strong hook for a 30-second video?' },
    )
  }

  return suggestions.slice(0, 3)
}
