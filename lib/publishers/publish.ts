import type { Platform } from '@/types'
import { getPublisher } from '@/lib/publishers'
import type { PostPayload, PublishResult } from './types'

/** Publish content through the real platform adapter (OAuth token required). */
export async function publishToPlatform(platform: Platform, post: PostPayload): Promise<PublishResult> {
  const adapter = getPublisher(platform)
  if (!adapter) {
    return {
      success: false,
      error: `Publishing to ${platform} is not supported. Connect a supported platform in Integrations.`,
    }
  }

  const validation = adapter.validatePost(post)
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') }
  }

  return adapter.publishPost(post)
}
