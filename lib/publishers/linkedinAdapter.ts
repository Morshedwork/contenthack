import type { PublisherAdapter, PostPayload, PublishResult } from './types'
import { getPlatformAccessToken } from '@/lib/integrations/tokens'

const BASE = 'https://api.linkedin.com/v2'

export const linkedinAdapter: PublisherAdapter = {
  platform: 'linkedin',
  validatePost(post: PostPayload) {
    const errors: string[] = []
    if (!post.content) errors.push('Content is required')
    if (post.content.length > 3000) errors.push('LinkedIn post max 3000 chars')
    return { valid: errors.length === 0, errors }
  },
  async uploadMedia(urls: string[]) {
    return urls.map((_, i) => `urn:li:digitalmediaAsset:${i}`)
  },
  async publishPost(post: PostPayload): Promise<PublishResult> {
    const token = await getPlatformAccessToken('linkedin')
    if (!token) {
      return {
        success: false,
        error: 'LinkedIn is not connected. Connect your account in Integrations.',
      }
    }

    try {
      const profileRes = await fetch(`${BASE}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!profileRes.ok) {
        return { success: false, error: 'LinkedIn token expired or invalid — reconnect in Integrations.' }
      }

      const profile = (await profileRes.json()) as { sub?: string }
      const author = profile.sub ? `urn:li:person:${profile.sub}` : undefined
      if (!author) {
        return { success: false, error: 'Could not resolve LinkedIn profile for publishing.' }
      }

      const publishRes = await fetch(`${BASE}/ugcPosts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: post.content },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      })

      if (!publishRes.ok) {
        const errBody = await publishRes.text()
        return { success: false, error: errBody || `LinkedIn publish failed (${publishRes.status})` }
      }

      const result = (await publishRes.json()) as { id?: string }
      return {
        success: true,
        postId: result.id,
        url: result.id ? `https://www.linkedin.com/feed/update/${result.id}` : undefined,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'LinkedIn publish failed',
      }
    }
  },
  async getPostStatus(postId: string) {
    return { status: 'published', url: `${BASE}/ugcPosts/${postId}` }
  },
}
