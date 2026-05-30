import type { BrandProfile, ExtractedBrandTheme } from '@/types'

export function normalizeHex(hex: string): string {
  const trimmed = hex.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/)!
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return trimmed
}

export function resolveBrandTheme(
  profile: BrandProfile | undefined,
  themeId?: string,
): ExtractedBrandTheme | undefined {
  if (!profile?.themeCollection?.length) return undefined
  const id = themeId || profile.activeThemeId
  if (!id) return profile.themeCollection[0]
  return profile.themeCollection.find((t) => t.id === id) ?? profile.themeCollection[0]
}

export function buildThemePromptContext(theme?: ExtractedBrandTheme): string {
  if (!theme) return ''
  const palette = theme.colors
    .map((c) => `${c.role}${c.label ? ` (${c.label})` : ''}: ${c.hex}`)
    .join(', ')
  return `Brand theme reference from ${theme.companyName} (${theme.sourceUrl}):
Palette: ${palette}
Typography: ${theme.typography}
Visual style: ${theme.visualStyle}
Mood: ${theme.mood}${theme.notes ? `\nNotes: ${theme.notes}` : ''}`
}
