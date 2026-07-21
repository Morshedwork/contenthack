import type { PixverseAspectRatio, PixverseModel, PixverseQuality } from '@/lib/ai/pixverse'
import type { OpenAIImageModelId } from '@/lib/ai/openai-image'
import type { PollinationsRenderModel } from '@/lib/ai/kimi'

export type ImagePromptProvider = 'kimi' | 'openai'
export type ImageRenderProvider = 'pollinations' | 'openai' | 'openrouter'
export type VideoProvider = 'layered' | 'openrouter' | 'pixverse'

/** Models used to enhance image prompts before rendering. */
export const IMAGE_PROMPT_MODELS = [
  { id: 'kimi-k2.5', label: 'Kimi K2.5', description: 'Moonshot — best prompt quality', provider: 'kimi' as const },
  { id: 'kimi-k2', label: 'Kimi K2', description: 'Moonshot — faster prompts', provider: 'kimi' as const },
  { id: 'gpt-4o', label: 'GPT-4o', description: 'OpenAI — high-quality prompts', provider: 'openai' as const },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', description: 'OpenAI — fast prompts', provider: 'openai' as const },
] as const

export type ImagePromptModelId = (typeof IMAGE_PROMPT_MODELS)[number]['id']

export const POLLINATIONS_RENDER_MODELS = [
  { id: 'flux', label: 'Flux', description: 'Balanced quality & speed', provider: 'pollinations' as const },
  { id: 'flux-2-dev', label: 'Flux 2 Dev', description: 'Next-gen Flux', provider: 'pollinations' as const },
  { id: 'klein', label: 'Klein', description: 'Fast 4B model', provider: 'pollinations' as const },
  { id: 'klein-large', label: 'Klein Large', description: 'Higher quality 9B', provider: 'pollinations' as const },
  { id: 'zimage', label: 'Z-Image', description: 'Fast generation', provider: 'pollinations' as const },
  { id: 'seedream', label: 'Seedream', description: 'Stylized creatives', provider: 'pollinations' as const },
] as const

export const OPENAI_RENDER_MODELS = [
  { id: 'gpt-image-2', label: 'GPT Image 2.0', description: 'Latest flagship — 2K/4K, reasoning mode', provider: 'openai' as const },
  { id: 'gpt-image-1.5', label: 'GPT Image 1.5', description: 'Best quality — precise edits, brand-safe', provider: 'openai' as const },
  { id: 'gpt-image-1', label: 'GPT Image 1', description: 'Strong all-round OpenAI image model', provider: 'openai' as const },
  { id: 'gpt-image-1-mini', label: 'GPT Image 1 Mini', description: 'Fast & cost-efficient via API key', provider: 'openai' as const },
  { id: 'dall-e-3', label: 'DALL·E 3', description: 'Classic OpenAI — HD option', provider: 'openai' as const },
  { id: 'dall-e-2', label: 'DALL·E 2', description: 'Fast, economical', provider: 'openai' as const },
] as const

/**
 * OpenRouter image models — one API key. IDs match live OpenRouter image API.
 * Note: OpenRouter has no `:free` dedicated image models; "budget" = lowest paid cost.
 * True $0 images use Pollinations (POLLINATIONS_RENDER_MODELS).
 */
