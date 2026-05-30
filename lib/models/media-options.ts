import type { PixverseAspectRatio, PixverseModel, PixverseQuality } from '@/lib/ai/pixverse'
import type { OpenAIImageModelId } from '@/lib/ai/openai-image'
import type { PollinationsRenderModel } from '@/lib/ai/kimi'

export type ImagePromptProvider = 'kimi' | 'openai'
export type ImageRenderProvider = 'pollinations' | 'openai'

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

export const IMAGE_RENDER_MODELS = [...POLLINATIONS_RENDER_MODELS, ...OPENAI_RENDER_MODELS] as const

export type PollinationsRenderModelId = (typeof POLLINATIONS_RENDER_MODELS)[number]['id']
export type OpenAIRenderModelId = (typeof OPENAI_RENDER_MODELS)[number]['id']
export type ImageRenderModelId = PollinationsRenderModelId | OpenAIRenderModelId

export const IMAGE_ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Landscape' },
  { id: '9:16', label: '9:16 Portrait' },
  { id: '4:3', label: '4:3 Standard' },
] as const

export type ImageAspectRatioId = (typeof IMAGE_ASPECT_RATIOS)[number]['id']

export const VIDEO_MODELS: { id: PixverseModel; label: string; description: string }[] = [
  { id: 'v4.5', label: 'PixVerse v4.5', description: 'Stable, cost-efficient' },
  { id: 'v5', label: 'PixVerse v5', description: 'Improved motion' },
  { id: 'v5.5', label: 'PixVerse v5.5', description: 'Enhanced detail' },
  { id: 'v6', label: 'PixVerse v6', description: 'Up to 15s, 1080p, audio' },
]

export const VIDEO_DURATIONS = [5, 8, 10, 15] as const
export type VideoDurationSec = (typeof VIDEO_DURATIONS)[number]

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

export function isValidVideoModel(id: string): id is PixverseModel {
  return VIDEO_MODELS.some((m) => m.id === id)
}

export function isValidVideoDuration(n: number): n is VideoDurationSec {
  return VIDEO_DURATIONS.includes(n as VideoDurationSec)
}

export function isValidVideoQuality(id: string): id is PixverseQuality {
  return VIDEO_QUALITIES.some((m) => m.id === id)
}

export function isValidVideoAspectRatio(id: string): id is PixverseAspectRatio {
  return VIDEO_ASPECT_RATIOS.some((m) => m.id === id)
}
