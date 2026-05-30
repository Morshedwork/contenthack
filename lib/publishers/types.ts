import type { Platform } from '@/types'

export interface PostPayload {
  title: string
  content: string
  mediaUrls?: string[]
  scheduledAt?: string
}

export interface PublishResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
}

export interface PublisherAdapter {
  platform: Platform
  validatePost(post: PostPayload): { valid: boolean; errors: string[] }
  uploadMedia(urls: string[]): Promise<string[]>
  publishPost(post: PostPayload): Promise<PublishResult>
  getPostStatus(postId: string): Promise<{ status: string; url?: string }>
}

export function createMockResult(platform: Platform, title: string): PublishResult {
  const slug = title.toLowerCase().replace(/\s+/g, '-').slice(0, 30)
  return {
    success: true,
    postId: `mock-${platform}-${Date.now()}`,
    url: `https://${platform}.com/posts/mock/${slug}`,
  }
}
