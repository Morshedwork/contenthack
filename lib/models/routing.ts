import { demoModelRouting } from '@/lib/demo/data'
import { KIMI_MODEL, hasKimi } from '@/lib/ai/kimi'
import { OPENAI_MODEL, OPENAI_MODEL_QUALITY, hasOpenAI } from '@/lib/ai/openai'
import { OPENAI_IMAGE_MODEL, normalizeOpenAIImageModel } from '@/lib/ai/openai-image'
import { hasOpenRouter } from '@/lib/ai/openrouter'
import {
  DEFAULT_OPENROUTER_TEXT_CHAIN,
  DEFAULT_OPENROUTER_TEXT_MODEL,
  OPENROUTER_TEXT_QUALITY_CHAIN,
  OPENROUTER_TEXT_SPEED_CHAIN,
  isOpenRouterTextModel,
} from '@/lib/models/openrouter-text'
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
  'krea 2 medium turbo': 'krea/krea-2-medium-turbo',
  'nano banana 2 lite': 'google/gemini-3.1-flash-lite-image',
  'flux.2 pro': 'black-forest-labs/flux.2-pro',
  'flux 2 pro': 'black-forest-labs/flux.2-pro',
  'llama 4 maverick': 'meta-llama/llama-4-maverick',
  'llama 4 scout': 'meta-llama/llama-4-scout',
  'llama 3.3 70b': 'meta-llama/llama-3.3-70b-instruct',
  'deepseek v3.2': 'deepseek/deepseek-v3.2',
  'deepseek r1': 'deepseek/deepseek-r1',
  'qwen3 235b': 'qwen/qwen3-235b-a22b-2507',
  'qwen3 next 80b': 'qwen/qwen3-next-80b-a3b-instruct',
  'mistral small 3.2': 'mistralai/mistral-small-3.2-24b-instruct',
  'mistral nemo': 'mistralai/mistral-nemo',
  'gemma 3 27b': 'google/gemma-3-27b-it',
  'glm 4.7 flash': 'z-ai/glm-4.7-flash',
  'hermes 4 70b': 'nousresearch/hermes-4-70b',
  'olmo 3 32b think': 'mistralai/mixtral-8x22b-instruct',
  'mixtral 8x22b': 'mistralai/mixtral-8x22b-instruct',
  'gemma 4 31b': 'google/gemma-4-31b-it',
}

const QUALITY_TASKS = new Set<ModelTaskType>([
  MODEL_TASK.MARKET_RESEARCH,
  MODEL_TASK.BRAND_SAFETY,
  MODEL_TASK.OUTREACH_WRITING,
])

const SPEED_TASKS = new Set<ModelTaskType>([
  MODEL_TASK.LEAD_SCORING,
  MODEL_TASK.ANALYTICS_SUMMARY,
])

const KIMI_MODEL_PREFIX = /^kimi/i

