import type { PublisherAdapter, PostPayload, PublishResult } from './types'
import { getPlatformAccessToken } from '@/lib/integrations/tokens'

export const facebookAdapter: PublisherAdapter = {
  platform: 'facebook',
  validatePost(post: PostPayload) {
    const errors: string[] = []
    if (!post.content) errors.push('Message is required')
    return { valid: errors.length === 0, errors }
  },
  async uploadMedia(urls: string[]) {
    return urls
  },
  async publishPost(post: PostPayload): Promise<PublishResult> {
    const token = await getPlatformAccessToken('facebook')
    if (!token) {
      return { success: false, error: 'Facebook is not connected. Connect your account in Integrations.' }
    }

    return { success: false, error: 'Facebook Page publishing requires selecting a page — connect via OAuth first.' }
  },
  async getPostStatus(postId: string) {
    return { status: 'published', url: `https://facebook.com/posts/${postId}` }
  },
}
