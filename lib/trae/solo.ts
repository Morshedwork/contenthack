import type {
  ContentPillar,
  GeneratedTopic,
  Platform,
  SearchIntent,
  TopicBrief,
  TraeSoloTopicResult,
} from '@/types'
import { generateJSON, withOpenAI } from '@/lib/ai/openai'
import { crustdataPromptBlock, fetchTaskContext, mergeCrustdataSignals, type CrustdataTaskInput } from '@/lib/ai/crustdata'
import { appendCustomPrompt, normalizeCustomPromptDetails } from '@/lib/ai/prompt-utils'
import { MODEL_TASK, resolveTaskModel, type TaskModelConfig } from '@/lib/models/routing'
import type { MarketResearch } from '@/types'

const PILLAR_TEMPLATES = [
  { name: 'Problem Awareness', description: 'Pain points and challenges your audience faces' },
  { name: 'Solution Education', description: 'How your product or approach solves the problem' },
  { name: 'Proof & Results', description: 'Case studies, data, and social proof' },
  { name: 'Action & Conversion', description: 'CTAs, offers, and next-step content' },
]

const FORMAT_BY_PLATFORM: Record<Platform, string[]> = {
  linkedin: ['Long-form post', 'Carousel', 'Poll', 'Document post'],
  instagram: ['Reel script', 'Carousel', 'Story series', 'Static post'],
  facebook: ['Community post', 'Video caption', 'Event promo'],
  x: ['Thread', 'Hot take', 'Quote tweet hook'],
  tiktok: ['Short script', 'Trend hook'],
  youtube: ['Shorts script', 'Tutorial outline'],
  email: ['Newsletter section', 'Drip email'],
  carousel: ['Multi-slide breakdown', 'Step-by-step guide'],
}