export const OPENROUTER_RENDER_MODELS = [
  // Budget / low-cost
  { id: 'krea/krea-2-medium-turbo', label: 'Krea 2 Medium Turbo', description: 'Budget — fastest Krea drafts', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'krea/krea-2-medium', label: 'Krea 2 Medium', description: 'Budget — balanced Krea', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'krea/krea-2-large', label: 'Krea 2 Large', description: 'Budget — higher-quality Krea', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'google/gemini-3.1-flash-lite-image', label: 'Nano Banana 2 Lite', description: 'Budget — cheapest Gemini image tokens', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'google/gemini-2.5-flash-image', label: 'Nano Banana (2.5 Flash)', description: 'Budget — fast Gemini image', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'black-forest-labs/flux.2-klein-4b', label: 'FLUX.2 Klein 4B', description: 'Budget — cheapest FLUX', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'sourceful/riverflow-v2.5-fast', label: 'Riverflow V2.5 Fast', description: 'Budget — fast Sourceful', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'sourceful/riverflow-v2-fast', label: 'Riverflow V2 Fast', description: 'Budget — Sourceful V2 fast', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'recraft/recraft-v4.1-utility', label: 'Recraft V4.1 Utility', description: 'Budget — ~1K general purpose', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'recraft/recraft-v3', label: 'Recraft V3', description: 'Budget — classic creatives', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'microsoft/mai-image-2.5', label: 'MAI-Image 2.5', description: 'Budget — Microsoft Azure image', provider: 'openrouter' as const, tier: 'budget' as const },
  // Standard
  { id: 'bytedance-seed/seedream-4.5', label: 'Seedream 4.5', description: 'ByteDance — high quality text-to-image', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'google/gemini-3.1-flash-image', label: 'Nano Banana 2', description: 'Gemini 3.1 Flash — Pro quality at speed', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'google/gemini-3.1-flash-image-preview', label: 'Nano Banana 2 Preview', description: 'Gemini 3.1 Flash image preview', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'google/gemini-3-pro-image', label: 'Nano Banana Pro', description: 'Gemini 3 Pro — best Gemini image', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'black-forest-labs/flux.2-pro', label: 'FLUX.2 Pro', description: 'Black Forest Labs — cinematic', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'black-forest-labs/flux.2-flex', label: 'FLUX.2 Flex', description: 'Black Forest Labs — typography & fine detail', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'x-ai/grok-imagine-image-quality', label: 'Grok Imagine', description: 'xAI — photorealistic 1K/2K', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'sourceful/riverflow-v2.5-pro', label: 'Riverflow V2.5 Pro', description: 'Sourceful — top-tier control', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'sourceful/riverflow-v2-pro', label: 'Riverflow V2 Pro', description: 'Sourceful — V2 pro quality', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'recraft/recraft-v4.1-utility-pro', label: 'Recraft V4.1 Utility Pro', description: 'Recraft — ~2K general purpose', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'recraft/recraft-v4.1', label: 'Recraft V4.1', description: 'Recraft — general purpose', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'recraft/recraft-v4.1-pro-vector', label: 'Recraft V4.1 Vector', description: 'Recraft — SVG vector output', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'openai/gpt-image-1-mini', label: 'GPT Image 1 Mini', description: 'OpenAI — fast & cost-efficient', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'openai/gpt-5-image-mini', label: 'GPT-5 Image Mini', description: 'OpenAI — efficient GPT-5 image', provider: 'openrouter' as const, tier: 'standard' as const },
  // Premium
  { id: 'black-forest-labs/flux.2-max', label: 'FLUX.2 Max', description: 'Black Forest Labs — top-tier quality', provider: 'openrouter' as const, tier: 'premium' as const },
  { id: 'google/gemini-3-pro-image-preview', label: 'Nano Banana Pro Preview', description: 'Gemini 3 Pro image preview', provider: 'openrouter' as const, tier: 'premium' as const },
  { id: 'openai/gpt-image-2', label: 'GPT Image 2', description: 'OpenAI — latest flagship via OpenRouter', provider: 'openrouter' as const, tier: 'premium' as const },
  { id: 'openai/gpt-5.4-image-2', label: 'GPT-5.4 Image 2', description: 'OpenAI — GPT-5.4 image generation', provider: 'openrouter' as const, tier: 'premium' as const },
  { id: 'openai/gpt-image-1', label: 'GPT Image 1', description: 'OpenAI — brand-safe generation', provider: 'openrouter' as const, tier: 'premium' as const },
  { id: 'openai/gpt-5-image', label: 'GPT-5 Image', description: 'OpenAI — multimodal GPT-5 + image', provider: 'openrouter' as const, tier: 'premium' as const },
] as const

/** Budget-first OpenRouter image fallbacks (then Pollinations Flux as last free resort). */
export const DEFAULT_OPENROUTER_IMAGE_CHAIN = [
  'krea/krea-2-medium-turbo',
  'google/gemini-3.1-flash-lite-image',
  'black-forest-labs/flux.2-klein-4b',
  'sourceful/riverflow-v2.5-fast',
  'google/gemini-2.5-flash-image',
  'recraft/recraft-v4.1-utility',
  'bytedance-seed/seedream-4.5',
  'black-forest-labs/flux.2-pro',
] as const

