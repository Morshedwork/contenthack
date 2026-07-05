import { demoModelRouting } from '@/lib/demo/data'
import { KIMI_MODEL, hasKimi } from '@/lib/ai/kimi'
import { OPENAI_MODEL, OPENAI_MODEL_QUALITY, hasOpenAI } from '@/lib/ai/openai'
import { OPENAI_IMAGE_MODEL, normalizeOpenAIImageModel } from '@/lib/ai/openai-image'
import type { ModelRouting } from '@/types'

/** Task types aligned with the Model Hub routing table. */
export const MODEL_TASK = {
  MARKET_RESEARCH: 'Market research',
  CONTENT_GENERATION: 'Content generation',
  VIDEO_SCRIPTS: 'Video scripts',
  BRAND_SAFETY: 'Brand safety',
  LEAD_SCORING: 'Lead scoring',
  OUTREACH_WRITING: 'Outreach writing',
  ANALYTICS_SUMMARY: 'Analytics summary',
  IMAGE_GENERATION: 'Image generation',
  VIDEO_GENERATION: 'Video generation',
} as const

export type ModelTaskType = (typeof MODEL_TASK)[keyof typeof MODEL_TASK]

export interface TaskModelConfig {
  taskType: ModelTaskType
  model: string
  fallbackModel?: string
  /** Ordered models to try — user routing + cross-provider fallbacks. */
  modelChain: string[]
  assignedModel: string
  temperature: number
  maxTokens: number
}

const MODEL_ALIAS_TO_ID: Record<string, string> = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o mini': 'gpt-4o-mini',
  'gpt-4.1': 'gpt-4.1',
  'gpt-4.1 mini': 'gpt-4.1-mini',
  'o4-mini': 'o4-mini',
  'kimi k2.5': 'kimi-k2.5',
  'dall-e 3': 'dall-e-3',
  'dall-e 2': 'dall-e-2',
  'gpt image 1': 'gpt-image-1',
  'gpt image 1.5': 'gpt-image-1.5',
  'gpt image 1 mini': 'gpt-image-1-mini',
  'gpt image 2': 'gpt-image-2',
  'gpt image 2.0': 'gpt-image-2',
  'pixverse v4.5': 'v4.5',
  'pixverse v4': 'v4.5',
  'pixverse v5': 'v5',
  'pixverse v5.5': 'v5.5',
  'pixverse v6': 'v6',
  'sora 2 pro': 'openai/sora-2-pro',
  'veo 3.1 lite': 'google/veo-3.1-lite',
  'veo 3.1 fast': 'google/veo-3.1-fast',
  'veo 3.1': 'google/veo-3.1',
  'kling 3.0 pro': 'kwaivgi/kling-v3.0-pro',
  'kling 3.0 std': 'kwaivgi/kling-v3.0-std',
  'kling video o1': 'kwaivgi/kling-video-o1',
  'seedance 1.5 pro': 'bytedance/seedance-1-5-pro',
  'seedance 1.5': 'bytedance/seedance-1-5-pro',
  'seedance 2.0': 'bytedance/seedance-2.0',
  'seedance 2.0 fast': 'bytedance/seedance-2.0-fast',
  'wan 2.6': 'alibaba/wan-2.6',
  'wan 2.7': 'alibaba/wan-2.7',
  'hailuo 2.3': 'minimax/hailuo-2.3',
  'grok imagine video': 'x-ai/grok-imagine-video',
  'seedream 4.5': 'bytedance-seed/seedream-4.5',
}

const QUALITY_TASKS = new Set<ModelTaskType>([
  MODEL_TASK.MARKET_RESEARCH,
  MODEL_TASK.BRAND_SAFETY,
  MODEL_TASK.OUTREACH_WRITING,
])

const KIMI_MODEL_PREFIX = /^kimi/i

function isTextModelAvailable(modelId: string): boolean {
  return KIMI_MODEL_PREFIX.test(modelId.trim()) ? hasKimi() : hasOpenAI()
}

function pushUniqueModel(chain: string[], model?: string): void {
  if (!model?.trim()) return
  const id = modelDisplayNameToId(model.trim())
  if (!chain.includes(id) && isTextModelAvailable(id)) chain.push(id)
}

