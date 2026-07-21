/**
 * Open-source / open-weight text models via OpenRouter.
 * IDs match OpenRouter slugs from GET /api/v1/models.
 */
export const OPENROUTER_TEXT_MODELS = [
  {
    id: 'meta-llama/llama-4-maverick',
    label: 'Llama 4 Maverick',
    description: 'Meta — flagship open multimodal MoE',
    provider: 'openrouter' as const,
    speed: 'medium' as const,
    costLevel: 'medium' as const,
    qualityScore: 93,
    contextSize: '1M',
    bestFor: 'Content generation, research, long context',
    useCases: ['Market research', 'Content generation', 'Outreach writing'],
  },
  {
    id: 'meta-llama/llama-4-scout',
    label: 'Llama 4 Scout',
    description: 'Meta — fast open Llama 4 for bulk tasks',
    provider: 'openrouter' as const,
    speed: 'fast' as const,
    costLevel: 'low' as const,
    qualityScore: 88,
    contextSize: '1M',
    bestFor: 'Fast drafts & bulk generation',
    useCases: ['Content generation', 'Analytics summary', 'Scheduling'],
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B',
    description: 'Meta — proven open-weight instruct model',
    provider: 'openrouter' as const,
    speed: 'medium' as const,
    costLevel: 'low' as const,
    qualityScore: 90,
    contextSize: '128K',
    bestFor: 'Reliable open-source writing',
    useCases: ['Content generation', 'Video scripts', 'Outreach writing'],
  },
  {
    id: 'deepseek/deepseek-v3.2',
    label: 'DeepSeek V3.2',
    description: 'DeepSeek — strong open reasoning & coding',
    provider: 'openrouter' as const,
    speed: 'medium' as const,
    costLevel: 'low' as const,
    qualityScore: 94,
    contextSize: '164K',
    bestFor: 'Research, strategy, complex analysis',
    useCases: ['Market research', 'Brand safety', 'Lead scoring'],
  },
  {
    id: 'deepseek/deepseek-r1',
    label: 'DeepSeek R1',
    description: 'DeepSeek — open reasoning model',
    provider: 'openrouter' as const,
    speed: 'slow' as const,
    costLevel: 'medium' as const,
    qualityScore: 95,
    contextSize: '164K',
    bestFor: 'Deep reasoning & safety checks',
    useCases: ['Brand safety', 'Lead scoring', 'Market research'],
  },
  {
    id: 'qwen/qwen3-235b-a22b-2507',
    label: 'Qwen3 235B',
    description: 'Alibaba — large open MoE instruct',
    provider: 'openrouter' as const,
    speed: 'medium' as const,
    costLevel: 'low' as const,
    qualityScore: 93,
    contextSize: '262K',
    bestFor: 'High-quality multilingual content',
    useCases: ['Content generation', 'Outreach writing', 'Market research'],
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct',
    label: 'Qwen3 Next 80B',
    description: 'Alibaba — efficient open MoE',
    provider: 'openrouter' as const,
    speed: 'fast' as const,
    costLevel: 'low' as const,
    qualityScore: 90,
    contextSize: '262K',
    bestFor: 'Fast quality at low cost',
    useCases: ['Content generation', 'Video scripts', 'Analytics summary'],
  },
  {
    id: 'mistralai/mistral-small-3.2-24b-instruct',
    label: 'Mistral Small 3.2',
    description: 'Mistral — compact open instruct',
    provider: 'openrouter' as const,
    speed: 'fast' as const,
    costLevel: 'low' as const,
    qualityScore: 87,
    contextSize: '128K',
    bestFor: 'Fast low-cost bulk tasks',
    useCases: ['Content generation', 'Analytics summary', 'Scheduling'],
  },
  {
    id: 'mistralai/mistral-nemo',
    label: 'Mistral Nemo',
    description: 'Mistral — open 12B multilingual',
    provider: 'openrouter' as const,
    speed: 'fast' as const,
    costLevel: 'low' as const,
    qualityScore: 84,
    contextSize: '128K',
    bestFor: 'Lightweight open generation',
    useCases: ['Content generation', 'Bulk generation'],
  },
  {
    id: 'google/gemma-3-27b-it',
    label: 'Gemma 3 27B',
    description: 'Google — open Gemma instruct',
    provider: 'openrouter' as const,
    speed: 'fast' as const,
    costLevel: 'low' as const,
    qualityScore: 86,
    contextSize: '128K',
    bestFor: 'Open Google-quality drafting',
    useCases: ['Content generation', 'Video scripts'],
  },
  {
    id: 'z-ai/glm-4.7-flash',
    label: 'GLM 4.7 Flash',
    description: 'Z.ai — fast open GLM',
    provider: 'openrouter' as const,
    speed: 'fast' as const,
    costLevel: 'low' as const,
    qualityScore: 88,
    contextSize: '200K',
    bestFor: 'Speed-first open generation',
    useCases: ['Content generation', 'Analytics summary', 'Lead scoring'],
  },
  {
    id: 'nousresearch/hermes-4-70b',
    label: 'Hermes 4 70B',
    description: 'Nous Research — open agentic instruct',
    provider: 'openrouter' as const,
    speed: 'medium' as const,
    costLevel: 'low' as const,
    qualityScore: 89,
    contextSize: '128K',
    bestFor: 'Agent workflows & tool-style writing',
    useCases: ['Outreach writing', 'Content generation', 'Strategy'],
  },
  {
    id: 'mistralai/mixtral-8x22b-instruct',
    label: 'Mixtral 8x22B',
    description: 'Mistral — open MoE instruct',
    provider: 'openrouter' as const,
    speed: 'medium' as const,
    costLevel: 'low' as const,
    qualityScore: 88,
    contextSize: '64K',
    bestFor: 'Open MoE writing & analysis',
    useCases: ['Market research', 'Content generation', 'Analytics summary'],
  },
  {
    id: 'google/gemma-4-31b-it',
    label: 'Gemma 4 31B',
    description: 'Google — latest open Gemma instruct',
    provider: 'openrouter' as const,
    speed: 'fast' as const,
    costLevel: 'low' as const,
    qualityScore: 89,
    contextSize: '262K',
    bestFor: 'Strong open drafting',
    useCases: ['Content generation', 'Video scripts', 'Outreach writing'],
  },
] as const

