import type { PublisherAdapter, PostPayload, PublishResult } from './types'
import { getPlatformAccessToken } from '@/lib/integrations/tokens'

export const instagramAdapter: PublisherAdapter = {
  platform: 'instagram',
  validatePost(post: PostPayload) {
    const errors: string[] = []
    if (!post.content && !post.mediaUrls?.length) errors.push('Image/video or caption required')
    if (post.content.length > 2200) errors.push('Instagram caption max 2200 chars')
    return { valid: errors.length === 0, errors }
  },
  async uploadMedia(urls: string[]) {
    return urls
  },
  async publishPost(post: PostPayload): Promise<PublishResult> {
    const token = await getPlatformAccessToken('instagram')
    if (!token) {
      return { success: false, error: 'Instagram is not connected. Connect your account in Integrations.' }
    }

    return { success: false, error: 'Instagram publishing requires a connected Business account and media asset.' }
  },
  async getPostStatus(postId: string) {
    return { status: 'published', url: `https://instagram.com/p/${postId}` }
  },
}
