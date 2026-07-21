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
  isOpenRouterRenderModel,
  isPollinationsRenderModel,
  isValidImagePromptModel,
  isValidImageRenderModel,
  toOpenAIImageModel,
  toOpenRouterImageModel,
  toPollinationsModel,
  type ImageAspectRatioId,
  type ImagePromptModelId,
  type ImageRenderModelId,
  type GptImageQualityId,
  type GptImage2ResolutionId,
  type GptImage2ThinkingId,
  type OpenRouterImageQualityId,
  type OpenRouterImageResolutionId,
  type OpenRouterRenderModelId,
  type OpenRouterVideoModelId,
  type OpenRouterVideoResolutionId,
  type VideoProvider,
  buildOpenRouterImageChain,
} from '@/lib/models/media-options'
import { enhanceImagePrompt, hasKimi, renderImageFromPrompt } from './kimi'
import {
  enhanceImagePromptWithOpenAI,
  hasOpenAIImage,
  normalizeOpenAIImageModel,
  renderImageWithOpenAI,
  type DalleQuality,
} from './openai-image'
import { generateVideoWithOpenRouter, hasOpenRouter, openRouterVideoProxyUrl, renderImageWithOpenRouter } from './openrouter'
import { generateVideo, hasPixverse, type PixverseModel, type PixverseQuality } from './pixverse'
import {
  buildVideoLayerChain,
  defaultOpenRouterGenerateAudio,
  defaultOpenRouterVideoResolution,
  defaultVideoLayerMode,
} from '@/lib/env/video-layer'
import { normalizePixverseVideoParams } from '@/lib/models/media-options'

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
  openrouterResolution?: OpenRouterImageResolutionId
  openrouterQuality?: OpenRouterImageQualityId
  modelRouting?: ModelRouting[]
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
}): Promise<GeneratedImage> {
  const preferredRenderModelId = resolveRenderModelId(input.renderModel)
  let usedRenderModelId: ImageRenderModelId | string = preferredRenderModelId
  const renderProvider = getImageRenderProvider(preferredRenderModelId) || 'pollinations'

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
  const preferFreePollinations = isPollinationsRenderModel(preferredRenderModelId)

  // True free path first when user picked Pollinations
  if (preferFreePollinations) {
    try {
      imageUrl = await renderImageFromPrompt(brief.enhancedPrompt, aspectRatio, {
        renderModel: toPollinationsModel(preferredRenderModelId),
        negativePrompt: brief.negativePrompt,
      })
      provider = 'Pollinations'
      usedRenderModelId = preferredRenderModelId
    } catch (err) {
      renderErrors.push(`Pollinations: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (!imageUrl && isOpenAIRenderModel(preferredRenderModelId) && hasOpenAIImage()) {
    try {
      imageUrl = await renderImageWithOpenAI(
        brief.enhancedPrompt,
        toOpenAIImageModel(preferredRenderModelId),
        aspectRatio,
        {
          quality: input.openaiQuality,
          gptImageQuality: input.gptImageQuality,
          gptImage2Resolution: input.gptImage2Resolution,
          gptImageThinking: input.gptImageThinking,
        },
      )
      provider = 'OpenAI'
      usedRenderModelId = preferredRenderModelId
    } catch (err) {
      renderErrors.push(`OpenAI: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (!imageUrl && isOpenRouterRenderModel(preferredRenderModelId) && hasOpenRouter()) {
    try {
      imageUrl = await renderImageWithOpenRouter({
        prompt: brief.enhancedPrompt,
        model: toOpenRouterImageModel(preferredRenderModelId),
        aspectRatio,
        resolution: input.openrouterResolution,
        quality: input.openrouterQuality,
      })
      provider = 'OpenRouter'
      usedRenderModelId = preferredRenderModelId
    } catch (err) {
      renderErrors.push(`OpenRouter(${preferredRenderModelId}): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Budget-first OpenRouter fallbacks (skip when user explicitly chose free Pollinations)
  if (!imageUrl && hasOpenRouter() && !preferFreePollinations) {
    const alreadyTriedPreferred =
      isOpenRouterRenderModel(preferredRenderModelId) &&
      renderErrors.some((e) => e.startsWith(`OpenRouter(${preferredRenderModelId})`))
    for (const fallbackModel of buildOpenRouterImageChain(preferredRenderModelId)) {
      if (alreadyTriedPreferred && fallbackModel === preferredRenderModelId) continue
      try {
        imageUrl = await renderImageWithOpenRouter({
          prompt: brief.enhancedPrompt,
          model: fallbackModel as OpenRouterRenderModelId,
          aspectRatio,
          resolution: input.openrouterResolution,
          quality: input.openrouterQuality,
        })
        provider = fallbackModel === preferredRenderModelId
          ? 'OpenRouter'
          : `OpenRouter (${fallbackModel} fallback)`
        usedRenderModelId = fallbackModel
        if (fallbackModel !== preferredRenderModelId) {
          console.info(`[image-layer] fallback succeeded on ${fallbackModel}`)
        }
        break
      } catch (err) {
        renderErrors.push(`OpenRouter(${fallbackModel}): ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  // Final free fallback — Pollinations Flux
  if (!imageUrl) {
    try {
      imageUrl = await renderImageFromPrompt(brief.enhancedPrompt, aspectRatio, {
        renderModel: 'flux',
        negativePrompt: brief.negativePrompt,
      })
      provider = 'Pollinations (fallback)'
      usedRenderModelId = 'flux'
    } catch (err) {
      renderErrors.push(`Pollinations fallback: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (!imageUrl) {
    if (renderProvider === 'openai' && !hasOpenAIImage() && !isPollinationsRenderModel(preferredRenderModelId)) {
      throw new Error('OPENAI_API_KEY is required for OpenAI image models. Add it to your .env.local file.')
    }
    if (renderProvider === 'openrouter' && !hasOpenRouter()) {
      throw new Error('OPENROUTER_API_KEY is required for OpenRouter image models. Add it to your .env.local file.')
    }
    throw new Error(
      renderErrors.length
        ? `Image render failed — ${renderErrors.join('; ')}`
        : `Unknown or unavailable image render model: ${preferredRenderModelId}`,
    )
  }

  const modelLabel = `${usedRenderModelId} · ${promptModelLabel}`

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
  videoProvider?: VideoProvider
  model?: PixverseModel | OpenRouterVideoModelId | string
  pixverseModel?: PixverseModel
  duration?: number
  quality?: PixverseQuality
  resolution?: OpenRouterVideoResolutionId
  generateAudio?: boolean
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
  brandProfile?: BrandProfile
  brandThemeId?: string
  customPromptDetails?: string
  wait?: boolean
  modelRouting?: ModelRouting[]
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
}): Promise<GeneratedVideo> {
  const mode = input.videoProvider || defaultVideoLayerMode()
  const layerChain = buildVideoLayerChain({
    mode,
    preferredOpenRouterModel:
      typeof input.model === 'string' && input.model.includes('/') ? input.model : undefined,
    preferredPixverseModel:
      input.pixverseModel ||
      (typeof input.model === 'string' && !input.model.includes('/') ? (input.model as PixverseModel) : undefined),
    modelRouting: input.modelRouting,
  })

  if (!layerChain.length) {
    throw new Error(
      'No video provider configured. Add OPENROUTER_API_KEY and/or PIXVERSE_API_KEY to your .env.local file.',
    )
  }

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

  const resolution = input.resolution || defaultOpenRouterVideoResolution()
  const generateAudio = input.generateAudio ?? defaultOpenRouterGenerateAudio()
  const duration = input.duration ?? 5
  const aspectRatio = input.aspectRatio || '16:9'
  const errors: string[] = []

  for (const step of layerChain) {
    try {
      if (step.provider === 'openrouter') {
        if (!hasOpenRouter()) continue
        const result = await generateVideoWithOpenRouter({
          prompt: fullPrompt,
          model: step.model,
          duration,
          resolution,
          aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1' | '4:3' | '3:4',
          generateAudio,
          wait: input.wait !== false,
        })
        return {
          id: id('vid'),
          prompt: input.prompt,
          videoUrl: result.url || openRouterVideoProxyUrl(result.jobId),
          model: step.model,
          provider: 'OpenRouter',
          duration,
          aspectRatio,
          status: result.url ? 'completed' : result.status === 'completed' ? 'completed' : 'processing',
          createdAt: new Date().toISOString(),
        }
      }

      if (!hasPixverse()) continue
      const pixverseModel = step.model as PixverseModel
      const { duration: pxDuration, quality } = normalizePixverseVideoParams({
        model: pixverseModel,
        duration,
        quality: input.quality || '720p',
      })
      const result = await generateVideo({
        prompt: fullPrompt,
        model: pixverseModel,
        duration: pxDuration,
        quality,
        aspectRatio,
        wait: input.wait !== false,
      })
      return {
        id: id('vid'),
        prompt: input.prompt,
        videoUrl: result.url,
        videoId: result.videoId,
        model: `pixverse-${pixverseModel}`,
        provider: 'PixVerse',
        duration: pxDuration,
        aspectRatio,
        status: result.url ? 'completed' : result.status.status === 5 ? 'processing' : 'failed',
        createdAt: new Date().toISOString(),
      }
    } catch (err) {
      errors.push(`${step.provider}/${step.model}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  throw new Error(errors.length ? `Video generation failed — ${errors.join('; ')}` : 'Video generation failed')
}

export function mediaProvidersAvailable() {
  return { kimi: hasKimi(), openai: hasOpenAIImage(), openrouter: hasOpenRouter(), pixverse: hasPixverse() }
}
