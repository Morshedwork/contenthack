import type { PublisherAdapter, PostPayload, PublishResult } from './types'
import { getPlatformAccessToken } from '@/lib/integrations/tokens'

export const youtubeAdapter: PublisherAdapter = {
  platform: 'youtube',
  validatePost(post: PostPayload) {
    const errors: string[] = []
    if (!post.mediaUrls?.length) errors.push('Video required for YouTube Shorts')
    if (!post.title) errors.push('Title required')
    return { valid: errors.length === 0, errors }
  },
  async uploadMedia(urls: string[]) {
    return urls
  },
  async publishPost(post: PostPayload): Promise<PublishResult> {
    const token = await getPlatformAccessToken('youtube')
    if (!token) {
      return { success: false, error: 'YouTube is not connected. Connect your account in Integrations.' }
    }

    return { success: false, error: 'YouTube Shorts publishing requires a video upload.' }
  },
  async getPostStatus(postId: string) {
    return { status: 'published', url: `https://youtube.com/shorts/${postId}` }
  },
}
