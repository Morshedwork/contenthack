import type { BrandProfile, GeneratedImage, GeneratedVideo, ExtractedBrandTheme } from '@/types'
import { DEMO_COMPANY, demoBrandProfile } from '@/lib/demo/data'
import { buildThemePromptContext, resolveBrandTheme } from '@/lib/brand/theme-context'
import { enhanceImagePrompt, hasKimi, renderImageFromPrompt } from './kimi'
import { generateVideo, hasPixverse } from './pixverse'

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

export async function generateMarketingImage(input: {
  prompt: string
  brandProfile?: BrandProfile
  brandThemeId?: string
  customPromptDetails?: string
}): Promise<GeneratedImage> {
  if (!hasKimi()) {
    throw new Error('KIMI_API_KEY is required for image generation. Add it to your .env.local file.')
  }

  const theme = resolveBrandTheme(input.brandProfile, input.brandThemeId)
  const brandContext = buildBrandContext(input.brandProfile, theme)
  const brief = await enhanceImagePrompt({
    prompt: input.prompt,
    brandContext,
    customPromptDetails: input.customPromptDetails,
  })

  const imageUrl = await renderImageFromPrompt(brief.enhancedPrompt, brief.aspectRatio)

  return {
    id: id('img'),
    prompt: input.prompt,
    enhancedPrompt: brief.enhancedPrompt,
    style: brief.style,
    aspectRatio: brief.aspectRatio,
    imageUrl,
    model: 'kimi-k2.5',
    provider: 'Moonshot AI',
    status: 'completed',
    createdAt: new Date().toISOString(),
  }
}

export async function generateMarketingVideo(input: {
  prompt: string
  model?: 'v4.5' | 'v5' | 'v6'
  duration?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  brandProfile?: BrandProfile
  brandThemeId?: string
  customPromptDetails?: string
  wait?: boolean
}): Promise<GeneratedVideo> {
  if (!hasPixverse()) {
    throw new Error('PIXVERSE_API_KEY is required for video generation. Add it to your .env.local file.')
  }

  const theme = resolveBrandTheme(input.brandProfile, input.brandThemeId)
  const brandContext = buildBrandContext(input.brandProfile, theme)
  const fullPrompt = input.customPromptDetails
    ? `${input.prompt}. Brand: ${brandContext}. ${input.customPromptDetails}`
    : `${input.prompt}. ${brandContext}`

  const { videoId, url, status } = await generateVideo({
    prompt: fullPrompt,
    model: input.model || 'v4.5',
    duration: input.duration ?? 5,
    aspectRatio: input.aspectRatio || '16:9',
    wait: input.wait !== false,
  })

  return {
    id: id('vid'),
    prompt: input.prompt,
    videoUrl: url,
    videoId,
    model: `pixverse-${input.model || 'v4.5'}`,
    provider: 'PixVerse',
    duration: input.duration ?? 5,
    aspectRatio: input.aspectRatio || '16:9',
    status: url ? 'completed' : status.status === 5 ? 'processing' : 'failed',
    createdAt: new Date().toISOString(),
  }
}

export function mediaProvidersAvailable() {
  return { kimi: hasKimi(), pixverse: hasPixverse() }
}