export const OPENROUTER_BUDGET_IMAGE_MODELS = OPENROUTER_RENDER_MODELS.filter((m) => m.tier === 'budget')

/** Env + preferred + default budget chain for OpenRouter image fallbacks. */
export function buildOpenRouterImageChain(preferredModel?: string): string[] {
  const chain: string[] = []
  const push = (model?: string) => {
    const id = model?.trim()
    if (!id || !OPENROUTER_RENDER_MODELS.some((m) => m.id === id) || chain.includes(id)) return
    chain.push(id)
  }
  push(preferredModel)
  push(process.env.OPENROUTER_IMAGE_MODEL)
  for (const m of (process.env.OPENROUTER_IMAGE_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    push(m)
  }
  for (const m of DEFAULT_OPENROUTER_IMAGE_CHAIN) push(m)
  return chain
}


export const OPENROUTER_IMAGE_RESOLUTION_OPTIONS = [
  { id: '1k', label: '1K', description: 'Fast — social posts' },
  { id: '2k', label: '2K', description: 'Balanced marketing assets' },
  { id: '4k', label: '4K', description: 'Maximum detail' },
] as const

export const OPENROUTER_IMAGE_QUALITY_OPTIONS = [
  { id: 'auto', label: 'Auto', description: 'Provider default' },
  { id: 'low', label: 'Low', description: 'Fast drafts' },
  { id: 'medium', label: 'Medium', description: 'Balanced' },
  { id: 'high', label: 'High', description: 'Best quality' },
] as const

export const GPT_IMAGE_QUALITY_OPTIONS = [
  { id: 'low', label: 'Low', description: 'Fast drafts & iterations' },
  { id: 'medium', label: 'Medium', description: 'Balanced quality & speed' },
  { id: 'high', label: 'High', description: 'Best detail for final assets' },
] as const

export const GPT_IMAGE_2_RESOLUTION_OPTIONS = [
  { id: '1k', label: '1K (1024px)', description: 'Fastest — social posts' },
  { id: '2k', label: '2K (2048px)', description: 'Default — sharp marketing assets' },
  { id: '4k', label: '4K (up to 3840px)', description: 'Maximum detail — print & hero images' },
] as const

export const GPT_IMAGE_2_THINKING_OPTIONS = [
  { id: 'off', label: 'Off', description: 'Fastest generation' },
  { id: 'low', label: 'Low', description: 'Light reasoning before render' },
  { id: 'medium', label: 'Medium', description: 'Balanced prompt planning' },
  { id: 'high', label: 'High', description: 'Best for complex compositions' },
] as const

export type GptImageQualityId = (typeof GPT_IMAGE_QUALITY_OPTIONS)[number]['id']
export type GptImage2ResolutionId = (typeof GPT_IMAGE_2_RESOLUTION_OPTIONS)[number]['id']
export type GptImage2ThinkingId = (typeof GPT_IMAGE_2_THINKING_OPTIONS)[number]['id']
export type OpenRouterImageResolutionId = (typeof OPENROUTER_IMAGE_RESOLUTION_OPTIONS)[number]['id']
export type OpenRouterImageQualityId = (typeof OPENROUTER_IMAGE_QUALITY_OPTIONS)[number]['id']

export const IMAGE_RENDER_MODELS = [
  ...POLLINATIONS_RENDER_MODELS,
  ...OPENAI_RENDER_MODELS,
  ...OPENROUTER_RENDER_MODELS,
] as const

export type PollinationsRenderModelId = (typeof POLLINATIONS_RENDER_MODELS)[number]['id']
export type OpenAIRenderModelId = (typeof OPENAI_RENDER_MODELS)[number]['id']
export type OpenRouterRenderModelId = (typeof OPENROUTER_RENDER_MODELS)[number]['id']
export type ImageRenderModelId = PollinationsRenderModelId | OpenAIRenderModelId | OpenRouterRenderModelId

export const IMAGE_ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Landscape' },
  { id: '9:16', label: '9:16 Portrait' },
  { id: '4:3', label: '4:3 Standard' },
] as const

