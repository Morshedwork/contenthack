/** Coerce workspace / API custom prompt values to a safe string (LLM JSON may return objects). */
export function normalizeCustomPromptDetails(value: unknown): string | undefined {
  if (value == null) return undefined

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    const s = String(value).trim()
    return s || undefined
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
          return item.text.trim()
        }
        return String(item).trim()
      })
      .filter(Boolean)
      .join('\n')
    return joined || undefined
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.text === 'string') {
      const trimmed = record.text.trim()
      return trimmed || undefined
    }
    if (typeof record.instructions === 'string') {
      const trimmed = record.instructions.trim()
      return trimmed || undefined
    }
    try {
      const serialized = JSON.stringify(value)
      return serialized === '{}' ? undefined : serialized
    } catch {
      return undefined
    }
  }

  const fallback = String(value).trim()
  return fallback || undefined
}

/** Appends user-provided manual prompt instructions to an AI user prompt. */
export function appendCustomPrompt(base: string, customPromptDetails?: unknown): string {
  const normalized = normalizeCustomPromptDetails(customPromptDetails)
  if (!normalized) return base
  return `${base}

Additional manual instructions from the user:
"""
${normalized}
"""`.trim()
}

const PLATFORM_HINTS: { keyword: string; platform: import('@/types').Platform }[] = [
  { keyword: 'linkedin', platform: 'linkedin' },
  { keyword: 'instagram', platform: 'instagram' },
  { keyword: 'facebook', platform: 'facebook' },
  { keyword: 'twitter', platform: 'x' },
  { keyword: 'tiktok', platform: 'tiktok' },
  { keyword: 'youtube', platform: 'youtube' },
]

/** Infer target platforms from natural-language custom instructions (e.g. "LinkedIn posts"). */
export function platformsFromPromptHint(
  customPromptDetails: unknown,
  fallback: import('@/types').Platform[],
): import('@/types').Platform[] {
  const text = normalizeCustomPromptDetails(customPromptDetails)?.toLowerCase() ?? ''
  if (!text) return fallback.length > 0 ? fallback : ['linkedin']

  const matched = PLATFORM_HINTS.filter(({ keyword }) => text.includes(keyword)).map((h) => h.platform)
  if (matched.length > 0) return [...new Set(matched)]
  return fallback.length > 0 ? fallback : ['linkedin']
}