export type OpenRouterTextModelId = (typeof OPENROUTER_TEXT_MODELS)[number]['id']

export const DEFAULT_OPENROUTER_TEXT_MODEL: OpenRouterTextModelId = 'deepseek/deepseek-v3.2'

/** Layer 1 — quality-first (research, safety, outreach). */
export const OPENROUTER_TEXT_QUALITY_CHAIN: OpenRouterTextModelId[] = [
  'deepseek/deepseek-v3.2',
  'meta-llama/llama-4-maverick',
  'qwen/qwen3-235b-a22b-2507',
  'deepseek/deepseek-r1',
  'nousresearch/hermes-4-70b',
  'meta-llama/llama-3.3-70b-instruct',
]

/** Layer 2 — balanced / default agent work. */
export const DEFAULT_OPENROUTER_TEXT_CHAIN: OpenRouterTextModelId[] = [
  'deepseek/deepseek-v3.2',
  'meta-llama/llama-4-maverick',
  'qwen/qwen3-235b-a22b-2507',
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen3-next-80b-a3b-instruct',
  'google/gemma-4-31b-it',
  'mistralai/mixtral-8x22b-instruct',
  'mistralai/mistral-small-3.2-24b-instruct',
]

/** Layer 3 — fast/cheap last-resort models. */
export const OPENROUTER_TEXT_SPEED_CHAIN: OpenRouterTextModelId[] = [
  'qwen/qwen3-next-80b-a3b-instruct',
  'meta-llama/llama-4-scout',
  'z-ai/glm-4.7-flash',
  'mistralai/mistral-small-3.2-24b-instruct',
  'google/gemma-3-27b-it',
  'mistralai/mistral-nemo',
  'google/gemma-4-31b-it',
]

export function isOpenRouterTextModel(id: string): id is OpenRouterTextModelId {
  return OPENROUTER_TEXT_MODELS.some((m) => m.id === id)
}

/** True for any OpenRouter chat slug (provider/model). */
export function looksLikeOpenRouterModelId(id: string): boolean {
  return id.includes('/')
}
