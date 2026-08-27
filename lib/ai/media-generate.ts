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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function demoImageDimensions(aspectRatio?: string): { width: number; height: number } {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1344, height: 768 }
    case '9:16':
      return { width: 768, height: 1344 }
    case '4:3':
      return { width: 1152, height: 896 }
    default:
      return { width: 1024, height: 1024 }
  }
}

function buildDemoImageDataUrl(input: {
  prompt: string
  brandProfile?: BrandProfile
  aspectRatio?: string
}): string {
  const { width, height } = demoImageDimensions(input.aspectRatio)
  const brand = escapeXml(input.brandProfile?.brandName || DEMO_COMPANY.name)
  const prompt = escapeXml(input.prompt.replace(/\s+/g, ' ').slice(0, 120))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1020"/>
      <stop offset="48%" stop-color="#21123d"/>
      <stop offset="100%" stop-color="#052224"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="18" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g opacity="0.25">
    <path d="M0 ${height * 0.18} H${width} M0 ${height * 0.38} H${width} M0 ${height * 0.58} H${width} M0 ${height * 0.78} H${width}" stroke="#ffffff" stroke-width="1"/>
    <path d="M${width * 0.18} 0 V${height} M${width * 0.38} 0 V${height} M${width * 0.58} 0 V${height} M${width * 0.78} 0 V${height}" stroke="#ffffff" stroke-width="1"/>
  </g>
  <circle cx="${width * 0.78}" cy="${height * 0.22}" r="${Math.min(width, height) * 0.2}" fill="#8b5cf6" opacity="0.25" filter="url(#glow)">
    <animate attributeName="r" values="${Math.min(width, height) * 0.16};${Math.min(width, height) * 0.22};${Math.min(width, height) * 0.16}" dur="4s" repeatCount="indefinite"/>
  </circle>
  <rect x="${width * 0.08}" y="${height * 0.16}" width="${width * 0.5}" height="${height * 0.58}" rx="28" fill="#090b12" opacity="0.82" stroke="#7c3aed"/>
  <rect x="${width * 0.12}" y="${height * 0.24}" width="${width * 0.28}" height="18" rx="9" fill="url(#accent)"/>
  <rect x="${width * 0.12}" y="${height * 0.32}" width="${width * 0.38}" height="14" rx="7" fill="#64748b" opacity="0.7"/>
  <rect x="${width * 0.12}" y="${height * 0.39}" width="${width * 0.34}" height="14" rx="7" fill="#475569" opacity="0.7"/>
  <rect x="${width * 0.12}" y="${height * 0.52}" width="${width * 0.4}" height="${height * 0.12}" rx="18" fill="#111827" stroke="#334155"/>
  <path d="M${width * 0.15} ${height * 0.59} C${width * 0.24} ${height * 0.5}, ${width * 0.36} ${height * 0.68}, ${width * 0.49} ${height * 0.55}" fill="none" stroke="url(#accent)" stroke-width="6" stroke-linecap="round">
    <animate attributeName="stroke-dasharray" values="10 28;28 10;10 28" dur="3s" repeatCount="indefinite"/>
  </path>
  <g transform="translate(${width * 0.63} ${height * 0.36})">
    <circle cx="0" cy="0" r="34" fill="#a78bfa"/><circle cx="${width * 0.1}" cy="${height * 0.08}" r="28" fill="#38bdf8"/><circle cx="${width * 0.18}" cy="${height * 0.02}" r="32" fill="#34d399"/>
    <path d="M0 0 L${width * 0.1} ${height * 0.08} L${width * 0.18} ${height * 0.02}" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.7"/>
  </g>
  <text x="${width * 0.08}" y="${height * 0.84}" fill="#f8fafc" font-family="Inter, Arial, sans-serif" font-size="${Math.max(34, width * 0.045)}" font-weight="700">${brand}</text>
  <text x="${width * 0.08}" y="${height * 0.9}" fill="#cbd5e1" font-family="Inter, Arial, sans-serif" font-size="${Math.max(18, width * 0.018)}">Demo generated visual: ${prompt}</text>
</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export function buildDemoMarketingImage(input: {
  prompt: string
  brandProfile?: BrandProfile
  aspectRatio?: string
  enhancedPrompt?: string
  promptModelLabel?: string
}): GeneratedImage {
  return {
    id: id('img-demo'),
    prompt: input.prompt,
    enhancedPrompt: input.enhancedPrompt || input.prompt,
    style: 'animated demo visual',
    aspectRatio: input.aspectRatio || '16:9',
    imageUrl: buildDemoImageDataUrl(input),
    model: `demo-poster${input.promptModelLabel ? ` - ${input.promptModelLabel}` : ''}`,
    provider: 'Demo fallback',
    status: 'completed',
    createdAt: new Date().toISOString(),
  }
}

export function buildDemoMarketingVideo(input: {
  prompt: string
  duration?: number
  aspectRatio?: string
}): GeneratedVideo {
  return {
    id: id('vid-demo'),
    prompt: input.prompt,
    model: 'demo-motion-card',
    provider: 'Demo animation',
    duration: input.duration ?? 5,
    aspectRatio: input.aspectRatio || '9:16',
    status: 'completed',
    createdAt: new Date().toISOString(),
  }
}

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

  const theme = resolveBrandTheme(input.brandProfile, input.brandThemeId)
  const brandContext = buildBrandContext(input.brandProfile, theme)
  const promptErrors: string[] = []
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
    .catch((err) => {
      promptErrors.push(err instanceof Error ? err.message : String(err))
      return {
        brief: {
          enhancedPrompt: `${input.prompt}. ${brandContext}`,
          style: 'demo visual',
          aspectRatio: (input.aspectRatio || '16:9') as KimiImagePrompt['aspectRatio'],
          negativePrompt: 'blurry, low quality, watermark',
        },
        promptModelLabel: 'demo-prompt',
      }
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
    console.warn('[image-layer] using demo fallback:', [...promptErrors, ...renderErrors].join('; ') || 'no renderer returned an image')
    return buildDemoMarketingImage({
      prompt: input.prompt,
      brandProfile: input.brandProfile,
      aspectRatio,
      enhancedPrompt: brief.enhancedPrompt,
      promptModelLabel,
    })
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
    return buildDemoMarketingVideo({
      prompt: input.prompt,
      duration: input.duration,
      aspectRatio: input.aspectRatio,
    })
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

  console.warn('[video-layer] using demo fallback:', errors.join('; ') || 'no provider returned a video')
  return buildDemoMarketingVideo({
    prompt: input.prompt,
    duration,
    aspectRatio,
  })
}

export function mediaProvidersAvailable() {
  return { kimi: hasKimi(), openai: hasOpenAIImage(), openrouter: hasOpenRouter(), pixverse: hasPixverse() }
}
