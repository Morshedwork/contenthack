import { hasBrightData } from '@/lib/ai/brightdata'
import { hasCrustdata } from '@/lib/ai/crustdata'
import { hasElevenLabs } from '@/lib/ai/elevenlabs'
import { hasTextAI } from '@/lib/ai/layer'
import { hasKimi } from '@/lib/ai/kimi'
import { hasOpenAI } from '@/lib/ai/openai'
import { hasOpenAIImage, normalizeOpenAIImageModel, OPENAI_IMAGE_MODEL } from '@/lib/ai/openai-image'
import { hasOpenRouter } from '@/lib/ai/openrouter'
import { hasPixverse, type PixverseModel } from '@/lib/ai/pixverse'
import {
  defaultOpenRouterGenerateAudio,
  defaultOpenRouterVideoResolution,
  defaultVideoLayerMode,
  videoLayerSummary,
} from '@/lib/env/video-layer'
import { isDemoMode } from '@/lib/demo/mode'
import type {
  ImagePromptModelId,
  ImageRenderModelId,
  OpenRouterRenderModelId,
  OpenRouterVideoModelId,
  VideoProvider,
} from '@/lib/models/media-options'
import { hasSupabaseConfig } from '@/lib/supabase/env'
import { hasSupabasePersistence } from '@/lib/workspace/persistence'

export interface AppProviders {
  openai: boolean
  kimi: boolean
  /** At least one text provider (OpenAI and/or Kimi) — layered AI stack. */
  textAI: boolean
  crustdata: boolean
  brightdata: boolean
  pixverse: boolean
  openrouter: boolean
  elevenlabs: boolean
  supabase: boolean
  supabasePersistence: boolean
  demoMode: boolean
  contentopsMcp: boolean
}

/** Which services from `.env.local` are configured and active. */
export function getAppProviders(): AppProviders {
  return {
    openai: hasOpenAI(),
    kimi: hasKimi(),
    textAI: hasTextAI(),
    crustdata: hasCrustdata(),
    brightdata: hasBrightData(),
    pixverse: hasPixverse(),
    openrouter: hasOpenRouter(),
    elevenlabs: hasElevenLabs(),
    supabase: hasSupabaseConfig(),
    supabasePersistence: hasSupabasePersistence(),
    demoMode: isDemoMode(),
    contentopsMcp: Boolean(process.env.CONTENTOPS_API_URL?.trim()),
  }
}

/** Kimi prompts + OpenAI render when both keys are set — uses the full media stack. */
export function defaultImagePromptModel(): ImagePromptModelId {
  if (hasKimi()) return 'kimi-k2.5'
  if (hasOpenAIImage()) return 'gpt-4o'
  return 'kimi-k2.5'
}

export function defaultImageRenderModel(): ImageRenderModelId {
  if (hasOpenRouter()) {
    const env = process.env.OPENROUTER_IMAGE_MODEL?.trim()
    if (env) return env as ImageRenderModelId
    return 'krea/krea-2-medium-turbo' as OpenRouterRenderModelId
  }
  if (hasOpenAIImage()) {
    return normalizeOpenAIImageModel(process.env.OPENAI_IMAGE_MODEL?.trim() || OPENAI_IMAGE_MODEL) as ImageRenderModelId
  }
  return 'flux'
}

export function defaultVideoProvider(): VideoProvider {
  return defaultVideoLayerMode()
}

export function defaultVideoModel(): PixverseModel {
  return (process.env.PIXVERSE_MODEL?.trim() || 'v6') as PixverseModel
}

export function defaultOpenRouterVideoModel(): OpenRouterVideoModelId {
  const env = process.env.OPENROUTER_VIDEO_MODEL?.trim()
  if (env) return env as OpenRouterVideoModelId
  return 'bytedance/seedance-1-5-pro'
}

export { defaultOpenRouterVideoResolution, defaultOpenRouterGenerateAudio, videoLayerSummary }

export function configuredEnvVarNames(): string[] {
  const names = [
    'OPENAI_API_KEY',
    'BRIGHTDATA_API_KEY',
    'CRUSTDATA_API_KEY',
    'KIMI_API_KEY',
    'PIXVERSE_API_KEY',
    'OPENROUTER_API_KEY',
    'ELEVENLABS_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
  ]
  return names.filter((name) => Boolean(process.env[name]?.trim()))
}
