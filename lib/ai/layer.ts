import 'server-only'

import { hasKimi } from '@/lib/ai/kimi'
import { getOpenAI, hasOpenAI } from '@/lib/ai/openai'
import { modelDisplayNameToId, buildModelChain } from '@/lib/models/routing'

export type TextAIProvider = 'openai' | 'kimi'

export interface LayerGenerateOptions {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
  model?: string
  fallbackModel?: string
  /** Explicit ordered model chain — overrides model/fallbackModel when set. */
  modelChain?: string[]
}

export interface LayerChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LayerChatOptions {
  messages: LayerChatMessage[]
  temperature?: number
  maxTokens?: number
  model?: string
  fallbackModel?: string
  modelChain?: string[]
}

const KIMI_MODEL_PREFIX = /^kimi/i

export function getTextProviderForModel(modelId: string): TextAIProvider {
  return KIMI_MODEL_PREFIX.test(modelId.trim()) ? 'kimi' : 'openai'
}

export function isTextModelAvailable(modelId: string): boolean {
  const provider = getTextProviderForModel(modelId)
  return provider === 'kimi' ? hasKimi() : hasOpenAI()
}

/** True when at least one text-generation provider is configured. */
export function hasTextAI(): boolean {
  return hasOpenAI() || hasKimi()
}

export function requireTextAI(): void {
  if (!hasTextAI()) {
    throw new Error(
      'No AI provider configured. Add OPENAI_API_KEY and/or KIMI_API_KEY to your .env.local file.',
    )
  }
}

function normalizeModelId(model?: string): string | undefined {
  if (!model?.trim()) return undefined
  return modelDisplayNameToId(model.trim())
}

function resolveChain(opts: LayerGenerateOptions | LayerChatOptions): string[] {
  if (opts.modelChain?.length) {
    return opts.modelChain
      .map((m) => normalizeModelId(m))
      .filter((m): m is string => Boolean(m))
      .filter(isTextModelAvailable)
  }
  return buildModelChain({ model: opts.model, fallbackModel: opts.fallbackModel })
}

async function openaiJSONCompletion<T>(opts: LayerGenerateOptions, model: string): Promise<T> {
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model,
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
    throw new Error(`OpenAI (${model}) returned malformed JSON`)
  }
}

async function openaiTextCompletion(opts: LayerGenerateOptions, model: string): Promise<string> {
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
  })
  return completion.choices[0]?.message?.content?.trim() || ''
}

async function kimiJSONCompletion<T>(opts: LayerGenerateOptions, model: string): Promise<T> {
  const { getKimiClient } = await import('@/lib/ai/kimi')
  const kimi = getKimiClient()
  const completion = await kimi.chat.completions.create({
    model,
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
    throw new Error(`Kimi (${model}) returned malformed JSON`)
  }
}

async function kimiTextCompletion(opts: LayerGenerateOptions, model: string): Promise<string> {
  const { getKimiClient } = await import('@/lib/ai/kimi')
  const kimi = getKimiClient()
  const completion = await kimi.chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
  })
  return completion.choices[0]?.message?.content?.trim() || ''
}

async function openaiChatCompletion(opts: LayerChatOptions, model: string): Promise<string> {
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
    messages: opts.messages,
  })
  return completion.choices[0]?.message?.content?.trim() || ''
}

async function kimiChatCompletion(opts: LayerChatOptions, model: string): Promise<string> {
  const { getKimiClient } = await import('@/lib/ai/kimi')
  const kimi = getKimiClient()
  const completion = await kimi.chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
    messages: opts.messages,
  })
  return completion.choices[0]?.message?.content?.trim() || ''
}

function formatLayerError(errors: Array<{ model: string; error: unknown }>): string {
  const details = errors
    .map(({ model, error }) => `${model}: ${error instanceof Error ? error.message : String(error)}`)
    .join('; ')
  return `All AI providers failed — ${details}`
}

/** Layered JSON generation — tries each model in the chain until one succeeds. */
export async function generateJSON<T>(opts: LayerGenerateOptions): Promise<T> {
  requireTextAI()
  const chain = resolveChain(opts)
  if (chain.length === 0) {
    throw new Error('No available AI models for this task. Check your API keys and model routing.')
  }

  const errors: Array<{ model: string; error: unknown }> = []
  for (const model of chain) {
    try {
      const provider = getTextProviderForModel(model)
      if (provider === 'kimi') return await kimiJSONCompletion<T>(opts, model)
      return await openaiJSONCompletion<T>(opts, model)
    } catch (err) {
      errors.push({ model, error: err })
    }
  }
  throw new Error(formatLayerError(errors))
}

/** Layered text generation — tries each model in the chain until one succeeds. */
export async function generateText(opts: LayerGenerateOptions): Promise<string> {
  requireTextAI()
  const chain = resolveChain(opts)
  if (chain.length === 0) {
    throw new Error('No available AI models for this task. Check your API keys and model routing.')
  }

  const errors: Array<{ model: string; error: unknown }> = []
  for (const model of chain) {
    try {
      const provider = getTextProviderForModel(model)
      if (provider === 'kimi') return await kimiTextCompletion(opts, model)
      return await openaiTextCompletion(opts, model)
    } catch (err) {
      errors.push({ model, error: err })
    }
  }
  throw new Error(formatLayerError(errors))
}

/** Layered multi-turn chat — tries each model in the chain until one succeeds. */
export async function generateChat(opts: LayerChatOptions): Promise<string> {
  requireTextAI()
  const chain = resolveChain(opts)
  if (chain.length === 0) {
    throw new Error('No available AI models for this task. Check your API keys and model routing.')
  }

  const errors: Array<{ model: string; error: unknown }> = []
  for (const model of chain) {
    try {
      const provider = getTextProviderForModel(model)
      if (provider === 'kimi') return await kimiChatCompletion(opts, model)
      return await openaiChatCompletion(opts, model)
    } catch (err) {
      errors.push({ model, error: err })
    }
  }
  throw new Error(formatLayerError(errors))
}

/** Run an AI-backed generator. Requires at least one text provider — no demo/mock fallback. */
export async function withAI<T>(generator: () => Promise<T>): Promise<{ result: T; live: true }> {
  requireTextAI()
  const result = await generator()
  return { result, live: true }
}

/** @deprecated Use withAI — kept for backward compatibility. */
export async function withOpenAI<T>(generator: () => Promise<T>): Promise<{ result: T; live: true }> {
  return withAI(generator)
}
