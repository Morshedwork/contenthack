import type { PublisherAdapter, PostPayload, PublishResult } from './types'
import { createMockResult } from './types'

export const mockPublisher: PublisherAdapter = {
  platform: 'linkedin',
  validatePost(post: PostPayload) {
    const errors: string[] = []
    if (!post.content) errors.push('Content is required')
    if (post.content.length > 3000) errors.push('Content exceeds 3000 characters')
    return { valid: errors.length === 0, errors }
  },
  async uploadMedia(urls: string[]) {
    await delay(500)
    return urls.map((_, i) => `mock-media-${Date.now()}-${i}`)
  },
  async publishPost(post: PostPayload): Promise<PublishResult> {
    await delay(1000)
    const validation = mockPublisher.validatePost(post)
    if (!validation.valid) return { success: false, error: validation.errors.join(', ') }
    return createMockResult('linkedin', post.title || post.content.slice(0, 30))
  },
  async getPostStatus(postId: string) {
    await delay(300)
    return { status: 'published', url: `https://linkedin.com/posts/${postId}` }
  },
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function mockPublish(platform: string, post: PostPayload): Promise<PublishResult> {
  await delay(800)
  return createMockResult(platform as 'linkedin', post.title || 'untitled')
}
