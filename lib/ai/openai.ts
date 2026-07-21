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

function isOpenAIDisabled(): boolean {
  const flag = process.env.OPENAI_DISABLED?.trim().toLowerCase()
  return flag === 'true' || flag === '1' || flag === 'yes'
}

export function hasOpenAI(): boolean {
  return Boolean(getApiKey()) && !isOpenAIDisabled()
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
