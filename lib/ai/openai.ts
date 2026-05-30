import OpenAI from 'openai'

/**
 * Central OpenAI integration. All AI generation in the app routes through here.
 *
 * Models are configurable via env so a single provider (OpenAI) powers every task.
 * - OPENAI_MODEL          → default model for most generation tasks
 * - OPENAI_MODEL_QUALITY  → higher-quality model for research / safety-critical tasks
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
export const OPENAI_MODEL_QUALITY = process.env.OPENAI_MODEL_QUALITY || 'gpt-4o'

let client: OpenAI | null = null

function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim()
}

export function hasOpenAI(): boolean {
  return Boolean(getApiKey())
}

export function requireOpenAI(): void {
  if (!hasOpenAI()) {
    throw new Error('OPENAI_API_KEY is required. Add it to your .env.local file.')
  }
}

export function getOpenAI(): OpenAI {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  if (!client) {
    client = new OpenAI({ apiKey })
  }
  return client
}

interface GenerateOptions {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
  model?: string
}

/**
 * Generate a JSON object from OpenAI using JSON mode and parse it into type T.
 * The caller is responsible for instructing the model on the exact JSON shape.
 */
async function createJSONCompletion<T>(opts: GenerateOptions): Promise<T> {
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model: opts.model || OPENAI_MODEL,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 2048,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
  })

  const text = completion.choices[0]?.message?.content?.trim() || '{}'
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('OpenAI returned malformed JSON')
  }
}

export async function generateJSON<T>(opts: GenerateOptions & { fallbackModel?: string }): Promise<T> {
  try {
    return await createJSONCompletion<T>(opts)
  } catch (err) {
    const primary = opts.model || OPENAI_MODEL
    if (opts.fallbackModel && opts.fallbackModel !== primary) {
      return createJSONCompletion<T>({ ...opts, model: opts.fallbackModel })
    }
    throw err
  }
}

async function createTextCompletion(opts: GenerateOptions): Promise<string> {
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model: opts.model || OPENAI_MODEL,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
  })
  return completion.choices[0]?.message?.content?.trim() || ''
}

/** Generate a plain text completion from OpenAI. */
export async function generateText(opts: GenerateOptions & { fallbackModel?: string }): Promise<string> {
  try {
    return await createTextCompletion(opts)
  } catch (err) {
    const primary = opts.model || OPENAI_MODEL
    if (opts.fallbackModel && opts.fallbackModel !== primary) {
      return createTextCompletion({ ...opts, model: opts.fallbackModel })
    }
    throw err
  }
}

/** Run an OpenAI-backed generator. Requires OPENAI_API_KEY — no demo/mock fallback. */
export async function withOpenAI<T>(generator: () => Promise<T>): Promise<{ result: T; live: true }> {
  requireOpenAI()
  const result = await generator()
  return { result, live: true }
}
