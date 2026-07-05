import { hasCrustdata } from '@/lib/ai/crustdata'
import { hasKimi } from '@/lib/ai/kimi'
import { hasOpenAI } from '@/lib/ai/openai'
import { hasOpenAIImage, normalizeOpenAIImageModel, OPENAI_IMAGE_MODEL } from '@/lib/ai/openai-image'
import { hasPixverse, type PixverseModel } from '@/lib/ai/pixverse'
import { isDemoMode } from '@/lib/demo/mode'
import type { ImagePromptModelId, ImageRenderModelId } from '@/lib/models/media-options'
import { hasSupabaseConfig } from '@/lib/supabase/env'
import { hasSupabasePersistence } from '@/lib/workspace/persistence'

export interface AppProviders {
  openai: boolean
  crustdata: boolean
  kimi: boolean
  pixverse: boolean
  supabase: boolean
  supabasePersistence: boolean
  demoMode: boolean
  contentopsMcp: boolean
}

/** Which services from `.env.local` are configured and active. */
export function getAppProviders(): AppProviders {
  return {
    openai: hasOpenAI(),
    crustdata: hasCrustdata(),
    kimi: hasKimi(),
    pixverse: hasPixverse(),
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
  if (hasOpenAIImage()) {
    return normalizeOpenAIImageModel(process.env.OPENAI_IMAGE_MODEL?.trim() || OPENAI_IMAGE_MODEL) as ImageRenderModelId
  }
  return 'flux'
}

export function defaultVideoModel(): PixverseModel {
  return (process.env.PIXVERSE_MODEL?.trim() || 'v4.5') as PixverseModel
}

export function configuredEnvVarNames(): string[] {
  const names = [
    'OPENAI_API_KEY',
    'CRUSTDATA_API_KEY',
    'KIMI_API_KEY',
    'PIXVERSE_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
  ]
  return names.filter((name) => Boolean(process.env[name]?.trim()))
}