export type ImageAspectRatioId = (typeof IMAGE_ASPECT_RATIOS)[number]['id']

export const PIXVERSE_VIDEO_MODELS: { id: PixverseModel; label: string; description: string; provider: 'pixverse' }[] = [
  { id: 'v4.5', label: 'PixVerse v4.5', description: 'Stable, cost-efficient', provider: 'pixverse' },
  { id: 'v5', label: 'PixVerse v5', description: 'Improved motion', provider: 'pixverse' },
  { id: 'v5.5', label: 'PixVerse v5.5', description: 'Enhanced detail', provider: 'pixverse' },
  { id: 'v6', label: 'PixVerse v6', description: 'Up to 15s, 1080p, audio', provider: 'pixverse' },
]

/** @deprecated Use PIXVERSE_VIDEO_MODELS */
export const VIDEO_MODELS = PIXVERSE_VIDEO_MODELS

export const OPENROUTER_VIDEO_MODELS = [
  // Budget / lowest OpenRouter video cost
  { id: 'bytedance/seedance-1-5-pro', label: 'Seedance 1.5 Pro', description: 'Budget — cheapest OpenRouter video tokens', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'bytedance/seedance-2.0-fast', label: 'Seedance 2.0 Fast', description: 'Budget — fast low-cost Seedance', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'alibaba/wan-2.6', label: 'Wan 2.6', description: 'Budget — ~$0.04/s at 480p', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'google/veo-3.1-lite', label: 'Veo 3.1 Lite', description: 'Budget — cheapest Veo (no audio cheaper)', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'kwaivgi/kling-v3.0-std', label: 'Kling 3.0 Standard', description: 'Budget — Kling std tier', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'x-ai/grok-imagine-video', label: 'Grok Imagine Video', description: 'Budget — xAI fast 1–15s clips', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'minimax/hailuo-2.3', label: 'Hailuo 2.3', description: 'Budget — MiniMax 1080p', provider: 'openrouter' as const, tier: 'budget' as const },
  { id: 'alibaba/happyhorse-1.0', label: 'HappyHorse 1.0', description: 'Budget — Alibaba text/image-to-video', provider: 'openrouter' as const, tier: 'budget' as const },
  // Standard
  { id: 'bytedance/seedance-2.0', label: 'Seedance 2.0', description: 'ByteDance — character consistency, up to 4K', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'google/veo-3.1-fast', label: 'Veo 3.1 Fast', description: 'Google — balanced speed & quality', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'kwaivgi/kling-v3.0-pro', label: 'Kling 3.0 Pro', description: 'Kuaishou — premium quality, native audio', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'kwaivgi/kling-video-o1', label: 'Kling Video O1', description: 'Kuaishou — cinematic, first/last frame', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'alibaba/wan-2.7', label: 'Wan 2.7', description: 'Alibaba — reference-to-video, native audio', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'alibaba/happyhorse-1.1', label: 'HappyHorse 1.1', description: 'Alibaba — reference image video', provider: 'openrouter' as const, tier: 'standard' as const },
  { id: 'x-ai/grok-imagine-video-1.5', label: 'Grok Imagine Video 1.5', description: 'xAI — newer Grok video', provider: 'openrouter' as const, tier: 'standard' as const },
  // Premium
  { id: 'google/veo-3.1', label: 'Veo 3.1', description: 'Google — max visual fidelity + audio', provider: 'openrouter' as const, tier: 'premium' as const },
  { id: 'openai/sora-2-pro', label: 'Sora 2 Pro', description: 'OpenAI — premium production quality', provider: 'openrouter' as const, tier: 'premium' as const },
] as const

export type OpenRouterVideoModelId = (typeof OPENROUTER_VIDEO_MODELS)[number]['id']

export const OPENROUTER_BUDGET_VIDEO_MODELS = OPENROUTER_VIDEO_MODELS.filter((m) => m.tier === 'budget')