/** Ordered fallback chain: user primary → user fallback → env defaults → cross-provider. */
export function buildModelChain(input: {
  model?: string
  fallbackModel?: string
  taskType?: ModelTaskType
  preferQuality?: boolean
}): string[] {
  const chain: string[] = []
  pushUniqueModel(chain, input.model)
  pushUniqueModel(chain, input.fallbackModel)

  if (input.preferQuality) pushUniqueModel(chain, OPENAI_MODEL_QUALITY)
  pushUniqueModel(chain, OPENAI_MODEL)
  pushUniqueModel(chain, KIMI_MODEL)

  if (hasOpenAI()) pushUniqueModel(chain, OPENAI_MODEL)
  if (hasKimi()) pushUniqueModel(chain, KIMI_MODEL)

  return chain
}

function normalizeModelName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Map Model Hub display names to API model IDs. */
export function modelDisplayNameToId(displayName: string): string {
  const normalized = normalizeModelName(displayName)
  if (MODEL_ALIAS_TO_ID[normalized]) return MODEL_ALIAS_TO_ID[normalized]
  // Already an API id (gpt-4o-mini, kimi-k2.5, v4.5, …)
  if (/^[a-z0-9][a-z0-9.-]*$/i.test(displayName.trim())) return displayName.trim()
  return normalized.replace(/\s+/g, '-')
}

function defaultRow(taskType: ModelTaskType): ModelRouting {
  const row = demoModelRouting.find((r) => r.taskType === taskType)
  if (row) return row
  const defaultModel = QUALITY_TASKS.has(taskType) ? OPENAI_MODEL_QUALITY : OPENAI_MODEL
  return {
    taskType,
    assignedModel: defaultModel,
    fallbackModel: OPENAI_MODEL,
    temperature: 0.7,
    maxTokens: 2048,
    costEstimate: '—',
    qualityPriority: 'balanced',
  }
}

/** Resolve model + params for a task from workspace routing (or sensible defaults). */
export function resolveTaskModel(
  taskType: ModelTaskType,
  routing?: ModelRouting[],
): TaskModelConfig {
  const table = routing?.length ? routing : demoModelRouting
  const row = table.find((r) => r.taskType === taskType) ?? defaultRow(taskType)
  const model = modelDisplayNameToId(row.assignedModel)
  const fallbackModel = row.fallbackModel
    ? modelDisplayNameToId(row.fallbackModel)
    : undefined
  const modelChain = buildModelChain({
    model,
    fallbackModel,
    taskType,
    preferQuality: QUALITY_TASKS.has(taskType),
  })

  return {
    taskType,
    model,
    fallbackModel: fallbackModel && fallbackModel !== model ? fallbackModel : undefined,
    modelChain,
    assignedModel: row.assignedModel,
    temperature: row.temperature,
    maxTokens: row.maxTokens,
  }
}

/** Kimi / PixVerse model IDs from routing table + env overrides. */
export function resolveMediaModel(taskType: typeof MODEL_TASK.IMAGE_GENERATION | typeof MODEL_TASK.VIDEO_GENERATION, routing?: ModelRouting[]) {
  const config = resolveTaskModel(taskType, routing)
  if (taskType === MODEL_TASK.IMAGE_GENERATION) {
    const envModel = process.env.OPENAI_IMAGE_MODEL?.trim()
    return envModel ? normalizeOpenAIImageModel(envModel) : OPENAI_IMAGE_MODEL || config.model || KIMI_MODEL
  }
  return process.env.PIXVERSE_MODEL?.trim() || config.model || 'v4.5'
}

/** Agent id → routing task type for syncing assignedModel labels. */
export const AGENT_TASK_MAP: Record<string, ModelTaskType> = {
  research: MODEL_TASK.MARKET_RESEARCH,
  strategy: MODEL_TASK.CONTENT_GENERATION,
  content: MODEL_TASK.CONTENT_GENERATION,
  brandtheme: MODEL_TASK.CONTENT_GENERATION,
  video: MODEL_TASK.VIDEO_SCRIPTS,
  safety: MODEL_TASK.BRAND_SAFETY,
  leadfinder: MODEL_TASK.LEAD_SCORING,
  outreach: MODEL_TASK.OUTREACH_WRITING,
  analytics: MODEL_TASK.ANALYTICS_SUMMARY,
}

export function assignedModelLabel(agentId: string, routing?: ModelRouting[]): string {
  const taskType = AGENT_TASK_MAP[agentId]
  if (!taskType) return OPENAI_MODEL
  return resolveTaskModel(taskType, routing).assignedModel
}
