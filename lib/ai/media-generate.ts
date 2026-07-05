import type { BrandProfile, GeneratedImage, GeneratedVideo, ExtractedBrandTheme, ModelRouting } from '@/types'
import { DEMO_COMPANY, demoBrandProfile } from '@/lib/demo/data'
import { buildThemePromptContext, resolveBrandTheme } from '@/lib/brand/theme-context'
import { MODEL_TASK, resolveMediaModel, resolveTaskModel, modelDisplayNameToId } from '@/lib/models/routing'
import { defaultImagePromptModel, defaultImageRenderModel } from '@/lib/env/providers'
import { crustdataPromptBlock, fetchTaskContext, mergeCrustdataSignals, type CrustdataTaskInput } from '@/lib/ai/crustdata'
import type { MarketResearch } from '@/types'
import type { KimiImagePrompt } from './kimi'
import {
  getImagePromptProvider,
  getImageRenderProvider,
  isOpenAIRenderModel,
  isPollinationsRenderModel,
  isValidImagePromptModel,
  isValidImageRenderModel,
  toOpenAIImageModel,
  toPollinationsModel,
  type ImageAspectRatioId,
  type ImagePromptModelId,
  type ImageRenderModelId,
  type GptImageQualityId,
  type GptImage2ResolutionId,
  type GptImage2ThinkingId,
} from '@/lib/models/media-options'
import { enhanceImagePrompt, hasKimi, renderImageFromPrompt } from './kimi'
import {
  enhanceImagePromptWithOpenAI,
  hasOpenAIImage,
  normalizeOpenAIImageModel,
  renderImageWithOpenAI,
  type DalleQuality,
} from './openai-image'
import { generateVideo, hasPixverse, type PixverseModel, type PixverseQuality } from './pixverse'

function buildBrandContext(profile?: BrandProfile, theme?: ExtractedBrandTheme): string {
  const p = profile ?? demoBrandProfile
  const base = `Brand: ${p.brandName || DEMO_COMPANY.name}
Tone: ${p.tone}
Audience: ${p.targetAudience}
Offer: ${p.mainOffer}`
  const themeContext = buildThemePromptContext(theme)
  return themeContext ? `${base}\n\n${themeContext}` : base
}

const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}`

function resolvePromptModelId(
  explicit?: ImagePromptModelId,
  modelRouting?: ModelRouting[],
): ImagePromptModelId {
  if (explicit && isValidImagePromptModel(explicit)) return explicit
  const routed = resolveMediaModel(MODEL_TASK.IMAGE_GENERATION, modelRouting)
  const normalized = modelDisplayNameToId(routed)
  if (isValidImagePromptModel(normalized)) return normalized
  if (isValidImagePromptModel(routed)) return routed
  return defaultImagePromptModel()
}

function resolveRenderModelId(explicit?: ImageRenderModelId): ImageRenderModelId {
  if (explicit && isValidImageRenderModel(explicit)) return explicit
  return defaultImageRenderModel()
}

async function buildImageBrief(input: {
  prompt: string
  brandContext: string
  customPromptDetails?: string
  promptModel?: ImagePromptModelId
  modelRouting?: ModelRouting[]
  brandProfile?: BrandProfile
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
}): Promise<{ brief: KimiImagePrompt; promptModelLabel: string }> {
  const promptModelId = resolvePromptModelId(input.promptModel, input.modelRouting)
  const preferredProvider = getImagePromptProvider(promptModelId) || 'kimi'
  const crustdataContext = await fetchTaskContext(
    MODEL_TASK.IMAGE_GENERATION,
    mergeCrustdataSignals({ topic: input.prompt, ...input.signals }, input.brandProfile, input.research),
  )
  const enrichedBrandContext = `${input.brandContext}${crustdataPromptBlock(crustdataContext, 'visual trend data')}`

  const providers: Array<'openai' | 'kimi'> =
    preferredProvider === 'openai' ? ['openai', 'kimi'] : ['kimi', 'openai']

  const errors: string[] = []
  for (const provider of providers) {
    try {
      if (provider === 'openai') {
        if (!hasOpenAIImage()) continue
        const brief = await enhanceImagePromptWithOpenAI({
          prompt: input.prompt,
          brandContext: enrichedBrandContext,
          customPromptDetails: input.customPromptDetails,
          model: promptModelId,
        })
        return { brief, promptModelLabel: promptModelId }
      }
      if (!hasKimi()) continue
      const brief = await enhanceImagePrompt({
        prompt: input.prompt,
        brandContext: enrichedBrandContext,
        customPromptDetails: input.customPromptDetails,
        model: promptModelId,
      })
      return { brief, promptModelLabel: promptModelId }
    } catch (err) {
      errors.push(`${provider}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  throw new Error(
    errors.length
      ? `Image prompt enhancement failed — ${errors.join('; ')}`
      : 'No image prompt provider configured. Add OPENAI_API_KEY or KIMI_API_KEY.',
  )
}