/** Maps legacy/wrong slugs to current OpenRouter video model IDs. */
export const OPENROUTER_VIDEO_MODEL_ALIASES: Record<string, OpenRouterVideoModelId> = {
  'bytedance-seed/seedance-1.5': 'bytedance/seedance-1-5-pro',
  'wan/wan-2.6': 'alibaba/wan-2.6',
}

export const OPENROUTER_VIDEO_RESOLUTIONS = [
  { id: '720p', label: '720p HD' },
  { id: '1080p', label: '1080p Full HD' },
] as const

export type OpenRouterVideoResolutionId = (typeof OPENROUTER_VIDEO_RESOLUTIONS)[number]['id']

export const OPENROUTER_VIDEO_DURATIONS = [3, 4, 5, 6, 8, 10, 12, 15] as const
export type OpenRouterVideoDurationSec = (typeof OPENROUTER_VIDEO_DURATIONS)[number]

export const OPENROUTER_VIDEO_ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 Landscape' },
  { id: '9:16', label: '9:16 Reels / TikTok' },
  { id: '1:1', label: '1:1 Square' },
  { id: '4:3', label: '4:3 Standard' },
  { id: '3:4', label: '3:4 Portrait' },
] as const

/** PixVerse v4.5–v5.5: only 5s and 8s. v6 also supports 10s and 15s. */
export const VIDEO_DURATIONS_V45 = [5, 8] as const
export const VIDEO_DURATIONS_V6 = [5, 8, 10, 15] as const
export const VIDEO_DURATIONS = VIDEO_DURATIONS_V6
export type VideoDurationSec = (typeof VIDEO_DURATIONS_V6)[number]

export function getVideoDurationsForModel(model: PixverseModel): readonly VideoDurationSec[] {
  return model === 'v6' ? VIDEO_DURATIONS_V6 : VIDEO_DURATIONS_V45
}

/** PixVerse rejects 1080p at 8s — only 5s is allowed at that quality. */
export function normalizePixverseVideoParams(input: {
  model: PixverseModel
  duration: number
  quality: PixverseQuality
}): { duration: VideoDurationSec; quality: PixverseQuality; warnings: string[] } {
  const allowed = getVideoDurationsForModel(input.model)
  let duration = allowed.includes(input.duration as VideoDurationSec)
    ? (input.duration as VideoDurationSec)
    : allowed[0]
  let quality = input.quality
  const warnings: string[] = []

  if (duration !== input.duration) {
    warnings.push(
      `Duration ${input.duration}s is not supported on PixVerse ${input.model}; using ${duration}s.`,
    )
  }

  if (quality === '1080p' && duration === 8) {
    duration = 5
    warnings.push('1080p only supports 5 second videos on PixVerse; duration set to 5s.')
  }

  return { duration, quality, warnings }
}

export const VIDEO_QUALITIES: { id: PixverseQuality; label: string }[] = [
  { id: '360p', label: '360p' },
  { id: '540p', label: '540p (default)' },
  { id: '720p', label: '720p HD' },
  { id: '1080p', label: '1080p Full HD' },
]

export const VIDEO_ASPECT_RATIOS: { id: PixverseAspectRatio; label: string }[] = [
  { id: '16:9', label: '16:9 Landscape' },
  { id: '9:16', label: '9:16 Reels / TikTok' },
  { id: '1:1', label: '1:1 Square' },
  { id: '4:3', label: '4:3 Standard' },
  { id: '3:4', label: '3:4 Portrait' },
]

export function getImagePromptProvider(id: string): ImagePromptProvider | undefined {
  return IMAGE_PROMPT_MODELS.find((m) => m.id === id)?.provider
}

export function getImageRenderProvider(id: string): ImageRenderProvider | undefined {
  return IMAGE_RENDER_MODELS.find((m) => m.id === id)?.provider
}

export function isValidImagePromptModel(id: string): id is ImagePromptModelId {
  return IMAGE_PROMPT_MODELS.some((m) => m.id === id)
}

export function isValidImageRenderModel(id: string): id is ImageRenderModelId {
  return IMAGE_RENDER_MODELS.some((m) => m.id === id)
}

export function isPollinationsRenderModel(id: string): id is PollinationsRenderModelId {
  return POLLINATIONS_RENDER_MODELS.some((m) => m.id === id)
}

