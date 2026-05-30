import { getOpenAI, hasOpenAI, OPENAI_MODEL, OPENAI_MODEL_QUALITY } from '@/lib/ai/openai'
import type { KimiImagePrompt } from '@/lib/ai/kimi'
import type { ImageAspectRatioId } from '@/lib/models/media-options'

export type OpenAIImageModelId = 'dall-e-3' | 'dall-e-2' | 'gpt-image-1'

type Dalle3Size = '1024x1024' | '1792x1024' | '1024x1792'
type Dalle2Size = '256x256' | '512x512' | '1024x1024'
type GptImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto'

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

export async function renderImageWithOpenAI(
  prompt: string,
  model: OpenAIImageModelId,
  aspectRatio: ImageAspectRatioId = '1:1',
  options?: { quality?: 'standard' | 'hd' },
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
    const first = response.data?.[0]
    const b64 = first?.b64_json
    if (b64) return toDataUrl(b64)
    const url = first?.url
    if (url) return urlToDataUrl(url)
    throw new Error('OpenAI returned no image data')
  }

  if (model === 'dall-e-2') {
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: trimmed,
      n: 1,
      size: '1024x1024' satisfies Dalle2Size,
      response_format: 'b64_json',
    })
    const first = response.data?.[0]
    const b64 = first?.b64_json
    if (b64) return toDataUrl(b64)
    const url = first?.url
    if (url) return urlToDataUrl(url)
    throw new Error('OpenAI returned no image data')
  }

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: trimmed,
    n: 1,
    size: mapAspectToGptImageSize(aspectRatio),
    quality: options?.quality === 'hd' ? 'high' : 'medium',
  })
  const first = response.data?.[0]
  const b64 = first?.b64_json
  if (b64) return toDataUrl(b64)
  const url = first?.url
  if (url) return urlToDataUrl(url)
  throw new Error('OpenAI returned no image data')
}

export async function withOpenAIImage<T>(
  generator: () => Promise<T>,
): Promise<{ result: T; live: true }> {
  if (!hasOpenAIImage()) {
    throw new Error('OPENAI_API_KEY is required for OpenAI image generation. Add it to your .env.local file.')
  }
  const result = await generator()
  return { result, live: true }
}

export { OPENAI_MODEL, OPENAI_MODEL_QUALITY }
