import { hasOpenRouter } from '@/lib/ai/openrouter'
import { hasPixverse, type PixverseModel } from '@/lib/ai/pixverse'
import { modelDisplayNameToId, MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import type {
  OpenRouterVideoModelId,
  OpenRouterVideoResolutionId,
  VideoProvider,
} from '@/lib/models/media-options'
import { normalizeOpenRouterVideoModel } from '@/lib/models/media-options'
import type { ModelRouting } from '@/types'

/** Best-first OpenRouter video stack — tried before PixVerse. */
export const DEFAULT_OPENROUTER_VIDEO_CHAIN: OpenRouterVideoModelId[] = [
  'kwaivgi/kling-v3.0-pro',
  'openai/sora-2-pro',
  'google/veo-3.1',
  'google/veo-3.1-fast',
  'google/veo-3.1-lite',
  'bytedance/seedance-2.0',
  'bytedance/seedance-1-5-pro',
  'alibaba/wan-2.7',
  'alibaba/wan-2.6',
  'kwaivgi/kling-v3.0-std',
]

/** Best-first PixVerse stack — last resort when OpenRouter fails or is unavailable. */
export const DEFAULT_PIXVERSE_VIDEO_CHAIN: PixverseModel[] = ['v6', 'v5.5', 'v5', 'v4.5']

export interface VideoLayerStep {
  provider: 'openrouter' | 'pixverse'
  model: string
}

function parseCommaList(raw?: string): string[] {
  return (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function pushUnique(chain: string[], model?: string): void {
  const normalized = model?.trim() ? normalizeOpenRouterVideoModel(model.trim()) : undefined
  if (!normalized || chain.includes(normalized)) return
  chain.push(normalized)
}

/** `layered` (default) | `openrouter` | `pixverse` — from VIDEO_LAYER env. */
export function defaultVideoLayerMode(): VideoProvider {
  const env = process.env.VIDEO_LAYER?.trim().toLowerCase()
  if (env === 'openrouter' || env === 'openrouter-only') return 'openrouter'
  if (env === 'pixverse' || env === 'pixverse-only') return 'pixverse'
  return 'layered'
}

export function defaultOpenRouterVideoResolution(): OpenRouterVideoResolutionId {
  const env = process.env.OPENROUTER_VIDEO_RESOLUTION?.trim().toLowerCase()
  if (env === '720p' || env === '1080p') return env
  return '1080p'
}

export function defaultOpenRouterGenerateAudio(): boolean {
  return process.env.OPENROUTER_VIDEO_GENERATE_AUDIO?.trim().toLowerCase() === 'true'
}

export function buildOpenRouterVideoChain(preferredModel?: string, modelRouting?: ModelRouting[]): string[] {
  const chain: string[] = []
  const videoConfig = resolveTaskModel(MODEL_TASK.VIDEO_GENERATION, modelRouting)

  pushUnique(chain, preferredModel)
  pushUnique(chain, process.env.OPENROUTER_VIDEO_MODEL?.trim())
  for (const m of parseCommaList(process.env.OPENROUTER_VIDEO_MODELS)) pushUnique(chain, m)
  pushUnique(chain, modelDisplayNameToId(videoConfig.model))
  if (videoConfig.fallbackModel) pushUnique(chain, modelDisplayNameToId(videoConfig.fallbackModel))
  for (const m of DEFAULT_OPENROUTER_VIDEO_CHAIN) pushUnique(chain, m)

  return chain
}

export function buildPixverseVideoChain(preferredModel?: string, modelRouting?: ModelRouting[]): PixverseModel[] {
  const chain: PixverseModel[] = []
  const videoConfig = resolveTaskModel(MODEL_TASK.VIDEO_GENERATION, modelRouting)
  const valid = new Set<PixverseModel>(['v4.5', 'v5', 'v5.5', 'v6'])

  const push = (model?: string) => {
    const id = model?.trim()
    if (!id || !valid.has(id as PixverseModel) || chain.includes(id as PixverseModel)) return
    chain.push(id as PixverseModel)
  }

  push(preferredModel)
  push(process.env.PIXVERSE_MODEL?.trim())
  for (const m of parseCommaList(process.env.PIXVERSE_VIDEO_MODELS)) push(m)
  if (videoConfig.fallbackModel) push(modelDisplayNameToId(videoConfig.fallbackModel))
  push(modelDisplayNameToId(videoConfig.model))
  for (const m of DEFAULT_PIXVERSE_VIDEO_CHAIN) push(m)

  return chain
}

/** Full layered chain: OpenRouter models first, PixVerse last. */
export function buildVideoLayerChain(input?: {
  mode?: VideoProvider
  preferredOpenRouterModel?: string
  preferredPixverseModel?: string
  modelRouting?: ModelRouting[]
}): VideoLayerStep[] {
  const mode = input?.mode || defaultVideoLayerMode()
  const steps: VideoLayerStep[] = []

  if ((mode === 'layered' || mode === 'openrouter') && hasOpenRouter()) {
    for (const model of buildOpenRouterVideoChain(input?.preferredOpenRouterModel, input?.modelRouting)) {
      steps.push({ provider: 'openrouter', model })
    }
  }

  if ((mode === 'layered' || mode === 'pixverse') && hasPixverse()) {
    for (const model of buildPixverseVideoChain(input?.preferredPixverseModel, input?.modelRouting)) {
      steps.push({ provider: 'pixverse', model })
    }
  }

  return steps
}

export function videoLayerSummary(): {
  mode: VideoProvider
  openRouterChain: string[]
  pixverseChain: PixverseModel[]
  resolution: OpenRouterVideoResolutionId
  generateAudio: boolean
} {
  return {
    mode: defaultVideoLayerMode(),
    openRouterChain: buildOpenRouterVideoChain(),
    pixverseChain: buildPixverseVideoChain(),
    resolution: defaultOpenRouterVideoResolution(),
    generateAudio: defaultOpenRouterGenerateAudio(),
  }
}
