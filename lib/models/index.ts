import { demoModels, demoModelRouting } from '@/lib/demo/data'
import { hasOpenAI } from '@/lib/ai/openai'
import { hasOpenRouter } from '@/lib/ai/openrouter'
import type { AIModel, ModelRouting } from '@/types'

export {
  MODEL_TASK,
  resolveTaskModel,
  resolveMediaModel,
  assignedModelLabel,
  modelDisplayNameToId,
  buildModelChain,
  textLayerSummary,
  AGENT_TASK_MAP,
  type TaskModelConfig,
  type ModelTaskType,
} from './routing'

export {
  IMAGE_PROMPT_MODELS,
  IMAGE_RENDER_MODELS,
  POLLINATIONS_RENDER_MODELS,
  OPENAI_RENDER_MODELS,
  IMAGE_ASPECT_RATIOS,
  OPENROUTER_RENDER_MODELS,
  OPENROUTER_VIDEO_MODELS,
  OPENROUTER_BUDGET_IMAGE_MODELS,
  OPENROUTER_BUDGET_VIDEO_MODELS,
  DEFAULT_OPENROUTER_IMAGE_CHAIN,
  OPENROUTER_IMAGE_QUALITY_OPTIONS,
  OPENROUTER_IMAGE_RESOLUTION_OPTIONS,
  OPENROUTER_VIDEO_RESOLUTIONS,
  OPENROUTER_VIDEO_DURATIONS,
  PIXVERSE_VIDEO_MODELS,
  VIDEO_DURATIONS,
  VIDEO_QUALITIES,
  VIDEO_ASPECT_RATIOS,
  GPT_IMAGE_QUALITY_OPTIONS,
  GPT_IMAGE_2_RESOLUTION_OPTIONS,
  GPT_IMAGE_2_THINKING_OPTIONS,
  getImagePromptProvider,
  getImageRenderProvider,
  type ImagePromptModelId,
  type ImageRenderModelId,
  type ImageAspectRatioId,
  type GptImageQualityId,
  type GptImage2ResolutionId,
  type GptImage2ThinkingId,
  type OpenRouterImageQualityId,
  type OpenRouterImageResolutionId,
  type OpenRouterVideoModelId,
  type VideoDurationSec,
  type VideoProvider,
} from './media-options'

export {
  OPENROUTER_TEXT_MODELS,
  DEFAULT_OPENROUTER_TEXT_MODEL,
  DEFAULT_OPENROUTER_TEXT_CHAIN,
  isOpenRouterTextModel,
  type OpenRouterTextModelId,
} from './openrouter-text'

export function getAvailableModels(): AIModel[] {
  let filtered = demoModels.filter((m) => m.id !== 'mock')
  if (!hasOpenAI()) filtered = filtered.filter((m) => m.provider !== 'OpenAI')
  if (!hasOpenRouter()) filtered = filtered.filter((m) => m.provider !== 'OpenRouter')

  const preferredDefault = hasOpenRouter()
    ? 'deepseek/deepseek-v3.2'
    : hasOpenAI()
      ? 'gpt-4o'
      : 'kimi-k2.5'

  return filtered.map((m) => ({
    ...m,
    isDefault: m.id === preferredDefault,
  }))
}

export function getModels(): AIModel[] {
  return getAvailableModels()
}

export function getModelRouting(): ModelRouting[] {
  return demoModelRouting
}

export function getModelById(id: string): AIModel | undefined {
  return getModels().find((m) => m.id === id)
}

export function getModelPerformance() {
  return {
    avgResponseTime: '1.2s',
    estimatedCost: '$12.40',
    successRate: 97.2,
    contentQualityScore: 91,
    leadQualityScore: 86,
  }
}
