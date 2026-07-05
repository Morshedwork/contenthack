import 'server-only'

import type { BrandThemeColor, ExtractedBrandTheme } from '@/types'
import { normalizeHex } from '@/lib/brand/theme-context'
import { generateJSON, hasTextAI } from '@/lib/ai/layer'
import { crustdataPromptBlock, fetchCompanyEnrichByDomain } from '@/lib/ai/crustdata'
import { MODEL_TASK, resolveTaskModel, type TaskModelConfig } from '@/lib/models/routing'

interface ThemeAnalysis {
  companyName: string
  colors: BrandThemeColor[]
  typography: string
  visualStyle: string
  mood: string
  notes: string
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) throw new Error('URL is required')
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

function resolveHref(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href
  } catch {
    return href
  }
}

function extractColorsFromHtml(html: string): string[] {
  const colors = new Set<string>()

  const themeMeta =
    html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i)
  if (themeMeta?.[1]) colors.add(themeMeta[1].trim())

  const msTile =
    html.match(/<meta[^>]+name=["']msapplication-TileColor["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']msapplication-TileColor["']/i)
  if (msTile?.[1]) colors.add(msTile[1].trim())

  for (const match of html.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) {
    colors.add(match.toLowerCase())
  }

  for (const match of html.match(/rgba?\([^)]{3,40}\)/gi) ?? []) {
    colors.add(match)
  }

  for (const match of html.match(/--[\w-]*(?:color|bg|primary|secondary|accent|brand)[\w-]*:\s*([^;}{]+)/gi) ?? []) {
    const value = match.split(':').slice(1).join(':').trim()
    if (value) colors.add(value)
  }

  return [...colors].slice(0, 40)
}

function extractSiteName(html: string): string | undefined {
  const og =
    html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i)
  if (og?.[1]) return og[1].trim()

  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return title?.[1]?.trim()
}

function extractLogoUrl(html: string, baseUrl: string): string | undefined {
  const apple =
    html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i)
  if (apple?.[1]) return resolveHref(apple[1], baseUrl)

  const icon =
    html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i)
  if (icon?.[1]) return resolveHref(icon[1], baseUrl)

  return undefined
}

async function fetchPageSignals(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ContentOps-BrandThemeBot/1.0',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`Could not fetch ${url} (${res.status})`)
  }

  const html = (await res.text()).slice(0, 150000)
  return {
    html,
    colors: extractColorsFromHtml(html),
    siteName: extractSiteName(html),
    logoUrl: extractLogoUrl(html, url),
  }
}

function hashHue(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const light = l / 100
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = light - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function demoThemeFromHostname(
  sourceUrl: string,
  hostname: string,
  detectedColors: string[],
  siteName: string | undefined,
  id: string,
): ExtractedBrandTheme {
  const baseName = siteName || hostname.split('.')[0].replace(/-/g, ' ')
  const hue = hashHue(hostname)
  const primary = hslToHex(hue, 72, 48)
  const secondary = hslToHex((hue + 40) % 360, 55, 38)
  const accent = hslToHex((hue + 180) % 360, 70, 55)
  const background = hslToHex(hue, 20, 97)
  const text = hslToHex(hue, 25, 18)

  const colors: BrandThemeColor[] = [
    { role: 'primary', hex: primary, label: 'Primary brand' },
    { role: 'secondary', hex: secondary, label: 'Secondary' },
    { role: 'accent', hex: accent, label: 'Accent' },
    { role: 'background', hex: background, label: 'Background' },
    { role: 'text', hex: text, label: 'Text' },
  ]

  if (detectedColors[0]) {
    colors.unshift({ role: 'primary', hex: normalizeHex(detectedColors[0]), label: 'Detected' })
  }

  return {
    id,
    sourceUrl,
    companyName: baseName.charAt(0).toUpperCase() + baseName.slice(1),
    extractedAt: new Date().toISOString(),
    colors: colors.slice(0, 6),
    typography: 'Modern sans-serif, clean hierarchy',
    visualStyle: 'Professional digital brand',
    mood: 'Confident and approachable',
    notes: detectedColors.length
      ? `Heuristic extraction from ${detectedColors.length} color signals in page HTML.`
      : 'Heuristic palette generated from domain — set OPENAI_API_KEY for richer analysis.',
  }
}

export async function extractBrandThemeFromUrl(
  urlInput: string,
  modelConfig?: TaskModelConfig,
): Promise<ExtractedBrandTheme> {
  const sourceUrl = normalizeUrl(urlInput)
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '')
  const id = `theme-${Date.now().toString(36)}`

  let signals = {
    html: '',
    colors: [] as string[],
    siteName: undefined as string | undefined,
    logoUrl: undefined as string | undefined,
  }

  try {
    signals = await fetchPageSignals(sourceUrl)
  } catch {
    // Fall back to heuristic palette when fetch fails (demo / blocked sites)
  }

  if (hasTextAI()) {
    const mc = modelConfig ?? resolveTaskModel(MODEL_TASK.CONTENT_GENERATION)
    const companyContext = await fetchCompanyEnrichByDomain(hostname)
    const analysis = await generateJSON<ThemeAnalysis>({
      model: mc.model,
      fallbackModel: mc.fallbackModel,
      modelChain: mc.modelChain,
      temperature: mc.temperature,
      maxTokens: mc.maxTokens,
      system:
        'You are a brand identity analyst. Extract a cohesive brand theme palette and visual direction from website signals. Use CrustData company data when provided. Always return valid JSON with hex colors.',
      user: `Analyze brand theme for: ${sourceUrl}
${crustdataPromptBlock(companyContext, 'company profile')}
Site name hint: ${signals.siteName || hostname}
Colors found in HTML/CSS: ${signals.colors.join(', ') || 'none detected'}
HTML snippet (first 4000 chars):
${signals.html.slice(0, 4000)}

Return JSON:
{
  "companyName": "string",
  "colors": [
    {"role": "primary"|"secondary"|"accent"|"background"|"text"|"neutral", "hex": "#RRGGBB", "label": "optional"}
  ],
  "typography": "font/style description",
  "visualStyle": "e.g. minimal, bold, corporate",
  "mood": "e.g. professional, playful",
  "notes": "brief brand visual notes for image/video generation"
}`,
    })

    return {
      id,
      sourceUrl,
      companyName: analysis.companyName || signals.siteName || hostname,
      extractedAt: new Date().toISOString(),
      colors: (analysis.colors ?? []).map((c) => ({
        ...c,
        hex: normalizeHex(c.hex),
      })),
      typography: analysis.typography || 'Modern sans-serif',
      visualStyle: analysis.visualStyle || 'Professional',
      mood: analysis.mood || 'Professional',
      logoUrl: signals.logoUrl,
      notes: analysis.notes,
    }
  }

  const theme = demoThemeFromHostname(sourceUrl, hostname, signals.colors, signals.siteName, id)
  return { ...theme, logoUrl: signals.logoUrl }
}

export function isValidCompanyUrl(url: string): boolean {
  try {
    const normalized = normalizeUrl(url)
    const parsed = new URL(normalized)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