function parseCommaList(raw?: string): string[] {
  return (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function defaultOpenRouterTextModel(): string {
  const env = process.env.OPENROUTER_TEXT_MODEL?.trim()
  if (env) return env
  return DEFAULT_OPENROUTER_TEXT_MODEL
}

function isTextModelAvailable(modelId: string): boolean {
  const id = modelId.trim()
  if (KIMI_MODEL_PREFIX.test(id) && !id.includes('/')) return hasKimi()
  if (id.includes('/') || isOpenRouterTextModel(id)) return hasOpenRouter()
  return hasOpenAI()
}

function pushUniqueModel(chain: string[], model?: string): void {
  if (!model?.trim()) return
  const id = modelDisplayNameToId(model.trim())
  if (!chain.includes(id) && isTextModelAvailable(id)) chain.push(id)
}

/**
 * Multi-layer text fallback chain.
 *
 * Layer A — task primary + task fallback (Model Hub / caller)
 * Layer B — OpenRouter quality OR speed OR balanced OSS stack
 * Layer C — env OPENROUTER_TEXT_MODELS overrides
 * Layer D — Kimi (Moonshot)
 * Layer E — OpenAI (only if enabled + billed)
 */
export function buildModelChain(input: {
  model?: string
  fallbackModel?: string
  taskType?: ModelTaskType
  preferQuality?: boolean
}): string[] {
  const chain: string[] = []
  const preferQuality = input.preferQuality || (input.taskType ? QUALITY_TASKS.has(input.taskType) : false)
  const preferSpeed = input.taskType ? SPEED_TASKS.has(input.taskType) : false

  // Layer A — explicit task routing
  pushUniqueModel(chain, input.model)
  pushUniqueModel(chain, input.fallbackModel)

  // Layer B — OpenRouter open-source stacks
  if (hasOpenRouter()) {
    pushUniqueModel(chain, defaultOpenRouterTextModel())
    for (const m of parseCommaList(process.env.OPENROUTER_TEXT_MODELS)) pushUniqueModel(chain, m)

    const openRouterTier = preferQuality
      ? OPENROUTER_TEXT_QUALITY_CHAIN
      : preferSpeed
        ? OPENROUTER_TEXT_SPEED_CHAIN
        : DEFAULT_OPENROUTER_TEXT_CHAIN

    for (const m of openRouterTier) pushUniqueModel(chain, m)
    // Always append the other tiers as deeper safety nets
    if (preferQuality) {
      for (const m of DEFAULT_OPENROUTER_TEXT_CHAIN) pushUniqueModel(chain, m)
      for (const m of OPENROUTER_TEXT_SPEED_CHAIN) pushUniqueModel(chain, m)
    } else if (preferSpeed) {
      for (const m of DEFAULT_OPENROUTER_TEXT_CHAIN) pushUniqueModel(chain, m)
      for (const m of OPENROUTER_TEXT_QUALITY_CHAIN) pushUniqueModel(chain, m)
    } else {
      for (const m of OPENROUTER_TEXT_SPEED_CHAIN) pushUniqueModel(chain, m)
    }
  }

  // Layer D — Kimi
  if (hasKimi()) pushUniqueModel(chain, KIMI_MODEL)

  // Layer E — OpenAI (skipped when OPENAI_DISABLED / no quota)
  if (hasOpenAI()) {
    if (preferQuality) pushUniqueModel(chain, OPENAI_MODEL_QUALITY)
    pushUniqueModel(chain, OPENAI_MODEL)
  }

  return chain
}

/** Human-readable summary of the live text fallback stack. */
export function textLayerSummary(taskType?: ModelTaskType): {
  layers: Array<{ name: string; models: string[] }>
  fullChain: string[]
} {
  const fullChain = buildModelChain({
    taskType,
    preferQuality: taskType ? QUALITY_TASKS.has(taskType) : false,
  })

  const openrouter = fullChain.filter((m) => m.includes('/'))
  const kimi = fullChain.filter((m) => /^kimi/i.test(m) && !m.includes('/'))
  const openai = fullChain.filter((m) => !m.includes('/') && !/^kimi/i.test(m))

  return {
    layers: [
      { name: 'OpenRouter OSS', models: openrouter },
      { name: 'Kimi', models: kimi },
      { name: 'OpenAI', models: openai },
    ].filter((l) => l.models.length > 0),
    fullChain,
  }
}

function normalizeModelName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Map Model Hub display names to API model IDs. */
export function modelDisplayNameToId(displayName: string): string {
  const normalized = normalizeModelName(displayName)
  if (MODEL_ALIAS_TO_ID[normalized]) return MODEL_ALIAS_TO_ID[normalized]
  if (/^[a-z0-9][a-z0-9./:_-]*$/i.test(displayName.trim())) return displayName.trim()
  return normalized.replace(/\s+/g, '-')
}

function defaultTextModelForTask(taskType: ModelTaskType): string {
  if (hasOpenRouter()) return defaultOpenRouterTextModel()
  if (hasOpenAI()) return QUALITY_TASKS.has(taskType) ? OPENAI_MODEL_QUALITY : OPENAI_MODEL
  return KIMI_MODEL
}

function defaultRow(taskType: ModelTaskType): ModelRouting {
  const row = demoModelRouting.find((r) => r.taskType === taskType)
  if (row) return row
  const defaultModel = defaultTextModelForTask(taskType)
  return {
    taskType,
    assignedModel: defaultModel,
    fallbackModel: hasOpenRouter() ? 'meta-llama/llama-4-scout' : OPENAI_MODEL,
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
  if (!taskType) return defaultOpenRouterTextModel()
  return resolveTaskModel(taskType, routing).assignedModel
}
