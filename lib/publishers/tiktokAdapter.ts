import type { PublisherAdapter, PostPayload, PublishResult } from './types'
import { getPlatformAccessToken } from '@/lib/integrations/tokens'

export const tiktokAdapter: PublisherAdapter = {
  platform: 'tiktok',
  validatePost(post: PostPayload) {
    const errors: string[] = []
    if (!post.mediaUrls?.length) errors.push('Video file required for TikTok')
    return { valid: errors.length === 0, errors }
  },
  async uploadMedia(urls: string[]) {
    return urls
  },
  async publishPost(post: PostPayload): Promise<PublishResult> {
    const token = await getPlatformAccessToken('tiktok')
    if (!token) {
      return { success: false, error: 'TikTok is not connected. Connect your account in Integrations.' }
    }

    return { success: false, error: 'TikTok video publishing requires an uploaded video asset.' }
  },
  async getPostStatus(postId: string) {
    return { status: 'published', url: `https://www.tiktok.com/video/${postId}` }
  },
}
