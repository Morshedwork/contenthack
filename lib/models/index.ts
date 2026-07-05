import { demoModels, demoModelRouting } from '@/lib/demo/data'
import type { AIModel, ModelRouting } from '@/types'

export {
  MODEL_TASK,
  resolveTaskModel,
  resolveMediaModel,
  assignedModelLabel,
  modelDisplayNameToId,
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
  VIDEO_MODELS,
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
  type VideoDurationSec,
} from './media-options'

export function getModels(): AIModel[] {
  return demoModels.filter((m) => m.id !== 'mock')
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
