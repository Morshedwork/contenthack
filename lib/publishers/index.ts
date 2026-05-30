import type { Platform } from '@/types'
import type { PublisherAdapter } from './types'
import { facebookAdapter } from './facebookAdapter'
import { instagramAdapter } from './instagramAdapter'
import { linkedinAdapter } from './linkedinAdapter'
import { tiktokAdapter } from './tiktokAdapter'
import { xAdapter } from './xAdapter'
import { youtubeAdapter } from './youtubeAdapter'

const adapters: Partial<Record<Platform, PublisherAdapter>> = {
  linkedin: linkedinAdapter,
  instagram: instagramAdapter,
  facebook: facebookAdapter,
  x: xAdapter,
  tiktok: tiktokAdapter,
  youtube: youtubeAdapter,
}

export function getPublisher(platform: Platform): PublisherAdapter | null {
  return adapters[platform] ?? null
}
