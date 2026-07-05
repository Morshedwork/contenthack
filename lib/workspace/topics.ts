import type { GeneratedTopic, SearchIntent } from '@/types'

/** Map simple topic titles from /api/topics/generate into workspace topic records. */
export function topicsFromTitles(titles: string[], goal?: string): GeneratedTopic[] {
  const now = Date.now().toString(36)
  return titles.map((title, i) => ({
    id: `topic-${now}-${i}`,
    title,
    pillar: 'Solution Education',
    intentScore: Math.min(95, 72 + i * 3),
    searchIntent: (i % 3 === 0 ? 'transactional' : i % 2 === 0 ? 'commercial' : 'informational') as SearchIntent,
    contentAngle: title,
    suggestedFormats: ['LinkedIn post', 'Carousel'],
    hookIdeas: [],
    keyPointsCovered: [],
    rationale: goal?.trim() ? `Generated for campaign goal: ${goal.trim().slice(0, 120)}` : 'AI-generated topic',
  }))
}
