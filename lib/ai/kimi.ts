import OpenAI from 'openai'

export const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k2.5'
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/v1'

let client: OpenAI | null = null

function getApiKey(): string | undefined {
  return process.env.KIMI_API_KEY?.trim()
}

export function hasKimi(): boolean {
  return Boolean(getApiKey())
}

function getKimi(): OpenAI {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('KIMI_API_KEY is not configured')
  if (!client) {
    client = new OpenAI({ apiKey, baseURL: KIMI_BASE_URL })
  }
  return client
}

export interface KimiImagePrompt {
  enhancedPrompt: string
  style: string
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3'
  negativePrompt: string
}

export async function enhanceImagePrompt(input: {
  prompt: string
  brandContext?: string
  customPromptDetails?: string
  model?: string
}): Promise<KimiImagePrompt> {
  const kimi = getKimi()
  const model = input.model || KIMI_MODEL
  const completion = await kimi.chat.completions.create({
    model,
    temperature: 1,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a senior visual creative director for social media marketing. Transform brief user prompts into production-ready image generation prompts. Respond only with valid JSON.',
      },
      {
        role: 'user',
        content: `${input.brandContext ? `Brand context:\n${input.brandContext}\n\n` : ''}User prompt: ${input.prompt}
${input.customPromptDetails ? `\nAdditional instructions: ${input.customPromptDetails}` : ''}

Return JSON:
{
  "enhancedPrompt": "detailed photorealistic image prompt, max 400 chars",
  "style": "short style label e.g. photorealistic, flat illustration",
  "aspectRatio": "1:1" | "16:9" | "9:16" | "4:3",
  "negativePrompt": "things to avoid in the image"
}`,
      },
    ],
  })

  const text = completion.choices[0]?.message?.content?.trim() || '{}'
  const data = JSON.parse(text) as Partial<KimiImagePrompt>
  return {
    enhancedPrompt: data.enhancedPrompt || input.prompt,
    style: data.style || 'photorealistic',
    aspectRatio: data.aspectRatio || '1:1',
    negativePrompt: data.negativePrompt || 'blurry, low quality, watermark, text artifacts',
  }
}

const ASPECT_DIMENSIONS: Record<KimiImagePrompt['aspectRatio'], { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
}

export type PollinationsRenderModel =
  | 'flux'
  | 'flux-2-dev'
  | 'klein'
  | 'klein-large'
  | 'zimage'
  | 'seedream'
  | 'gptimage'

/** Render an image from a Kimi-enhanced prompt using Pollinations (no extra API key). */
export async function renderImageFromPrompt(
  prompt: string,
  aspectRatio: KimiImagePrompt['aspectRatio'] = '1:1',
  options?: {
    renderModel?: PollinationsRenderModel
    negativePrompt?: string
    quality?: 'low' | 'medium' | 'high' | 'hd'
  },
): Promise<string> {
  const { width, height } = ASPECT_DIMENSIONS[aspectRatio]
  const encoded = encodeURIComponent(prompt.slice(0, 500))
  const model = options?.renderModel || 'flux'
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model,
    nologo: 'true',
    seed: String(Date.now()),
    quality: options?.quality || 'medium',
  })
  if (options?.negativePrompt) {
    params.set('negative', options.negativePrompt.slice(0, 200))
  }
  const url = `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`

  const res = await fetch(url, { signal: AbortSignal.timeout(90000) })
  if (!res.ok) throw new Error(`Image render failed (${res.status})`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

export async function withKimi<T>(generator: () => Promise<T>): Promise<{ result: T; live: true }> {
  if (!hasKimi()) {
    throw new Error('KIMI_API_KEY is required. Add it to your .env.local file.')
  }
  const result = await generator()
  return { result, live: true }
}