export function isOpenAIRenderModel(id: string): id is OpenAIRenderModelId {
  return OPENAI_RENDER_MODELS.some((m) => m.id === id)
}

export function isOpenRouterRenderModel(id: string): id is OpenRouterRenderModelId {
  return OPENROUTER_RENDER_MODELS.some((m) => m.id === id)
}

export function toOpenRouterImageModel(id: OpenRouterRenderModelId): string {
  return id
}

const GPT_IMAGE_RENDER_IDS = new Set(['gpt-image-1', 'gpt-image-1.5', 'gpt-image-1-mini', 'gpt-image-2'])

export function isGptImageRenderModel(id: string): boolean {
  return GPT_IMAGE_RENDER_IDS.has(id)
}

export function isGptImage2RenderModel(id: string): boolean {
  return id === 'gpt-image-2'
}

export function isValidGptImageQuality(id: string): id is GptImageQualityId {
  return GPT_IMAGE_QUALITY_OPTIONS.some((q) => q.id === id)
}

export function isValidGptImage2Resolution(id: string): id is GptImage2ResolutionId {
  return GPT_IMAGE_2_RESOLUTION_OPTIONS.some((r) => r.id === id)
}

export function isValidGptImage2Thinking(id: string): id is GptImage2ThinkingId {
  return GPT_IMAGE_2_THINKING_OPTIONS.some((t) => t.id === id)
}

export function toPollinationsModel(id: PollinationsRenderModelId): PollinationsRenderModel {
  return id as PollinationsRenderModel
}

export function toOpenAIImageModel(id: OpenAIRenderModelId): OpenAIImageModelId {
  return id as OpenAIImageModelId
}

export function isValidImageAspectRatio(id: string): id is ImageAspectRatioId {
  return IMAGE_ASPECT_RATIOS.some((m) => m.id === id)
}

export function isValidPixverseVideoModel(id: string): id is PixverseModel {
  return PIXVERSE_VIDEO_MODELS.some((m) => m.id === id)
}

/** @deprecated Use isValidPixverseVideoModel */
export function isValidVideoModel(id: string): id is PixverseModel {
  return isValidPixverseVideoModel(id)
}

export function normalizeOpenRouterVideoModel(id: string): string {
  const trimmed = id.trim()
  return OPENROUTER_VIDEO_MODEL_ALIASES[trimmed] ?? trimmed
}

export function isValidOpenRouterVideoModel(id: string): id is OpenRouterVideoModelId {
  const normalized = normalizeOpenRouterVideoModel(id)
  return OPENROUTER_VIDEO_MODELS.some((m) => m.id === normalized)
}

export function isValidOpenRouterVideoResolution(id: string): id is OpenRouterVideoResolutionId {
  return OPENROUTER_VIDEO_RESOLUTIONS.some((m) => m.id === id)
}

export function isValidOpenRouterVideoDuration(n: number): n is OpenRouterVideoDurationSec {
  return OPENROUTER_VIDEO_DURATIONS.includes(n as OpenRouterVideoDurationSec)
}

export function isValidOpenRouterImageResolution(id: string): id is OpenRouterImageResolutionId {
  return OPENROUTER_IMAGE_RESOLUTION_OPTIONS.some((m) => m.id === id)
}

export function isValidOpenRouterImageQuality(id: string): id is OpenRouterImageQualityId {
  return OPENROUTER_IMAGE_QUALITY_OPTIONS.some((m) => m.id === id)
}

export function isValidVideoProvider(id: string): id is VideoProvider {
  return id === 'layered' || id === 'pixverse' || id === 'openrouter'
}

export function isValidVideoDuration(n: number, model?: PixverseModel): n is VideoDurationSec {
  const allowed = model ? getVideoDurationsForModel(model) : VIDEO_DURATIONS_V6
  return allowed.includes(n as VideoDurationSec)
}

export function isValidVideoQuality(id: string): id is PixverseQuality {
  return VIDEO_QUALITIES.some((m) => m.id === id)
}

export function isValidVideoAspectRatio(id: string): id is PixverseAspectRatio {
  return VIDEO_ASPECT_RATIOS.some((m) => m.id === id)
}
