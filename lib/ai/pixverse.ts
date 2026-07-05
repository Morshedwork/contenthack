import { randomUUID } from 'crypto'
import { normalizePixverseVideoParams } from '@/lib/models/media-options'

const PIXVERSE_BASE = 'https://app-api.pixverse.ai/openapi/v2'

export type PixverseModel = 'v4.5' | 'v5' | 'v5.5' | 'v6'
export type PixverseQuality = '360p' | '540p' | '720p' | '1080p'
export type PixverseAspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16'

interface PixverseResponse<T> {
  ErrCode: number
  ErrMsg: string
  Resp: T
}

interface VideoSubmitResp {
  video_id: number
  credits?: number
}

interface VideoStatusResp {
  id: number
  status: number
  url?: string
  prompt?: string
  outputWidth?: number
  outputHeight?: number
}

function getApiKey(): string | undefined {
  return process.env.PIXVERSE_API_KEY?.trim()
}

export function hasPixverse(): boolean {
  return Boolean(getApiKey())
}

async function pixverseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('PIXVERSE_API_KEY is not configured')

  const res = await fetch(`${PIXVERSE_BASE}${path}`, {
    ...init,
    headers: {
      'API-KEY': apiKey,
      'Ai-trace-id': randomUUID(),
      ...(init?.headers || {}),
    },
  })

  const data = (await res.json()) as PixverseResponse<T>
  if (data.ErrCode !== 0) {
    const msg = data.ErrMsg || `PixVerse error ${data.ErrCode}`
    if (/invalid parameter/i.test(msg)) {
      throw new Error(
        `${msg} — check duration (5 or 8s; v6 also allows 10/15s), quality (1080p requires 5s only), and model.`,
      )
    }
    throw new Error(msg)
  }
  return data.Resp
}

export async function submitTextToVideo(input: {
  prompt: string
  model?: PixverseModel
  duration?: number
  quality?: PixverseQuality
  aspectRatio?: PixverseAspectRatio
}): Promise<number> {
  const model = (input.model || process.env.PIXVERSE_MODEL || 'v4.5') as PixverseModel
  const { duration, quality } = normalizePixverseVideoParams({
    model,
    duration: input.duration ?? 5,
    quality: input.quality || '540p',
  })

  const resp = await pixverseFetch<VideoSubmitResp>('/video/text/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: input.prompt.slice(0, 5000),
      model,
      duration,
      quality,
      aspect_ratio: input.aspectRatio || '16:9',
      motion_mode: 'normal',
    }),
  })
  return resp.video_id
}

export async function getVideoStatus(videoId: number): Promise<VideoStatusResp> {
  return pixverseFetch<VideoStatusResp>(`/video/result/${videoId}`, { method: 'GET' })
}

export async function waitForVideo(
  videoId: number,
  opts?: { maxWaitMs?: number; pollIntervalMs?: number }
): Promise<VideoStatusResp> {
  const maxWait = opts?.maxWaitMs ?? 180000
  const interval = opts?.pollIntervalMs ?? 4000
  const start = Date.now()

  for (;;) {
    if (Date.now() - start >= maxWait) break
    const status = await getVideoStatus(videoId)
    if (status.status === 1 && status.url) return status
    if (status.status === 7) throw new Error('Video blocked by content moderation')
    if (status.status === 8) throw new Error('Video generation failed')
    await new Promise((r) => setTimeout(r, interval))
  }

  throw new Error('Video generation timed out - try again or check PixVerse dashboard')
}

export async function generateVideo(input: {
  prompt: string
  model?: PixverseModel
  duration?: number
  quality?: PixverseQuality
  aspectRatio?: PixverseAspectRatio
  wait?: boolean
}): Promise<{ videoId: number; url?: string; status: VideoStatusResp }> {
  const videoId = await submitTextToVideo(input)
  if (input.wait === false) {
    return { videoId, status: { id: videoId, status: 5 } }
  }
  const status = await waitForVideo(videoId)
  return { videoId, url: status.url, status }
}

export async function withPixverse<T>(generator: () => Promise<T>): Promise<{ result: T; live: true }> {
  if (!hasPixverse()) {
    throw new Error('PIXVERSE_API_KEY is required. Add it to your .env.local file.')
  }
  const result = await generator()
  return { result, live: true }
}
