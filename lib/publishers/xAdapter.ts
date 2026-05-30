import type { PublisherAdapter, PostPayload, PublishResult } from './types'
import { getPlatformAccessToken } from '@/lib/integrations/tokens'

export const xAdapter: PublisherAdapter = {
  platform: 'x',
  validatePost(post: PostPayload) {
    const errors: string[] = []
    if (!post.content) errors.push('Tweet text required')
    if (post.content.length > 280) errors.push('Tweet max 280 characters')
    return { valid: errors.length === 0, errors }
  },
  async uploadMedia(urls: string[]) {
    return urls
  },
  async publishPost(post: PostPayload): Promise<PublishResult> {
    const token = await getPlatformAccessToken('x')
    if (!token) {
      return { success: false, error: 'X is not connected. Connect your account in Integrations.' }
    }

    try {
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: post.content }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        return { success: false, error: errBody || `X publish failed (${res.status})` }
      }

      const json = (await res.json()) as { data?: { id?: string } }
      return {
        success: true,
        postId: json.data?.id,
        url: json.data?.id ? `https://x.com/i/status/${json.data.id}` : undefined,
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'X publish failed' }
    }
  },
  async getPostStatus(postId: string) {
    return { status: 'published', url: `https://x.com/i/status/${postId}` }
  },
}