const ANGLE_TEMPLATES = [
  'How-to guide for {audience}',
  'Common mistakes when {point}',
  'Before vs after: {point}',
  'Data-backed insight on {point}',
  'Quick wins for {point}',
  'Expert breakdown: {point}',
  'Case study angle on {point}',
  'Myth vs reality: {point}',
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function pickIntent(score: number): SearchIntent {
  if (score >= 85) return 'transactional'
  if (score >= 70) return 'commercial'
  return 'informational'
}

function clampScore(value: unknown, fallback: number): number {
  const v = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(v)) return fallback
  return Math.max(0, Math.min(100, Math.round(v)))
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function buildHookIdeas(point: string, tone: string): string[] {
  const short = point.length > 60 ? `${point.slice(0, 57)}...` : point
  return [
    `Stop ignoring this: ${short}`,
    `${tone.split(',')[0]?.trim() || 'Honest'} take — ${short.toLowerCase()}`,
    `3 reasons ${short.toLowerCase()} matters now`,
  ]
}

function assignPillar(index: number, pointCount: number): ContentPillar {
  const pillarIndex = Math.min(
    Math.floor((index / Math.max(pointCount, 1)) * PILLAR_TEMPLATES.length),
    PILLAR_TEMPLATES.length - 1,
  )
  return { ...PILLAR_TEMPLATES[pillarIndex], topicCount: 0 }
}

function generateTopicFromPoint(
  point: string,
  brief: TopicBrief,
  index: number,
  pillar: string,
): GeneratedTopic {
  const audience = brief.targetAudience.split(',')[0]?.trim() || 'your audience'
  const angleTemplate = ANGLE_TEMPLATES[index % ANGLE_TEMPLATES.length]
  const contentAngle = angleTemplate
    .replace('{audience}', audience)
    .replace('{point}', point.toLowerCase())

  const intentScore = Math.min(95, 72 + index * 3 + point.length % 12)
  const formats = brief.platforms.flatMap((p) => FORMAT_BY_PLATFORM[p] || []).slice(0, 4)

  return {
    id: `topic-${slugify(point)}-${index}`,
    title: `${contentAngle.charAt(0).toUpperCase()}${contentAngle.slice(1)}`,
    pillar,
    intentScore,
    searchIntent: pickIntent(intentScore),
    contentAngle,
    suggestedFormats: formats.length > 0 ? [...new Set(formats)] : ['LinkedIn post', 'Blog outline'],
    hookIdeas: buildHookIdeas(point, brief.tone),
    keyPointsCovered: [point],
    rationale: `Derived from your brief point "${point}" — aligned with goal: ${brief.goal.slice(0, 80)}`,
  }
}

function generateTopicsFromBaseContent(brief: TopicBrief, startIndex: number): GeneratedTopic[] {
  const sentences = brief.baseContent
    .split(/[.\n!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .slice(0, 4)

  return sentences.map((sentence, i) => {
    const idx = startIndex + i
    const pillar = assignPillar(idx, brief.keyPoints.length + sentences.length).name
    const intentScore = Math.min(92, 68 + i * 5)
    return {
      id: `topic-base-${idx}`,
      title: sentence.length > 70 ? `${sentence.slice(0, 67)}...` : sentence,
      pillar,
      intentScore,
      searchIntent: pickIntent(intentScore),
      contentAngle: `Expand on: ${sentence.slice(0, 100)}`,
      suggestedFormats: ['LinkedIn article', 'Email nurture', 'Carousel'],
      hookIdeas: buildHookIdeas(sentence, brief.tone),
      keyPointsCovered: brief.keyPoints.slice(0, 2),
      rationale: 'Extracted from your base content context',
    }
  })
}

function buildContentPillars(topics: GeneratedTopic[]): ContentPillar[] {
  const counts = new Map<string, number>()
  for (const topic of topics) {
    counts.set(topic.pillar, (counts.get(topic.pillar) || 0) + 1)
  }
  return PILLAR_TEMPLATES.map((p) => ({
    ...p,
    topicCount: counts.get(p.name) || 0,
  })).filter((p) => p.topicCount > 0)
}

export function validateTopicBrief(input: Partial<TopicBrief>): TopicBrief {
  const keyPoints = (input.keyPoints || []).map((p) => p.trim()).filter(Boolean)
  if (keyPoints.length === 0 && !input.baseContent?.trim()) {
    throw new Error('Add at least one key point or base content to generate topics')
  }

  return {
    title: input.title?.trim() || 'Content Strategy Brief',
    goal: input.goal?.trim() || 'Generate high-intent content topics',
    keyPoints,
    baseContent: input.baseContent?.trim() || '',
    targetAudience: input.targetAudience?.trim() || 'Marketing teams and founders',
    tone: input.tone?.trim() || 'Professional, clear, actionable',
    platforms: (input.platforms?.length ? input.platforms : ['linkedin', 'instagram']) as Platform[],
    topicCount: Math.min(Math.max(input.topicCount || 8, 4), 16),
    customPromptDetails: normalizeCustomPromptDetails(input.customPromptDetails),
  }
}

async function generateTopicsDemo(brief: TopicBrief): Promise<GeneratedTopic[]> {
  await new Promise((r) => setTimeout(r, 400))

  const topicsFromPoints = brief.keyPoints.map((point, i) => {
    const pillar = assignPillar(i, brief.keyPoints.length).name
    return generateTopicFromPoint(point, brief, i, pillar)
  })

  const topicsFromContent = brief.baseContent
    ? generateTopicsFromBaseContent(brief, topicsFromPoints.length)
    : []

  return [...topicsFromPoints, ...topicsFromContent]
    .sort((a, b) => b.intentScore - a.intentScore)
    .slice(0, brief.topicCount)
}

async function generateTopicsOpenAI(
  brief: TopicBrief,
  modelConfig?: TaskModelConfig,
  research?: MarketResearch | null,
  signals?: CrustdataTaskInput,
): Promise<GeneratedTopic[]> {
  const mc = modelConfig ?? resolveTaskModel(MODEL_TASK.CONTENT_GENERATION)
  const pillarNames = PILLAR_TEMPLATES.map((p) => p.name)
  const platforms = brief.platforms.join(', ')
  const pointBlock = brief.keyPoints.length ? `Key points:\n- ${brief.keyPoints.join('\n- ')}` : ''
  const baseBlock = brief.baseContent.trim()
    ? `Base content:\n"""\n${brief.baseContent.trim().slice(0, 2000)}\n"""`
    : ''
  const crustdataContext = await fetchTaskContext(
    MODEL_TASK.CONTENT_GENERATION,
    mergeCrustdataSignals(
      {
        goal: brief.goal,
        topic: brief.title,
        targetCustomer: brief.targetAudience,
        ...signals,
      },
      undefined,
      research,
    ),
  )

  const data = await generateJSON<{ topics?: unknown[] }>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system:
      'You are an autonomous content strategy agent. When CrustData evidence is provided, ground topics in real market signals. Respond with a single valid JSON object only. No markdown. No extra keys.',
    user: appendCustomPrompt(`Generate ${brief.topicCount} high-intent content topics for this brief.
${crustdataPromptBlock(crustdataContext, 'strategy data')}
Brief title: ${brief.title}
Goal: ${brief.goal}
Target audience: ${brief.targetAudience}
Tone: ${brief.tone}
Target platforms: ${platforms}

${pointBlock}
${baseBlock}

Return JSON with exactly this shape:
{
  "topics": [
    {
      "title": "string",
      "pillar": "${pillarNames.join('"|"')}",
      "intentScore": 0-100,
      "searchIntent": "informational"|"commercial"|"transactional",
      "contentAngle": "string",
      "suggestedFormats": ["string", "..."],
      "hookIdeas": ["string", "string", "string"],
      "keyPointsCovered": ["string", "..."],
      "rationale": "string"
    }
  ]
}`, brief.customPromptDetails),
  })

  const rawTopics = ensureArray<unknown>(data.topics).slice(0, brief.topicCount)
  const normalized = rawTopics.map((t, i) => {
    const obj = (t && typeof t === 'object' ? (t as Record<string, unknown>) : {}) as Record<string, unknown>
    const title = String(obj.title || '').trim() || `Topic ${i + 1}`
    const pillarCandidate = String(obj.pillar || '').trim()
    const pillar = pillarNames.includes(pillarCandidate)
      ? pillarCandidate
      : assignPillar(i, Math.max(brief.topicCount || 8, 1)).name
    const intentScore = clampScore(obj.intentScore, Math.min(95, 78 + i * 3))
    const searchIntentRaw = String(obj.searchIntent || '').trim() as SearchIntent
    const searchIntent: SearchIntent =
      searchIntentRaw === 'informational' || searchIntentRaw === 'commercial' || searchIntentRaw === 'transactional'
        ? searchIntentRaw
        : pickIntent(intentScore)
    const contentAngle = String(obj.contentAngle || '').trim() || title
    const suggestedFormats = ensureArray<string>(obj.suggestedFormats).map(String).filter(Boolean).slice(0, 6)
    const hookIdeas = ensureArray<string>(obj.hookIdeas).map(String).filter(Boolean).slice(0, 3)
    const keyPointsCovered = ensureArray<string>(obj.keyPointsCovered).map(String).filter(Boolean).slice(0, 4)

    return {
      id: `topic-ai-${slugify(title)}-${i}`,
      title,
      pillar,
      intentScore,
      searchIntent,
      contentAngle,
      suggestedFormats: suggestedFormats.length ? suggestedFormats : ['Long-form post', 'Carousel'],
      hookIdeas: hookIdeas.length ? hookIdeas : buildHookIdeas(title, brief.tone),
      keyPointsCovered: keyPointsCovered.length ? keyPointsCovered : brief.keyPoints.slice(0, 2),
      rationale:
        String(obj.rationale || '').trim() ||
        `Aligned with goal "${brief.goal.slice(0, 80)}" for ${brief.targetAudience.slice(0, 60)}`,
    } satisfies GeneratedTopic
  })

  return normalized.slice(0, brief.topicCount)
}

export async function runTraeSoloTopicGeneration(
  briefInput: Partial<TopicBrief> & {
    modelConfig?: TaskModelConfig
    research?: MarketResearch | null
    signals?: CrustdataTaskInput
  },
): Promise<TraeSoloTopicResult> {
  const { modelConfig, research, signals, ...rest } = briefInput
  const brief = validateTopicBrief(rest)
  const executionSteps = [
    'TRAE Solo: Parsing structured brief (title, goal, points, base content)',
    'TRAE Solo: Mapping key points to content pillars',
    'TRAE Solo: Scoring search intent and platform fit',
    'TRAE Solo: Generating hooks, angles, and format recommendations',
  ]

  const { result: topics } = await withOpenAI(() => generateTopicsOpenAI(brief, modelConfig, research, signals))
  if (!topics.length) {
    throw new Error('OpenAI returned no topics — try adding more key points or base content')
  }
  const contentPillars = buildContentPillars(topics)
  const mc = modelConfig ?? resolveTaskModel(MODEL_TASK.CONTENT_GENERATION)

  return {
    agent: 'trae-solo',
    task: 'topic_strategy',
    status: 'completed',
    topics,
    contentPillars,
    summary: `Generated ${topics.length} topics from ${brief.keyPoints.length} key points${brief.baseContent ? ' + base content' : ''}. Highest intent: "${topics[0]?.title.slice(0, 50)}..."`,
    executionSteps: [...executionSteps, `TRAE Solo: ${mc.assignedModel}`],
    modelUsed: `${mc.assignedModel} via TRAE Solo`,
  }
}

export const TRAE_SOLO_CAPABILITIES = {
  agent: 'trae-solo',
  version: '2.0',
  tasks: ['topic_strategy', 'content_generation'],
  mcpEndpoint: '/api/trae/solo',
  description: 'Autonomous content strategy agent — transforms structured briefs into pillar-mapped topics',
}
