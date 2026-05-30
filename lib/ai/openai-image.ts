import { getOpenAI, hasOpenAI, OPENAI_MODEL, OPENAI_MODEL_QUALITY } from '@/lib/ai/openai'
import type { KimiImagePrompt } from '@/lib/ai/kimi'
import type { ImageAspectRatioId } from '@/lib/models/media-options'

export const OPENAI_IMAGE_MODEL = normalizeOpenAIImageModel(
  process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-1.5',
)

export type OpenAIImageModelId =
  | 'dall-e-3'
  | 'dall-e-2'
  | 'gpt-image-1'
  | 'gpt-image-1.5'
  | 'gpt-image-1-mini'
  | 'gpt-image-2'

export type DalleQuality = 'standard' | 'hd'
export type GptImageQuality = 'low' | 'medium' | 'high'
export type GptImage2Resolution = '1k' | '2k' | '4k'
export type GptImageThinking = 'off' | 'low' | 'medium' | 'high'

const GPT_IMAGE_MODELS = new Set<OpenAIImageModelId>([
  'gpt-image-1',
  'gpt-image-1.5',
  'gpt-image-1-mini',
  'gpt-image-2',
])

/** Fallback order when a newer GPT Image model isn't available on the account yet. */
const GPT_IMAGE_FALLBACK_CHAIN: OpenAIImageModelId[] = [
  'gpt-image-1.5',
  'gpt-image-1',
  'gpt-image-1-mini',
]

const GPT_IMAGE_2_FALLBACK_CHAIN = ['gpt-image-2', 'gpt-image-2-2026-04-21'] as const

type Dalle3Size = '1024x1024' | '1792x1024' | '1024x1792'
type Dalle2Size = '256x256' | '512x512' | '1024x1024'
type GptImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto'

/** Accept env/UI aliases like gpt-image-2.0 → gpt-image-2. */
export function normalizeOpenAIImageModel(id: string): OpenAIImageModelId {
  const normalized = id.trim().toLowerCase()
  if (normalized === 'gpt-image-2.0' || normalized === 'gpt-image-2') return 'gpt-image-2'
  if (normalized === 'gpt-image-1.5') return 'gpt-image-1.5'
  if (normalized === 'gpt-image-1-mini') return 'gpt-image-1-mini'
  if (normalized === 'gpt-image-1') return 'gpt-image-1'
  if (normalized === 'dall-e-3') return 'dall-e-3'
  if (normalized === 'dall-e-2') return 'dall-e-2'
  return id as OpenAIImageModelId
}

export function isGptImageModel(model: OpenAIImageModelId): boolean {
  return GPT_IMAGE_MODELS.has(model)
}

function mapAspectToDalle3Size(aspectRatio: ImageAspectRatioId): Dalle3Size {
  switch (aspectRatio) {
    case '16:9':
      return '1792x1024'
    case '9:16':
      return '1024x1792'
    default:
      return '1024x1024'
  }
}

function mapAspectToGptImageSize(aspectRatio: ImageAspectRatioId): GptImageSize {
  switch (aspectRatio) {
    case '16:9':
      return '1536x1024'
    case '9:16':
      return '1024x1536'
    default:
      return '1024x1024'
  }
}

function mapAspectToGptImage2Size(
  aspectRatio: ImageAspectRatioId,
  resolution: GptImage2Resolution = '2k',
): string {
  if (resolution === '1k') return mapAspectToGptImageSize(aspectRatio)

  if (resolution === '4k') {
    switch (aspectRatio) {
      case '16:9':
        return '3840x2160'
      case '9:16':
        return '2160x3840'
      case '4:3':
        return '2880x2160'
      default:
        return '2880x2880'
    }
  }

  switch (aspectRatio) {
    case '16:9':
      return '2048x1152'
    case '9:16':
      return '1152x2048'
    case '4:3':
      return '2048x1536'
    default:
      return '2048x2048'
  }
}

function modelsToTryForGptImage(model: OpenAIImageModelId): string[] {
  if (model === 'gpt-image-2') {
    return [...GPT_IMAGE_2_FALLBACK_CHAIN, ...GPT_IMAGE_FALLBACK_CHAIN]
  }
  return [model, ...GPT_IMAGE_FALLBACK_CHAIN.filter((m) => m !== model)]
}

function isModelNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return msg.includes('does not exist') || msg.includes('model_not_found') || msg.includes('invalid model')
}

export function hasOpenAIImage(): boolean {
  return hasOpenAI()
}

export async function enhanceImagePromptWithOpenAI(input: {
  prompt: string
  brandContext?: string
  customPromptDetails?: string
  model?: string
}): Promise<KimiImagePrompt> {
  const openai = getOpenAI()
  const model = input.model || OPENAI_MODEL_QUALITY
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.8,
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

async function toDataUrl(b64: string, contentType = 'image/png'): Promise<string> {
  return `data:${contentType};base64,${b64}`
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(90000) })
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/png'
  return toDataUrl(buffer.toString('base64'), contentType)
}

async function extractImageData(response: { data?: Array<{ b64_json?: string | null; url?: string | null }> }): Promise<string> {
  const first = response.data?.[0]
  const b64 = first?.b64_json
  if (b64) return toDataUrl(b64)
  const url = first?.url
  if (url) return urlToDataUrl(url)
  throw new Error('OpenAI returned no image data')
}

async function renderGptImage(
  prompt: string,
  model: OpenAIImageModelId,
  aspectRatio: ImageAspectRatioId,
  quality: GptImageQuality,
  options?: { resolution?: GptImage2Resolution; thinking?: GptImageThinking },
): Promise<string> {
  const openai = getOpenAI()
  const trimmed = prompt.slice(0, model === 'gpt-image-2' ? 32000 : 4000)
  const isImage2 = model === 'gpt-image-2'
  const size = isImage2
    ? mapAspectToGptImage2Size(aspectRatio, options?.resolution || '2k')
    : mapAspectToGptImageSize(aspectRatio)
  const modelsToTry = modelsToTryForGptImage(model)

  let lastError: unknown
  for (const tryModel of modelsToTry) {
    try {
      const response = await openai.images.generate({
        model: tryModel,
        prompt: trimmed,
        n: 1,
        size: size as '1024x1024' | '1536x1024' | '1024x1536' | 'auto',
        quality,
        ...(isImage2 && options?.thinking && options.thinking !== 'off'
          ? { thinking: options.thinking }
          : {}),
      } as unknown as Parameters<typeof openai.images.generate>[0])
      if (!('data' in response)) {
        throw new Error('OpenAI returned unexpected streaming response')
      }
      return extractImageData(response)
    } catch (err) {
      lastError = err
      if (isModelNotFoundError(err) && tryModel !== modelsToTry[modelsToTry.length - 1]) continue
      throw err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('OpenAI image generation failed')
}

export async function renderImageWithOpenAI(
  prompt: string,
  model: OpenAIImageModelId,
  aspectRatio: ImageAspectRatioId = '1:1',
  options?: {
    quality?: DalleQuality
    gptImageQuality?: GptImageQuality
    gptImage2Resolution?: GptImage2Resolution
    gptImageThinking?: GptImageThinking
  },
): Promise<string> {
  const openai = getOpenAI()
  const trimmed = prompt.slice(0, model === 'dall-e-2' ? 1000 : 4000)

  if (model === 'dall-e-3') {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: trimmed,
      n: 1,
      size: mapAspectToDalle3Size(aspectRatio),
      quality: options?.quality || 'standard',
      response_format: 'b64_json',
    })
    return extractImageData(response)
  }

  if (model === 'dall-e-2') {
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: trimmed,
      n: 1,
      size: '1024x1024' satisfies Dalle2Size,
      response_format: 'b64_json',
    })
    return extractImageData(response)
  }

  return renderGptImage(prompt, model, aspectRatio, options?.gptImageQuality || 'medium', {
    resolution: options?.gptImage2Resolution,
    thinking: options?.gptImageThinking,
  })
}

export async function withOpenAIImage<T>(
  generator: () => Promise<T>,
): Promise<{ result: T; live: true }> {
  if (!hasOpenAIImage()) {
    throw new Error('OPENAI_API_KEY is required for OpenAI image generation. Add it to your .env