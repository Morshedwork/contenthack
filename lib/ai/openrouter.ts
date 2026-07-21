import type {
  OpenRouterImageQualityId,
  OpenRouterImageResolutionId,
  OpenRouterVideoModelId,
  OpenRouterVideoResolutionId,
} from '@/lib/models/media-options'

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export type OpenRouterVideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '3:2' | '2:3' | '21:9' | '9:21'

interface OpenRouterVideoJob {
  id: string
  polling_url: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'expired'
  error?: string
  unsigned_urls?: string[]
  generation_id?: string
}

interface OpenRouterImageResponse {
  data?: Array<{ b64_json?: string; media_type?: string }>
  error?: { message?: string }
}

function getApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY?.trim()
}

export function hasOpenRouter(): boolean {
  return Boolean(getApiKey())
}

function authHeaders(): Record<string, string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured')
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER?.trim() || 'https://contentops.ai',
    'X-Title': process.env.OPENROUTER_APP_TITLE?.trim() || 'ContentOps AI',
  }
}

async function openrouterFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${OPENROUTER_BASE}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `OpenRouter request failed (${res.status})`)
  }
  return res
}

function mapImageResolution(resolution?: OpenRouterImageResolutionId): string | undefined {
  if (!resolution) return undefined
  return resolution.toUpperCase()
}

function mapImageQuality(quality?: OpenRouterImageQualityId): string | undefined {
  return quality
}

export async function renderImageWithOpenRouter(input: {
  prompt: string
  model: string
  aspectRatio?: string
  resolution?: OpenRouterImageResolutionId
  quality?: OpenRouterImageQualityId
  outputFormat?: 'png' | 'jpeg' | 'webp'
}): Promise<string> {
  const res = await openrouterFetch('/images', {
    method: 'POST',
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio || '1:1',
      resolution: mapImageResolution(input.resolution),
      quality: mapImageQuality(input.quality),
      output_format: input.outputFormat || 'png',
      n: 1,
    }),
  })

  const json = (await res.json()) as OpenRouterImageResponse
  if (json.error?.message) throw new Error(json.error.message)

  const b64 = json.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenRouter returned no image data')

  const mediaType = json.data?.[0]?.media_type || 'image/png'
  return `data:${mediaType};base64,${b64}`
}

async function pollVideoJob(job: OpenRouterVideoJob, opts?: { maxWaitMs?: number; pollIntervalMs?: number }): Promise<OpenRouterVideoJob> {
  const maxWait = opts?.maxWaitMs ?? 600_000
  const interval = opts?.pollIntervalMs ?? 15_000
  const start = Date.now()
  let status = job

  for (;;) {
    if (status.status === 'completed') return status
    if (status.status === 'failed') throw new Error(status.error || 'OpenRouter video generation failed')
    if (status.status === 'cancelled' || status.status === 'expired') {
      throw new Error(status.error || `OpenRouter video generation ${status.status}`)
    }
    if (Date.now() - start >= maxWait) break

    await new Promise((r) => setTimeout(r, interval))

    if (!status.polling_url) throw new Error('OpenRouter video job missing polling_url')

    const pollingUrl = new URL(status.polling_url, 'https://openrouter.ai')
    const pollRes = await fetch(pollingUrl.toString(), {
      headers: { Authorization: authHeaders().Authorization },
    })
    if (!pollRes.ok) {
      throw new Error(await pollRes.text().catch(() => pollRes.statusText))
    }
    status = (await pollRes.json()) as OpenRouterVideoJob
  }

  throw new Error('OpenRouter video generation timed out — try again later')
}

/** Public playback URL via our proxy (OpenRouter content requires server auth). */
export function openRouterVideoProxyUrl(jobId: string): string {
  return `/api/media/openrouter/video/${encodeURIComponent(jobId)}/content`
}

export async function generateVideoWithOpenRouter(input: {
  prompt: string
  model: OpenRouterVideoModelId | string
  duration?: number
  resolution?: OpenRouterVideoResolutionId
  aspectRatio?: OpenRouterVideoAspectRatio
  generateAudio?: boolean
  wait?: boolean
}): Promise<{ jobId: string; url?: string; status: OpenRouterVideoJob['status'] }> {
  const res = await openrouterFetch('/videos', {
    method: 'POST',
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt.slice(0, 5000),
      duration: input.duration ?? 5,
      resolution: input.resolution || '720p',
      aspect_ratio: input.aspectRatio || '16:9',
      generate_audio: input.generateAudio ?? false,
    }),
  })

  const job = (await res.json()) as OpenRouterVideoJob
  if (!job.id) throw new Error('OpenRouter did not return a video job id')

  if (input.wait === false) {
    return { jobId: job.id, status: job.status }
  }

  const completed = await pollVideoJob(job)
  const externalUrl = completed.unsigned_urls?.find((u) => !u.includes('openrouter.ai/api/'))
  const url = externalUrl || openRouterVideoProxyUrl(job.id)
  return { jobId: job.id, url, status: completed.status }
}

export async function fetchOpenRouterVideoContent(jobId: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await openrouterFetch(`/videos/${encodeURIComponent(jobId)}/content?index=0`)
  const contentType = res.headers.get('content-type') || 'video/mp4'
  const buffer = Buffer.from(await res.arrayBuffer())
  return { buffer, contentType }
}

export async function withOpenRouter<T>(generator: () => Promise<T>): Promise<{ result: T; live: true }> {
  if (!hasOpenRouter()) {
    throw new Error('OPENROUTER_API_KEY is required. Add it to your .env.local file.')
  }
  const result = await generator()
  return { result, live: true }
}

export async function openRouterChatCompletion(input: {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  maxTokens?: number
  json?: boolean
}): Promise<string> {
  const body: Record<string, unknown> = {
    model: input.model,
    messages: input.messages,
    temperature: input.temperature ?? 0.7,
    max_tokens: input.maxTokens ?? 2048,
  }
  if (input.json) {
    body.response_format = { type: 'json_object' }
  }

  const res = await openrouterFetch('/chat/completions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null; reasoning?: string | null } }>
    error?: { message?: string }
  }
  if (json.error?.message) throw new Error(json.error.message)
  const message = json.choices?.[0]?.message
  const content = message?.content?.trim() || ''
  if (content) return content
  // Reasoning models (e.g. DeepSeek R1) may put text only in `reasoning`
  const reasoning = message?.reasoning?.trim() || ''
  if (reasoning) return reasoning.slice(0, 4000)
  return ''
}

export async function openRouterJSONCompletion<T>(input: {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  maxTokens?: number
}): Promise<T> {
  const text = await openRouterChatCompletion({ ...input, json: true })
  try {
    return JSON.parse(text || '{}') as T
  } catch {
    throw new Error(`OpenRouter (${input.model}) returned malformed JSON`)
  }
}