export async function generateMarketingImage(input: {
  prompt: string
  brandProfile?: BrandProfile
  brandThemeId?: string
  customPromptDetails?: string
  promptModel?: ImagePromptModelId
  renderModel?: ImageRenderModelId
  aspectRatio?: ImageAspectRatioId
  openaiQuality?: DalleQuality
  gptImageQuality?: GptImageQualityId
  gptImage2Resolution?: GptImage2ResolutionId
  gptImageThinking?: GptImage2ThinkingId
  modelRouting?: ModelRouting[]
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
}): Promise<GeneratedImage> {
  const renderModelId = resolveRenderModelId(input.renderModel)
  const renderProvider = getImageRenderProvider(renderModelId) || 'pollinations'

  const theme = resolveBrandTheme(input.brandProfile, input.brandThemeId)
  const brandContext = buildBrandContext(input.brandProfile, theme)
  const { brief, promptModelLabel } = await buildImageBrief({
    prompt: input.prompt,
    brandContext,
    customPromptDetails: input.customPromptDetails,
    promptModel: input.promptModel,
    modelRouting: input.modelRouting,
    brandProfile: input.brandProfile,
    research: input.research,
    signals: input.signals,
  })

  const aspectRatio = input.aspectRatio || brief.aspectRatio
  let imageUrl: string | undefined
  let provider = ''

  const renderErrors: string[] = []

  if (isOpenAIRenderModel(renderModelId) && hasOpenAIImage()) {
    try {
      imageUrl = await renderImageWithOpenAI(
        brief.enhancedPrompt,
        toOpenAIImageModel(renderModelId),
        aspectRatio,
        {
          quality: input.openaiQuality,
          gptImageQuality: input.gptImageQuality,
          gptImage2Resolution: input.gptImage2Resolution,
          gptImageThinking: input.gptImageThinking,
        },
      )
      provider = 'OpenAI'
    } catch (err) {
      renderErrors.push(`OpenAI: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (!imageUrl && isPollinationsRenderModel(renderModelId)) {
    try {
      imageUrl = await renderImageFromPrompt(brief.enhancedPrompt, aspectRatio, {
        renderModel: toPollinationsModel(renderModelId),
        negativePrompt: brief.negativePrompt,
      })
      provider = 'Pollinations'
    } catch (err) {
      renderErrors.push(`Pollinations: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Layer fallback: OpenAI render failed → try Pollinations
  if (!imageUrl && isOpenAIRenderModel(renderModelId)) {
    try {
      imageUrl = await renderImageFromPrompt(brief.enhancedPrompt, aspectRatio, {
        renderModel: 'flux',
        negativePrompt: brief.negativePrompt,
      })
      provider = 'Pollinations (fallback)'
    } catch (err) {
      renderErrors.push(`Pollinations fallback: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (!imageUrl) {
    if (renderProvider === 'openai' && !hasOpenAIImage() && !isPollinationsRenderModel(renderModelId)) {
      throw new Error('OPENAI_API_KEY is required for OpenAI image models. Add it to your .env.local file.')
    }
    throw new Error(
      renderErrors.length
        ? `Image render failed — ${renderErrors.join('; ')}`
        : `Unknown or unavailable image render model: ${renderModelId}`,
    )
  }

  const modelLabel = `${renderModelId} · ${promptModelLabel}`

  return {
    id: id('img'),
    prompt: input.prompt,
    enhancedPrompt: brief.enhancedPrompt,
    style: brief.style,
    aspectRatio,
    imageUrl,
    model: modelLabel,
    provider,
    status: 'completed',
    createdAt: new Date().toISOString(),
  }
}

export async function generateMarketingVideo(input: {
  prompt: string
  model?: PixverseModel
  duration?: number
  quality?: PixverseQuality
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
  brandProfile?: BrandProfile
  brandThemeId?: string
  customPromptDetails?: string
  wait?: boolean
  modelRouting?: ModelRouting[]
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
}): Promise<GeneratedVideo> {
  if (!hasPixverse()) {
    throw new Error('PIXVERSE_API_KEY is required for video generation. Add it to your .env.local file.')
  }

  const videoConfig = resolveTaskModel(MODEL_TASK.VIDEO_GENERATION, input.modelRouting)
  const modelChain = [
    input.model,
    modelDisplayNameToId(videoConfig.model),
    videoConfig.fallbackModel ? modelDisplayNameToId(videoConfig.fallbackModel) : undefined,
    'v4.5',
    'v6',
  ].filter((m, i, arr): m is PixverseModel => Boolean(m) && arr.indexOf(m) === i) as PixverseModel[]

  const theme = resolveBrandTheme(input.brandProfile, input.brandThemeId)
  const brandContext = buildBrandContext(input.brandProfile, theme)
  const crustdataContext = await fetchTaskContext(
    MODEL_TASK.VIDEO_GENERATION,
    mergeCrustdataSignals({ topic: input.prompt, ...input.signals }, input.brandProfile, input.research),
  )
  const trendContext = crustdataPromptBlock(crustdataContext, 'video trend data')
  const fullPrompt = input.customPromptDetails
    ? `${input.prompt}. Brand: ${brandContext}.${trendContext} ${input.customPromptDetails}`
    : `${input.prompt}. ${brandContext}.${trendContext}`

  const errors: string[] = []
  let videoId: number | undefined
  let url: string | undefined
  let status: Awaited<ReturnType<typeof generateVideo>>['status'] | undefined
  let usedModel: PixverseModel = modelChain[0] || 'v4.5'

  for (const pixverseModel of modelChain) {
    try {
      const result = await generateVideo({
        prompt: fullPrompt,
        model: pixverseModel,
        duration: input.duration ?? 5,
        quality: input.quality || '540p',
        aspectRatio: input.aspectRatio || '16:9',
        wait: input.wait !== false,
      })
      videoId = result.videoId
      url = result.url
      status = result.status
      usedModel = pixverseModel
      break
    } catch (err) {
      errors.push(`${pixverseModel}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (videoId === undefined || !status) {
    throw new Error(errors.length ? `Video generation failed — ${errors.join('; ')}` : 'Video generation failed')
  }

  return {
    id: id('vid'),
    prompt: input.prompt,
    videoUrl: url,
    videoId,
    model: `pixverse-${usedModel}`,
    provider: 'PixVerse',
    duration: input.duration ?? 5,
    aspectRatio: input.aspectRatio || '16:9',
    status: url ? 'completed' : status.status === 5 ? 'processing' : 'failed',
    createdAt: new Date().toISOString(),
  }
}

export function mediaProvidersAvailable() {
  return { kimi: hasKimi(), openai: hasOpenAIImage(), pixverse: hasPixverse() }
}
