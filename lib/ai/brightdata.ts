import { MODEL_TASK } from '@/lib/models/routing'
import type { LeadProspect } from '@/lib/ai/lead-prospects'
import {
  dedupeProspects,
  isLinkedInProfileUrl,
  mergeProfileUrls,
  normalizeLinkedInUrl,
} from '@/lib/ai/lead-prospects'

const DEEP_LOOKUP_BASE = 'https://api.brightdata.com/datasets/deep_lookup/v1'
const REQUEST_API = 'https://api.brightdata.com/request'

export type BrightDataProspect = LeadProspect

export type BrightDataLeadFetchResult = {
  context: string
  prospects: BrightDataProspect[]
}

export type BrightDataTaskInput = {
  criteria?: string
  targetCustomer?: string
  industry?: string
  region?: string
  count?: number
}

function getApiKey(): string | undefined {
  return process.env.BRIGHTDATA_API_KEY?.trim()
}

export function hasBrightData(): boolean {
  return Boolean(getApiKey())
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function parseLinkedInSerpTitle(title: string): { name: string; role: string; company: string } {
  const clean = title.replace(/\s*\|\s*LinkedIn.*$/i, '').replace(/\s*[-–—]\s*LinkedIn.*$/i, '').trim()
  const parts = clean.split(/\s[-–—]\s/).map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 3) {
    return { name: parts[0], role: parts[1], company: parts.slice(2).join(' - ') }
  }
  if (parts.length === 2) {
    return { name: parts[0], role: parts[1], company: '' }
  }
  return { name: clean || 'Unknown prospect', role: '', company: '' }
}

function summarizeProspect(prospect: BrightDataProspect, index: number): string {
  const parts = [
    `${index + 1}. ${prospect.name}`,
    prospect.profileUrl ? `profile: ${prospect.profileUrl}` : '',
    prospect.role ? `title: ${prospect.role}` : '',
    prospect.company ? `company: ${prospect.company}` : '',
    prospect.location ? `location: ${prospect.location}` : '',
    prospect.headline ? `headline: ${prospect.headline}` : '',
  ].filter(Boolean)
  return parts.join(' | ')
}

export function brightDataPromptBlock(context: string, label = 'Bright Data prospects'): string {
  if (!context.trim()) return ''
  return `\nREAL ${label.toUpperCase()} (each row includes a LinkedIn profile URL — preserve profileUrl exactly in output):\n${context.trim()}\n`
}

function extractProfileUrl(row: Record<string, unknown>): string {
  for (const key of [
    'linkedin_profile_url',
    'linkedin_url',
    'profile_url',
    'profileUrl',
    'url',
    'linkedin',
  ]) {
    const value = normalizeLinkedInUrl(readString(row[key]))
    if (isLinkedInProfileUrl(value)) return value
  }
  return ''
}

function rowToProspect(row: Record<string, unknown>): LeadProspect | null {
  const profileUrl = extractProfileUrl(row)
  const name =
    readString(row.person_name) ||
    readString(row.full_name) ||
    readString(row.name) ||
    readString(row.prospect_name)
  if (!name && !profileUrl) return null

  const role =
    readString(row.job_title) ||
    readString(row.title) ||
    readString(row.role) ||
    readString(row.current_title) ||
    readString(row.position)
  const company =
    readString(row.company_name) ||
    readString(row.company) ||
    readString(row.current_company) ||
    readString(row.organization)

  return {
    name: name || 'Unknown prospect',
    profileUrl,
    company,
    role,
    location: readString(row.location) || readString(row.city) || undefined,
    headline: readString(row.headline) || readString(row.subtitle) || undefined,
  }
}

function dedupeBrightDataProspects(prospects: LeadProspect[]): LeadProspect[] {
  return dedupeProspects(prospects)
}

async function brightDataAuthFetch(url: string, init?: RequestInit): Promise<Response> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('BRIGHTDATA_API_KEY is not configured')
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

async function fetchSerpLinkedInProspects(
  query: string,
  count: number,
): Promise<LeadProspect[]> {
  const zone = process.env.BRIGHTDATA_SERP_ZONE?.trim()
  if (!zone || !query.trim()) return []

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in ${query}`)}&num=${Math.min(Math.max(count, 5), 20)}&brd_json=1`
  try {
    const res = await brightDataAuthFetch(REQUEST_API, {
      method: 'POST',
      body: JSON.stringify({ zone, url: searchUrl, format: 'json' }),
    })
    const payload = (await res.json()) as Record<string, unknown>
    if (!res.ok) {
      console.warn('[brightdata] SERP request failed:', res.status, payload)
      return []
    }

    const organic = Array.isArray(payload.organic) ? payload.organic : []
    const prospects: LeadProspect[] = []
    for (const item of organic) {
      const row = readRecord(item)
      if (!row) continue
      const link = normalizeLinkedInUrl(readString(row.link))
      if (!isLinkedInProfileUrl(link)) continue
      const parsed = parseLinkedInSerpTitle(readString(row.title))
      prospects.push({
        name: parsed.name,
        profileUrl: link,
        company: parsed.company,
        role: parsed.role,
        headline: readString(row.description) || undefined,
      })
      if (prospects.length >= count) break
    }
    return dedupeBrightDataProspects(prospects)
  } catch (err) {
    console.warn('[brightdata] SERP lead search failed:', err)
    return []
  }
}

async function pollDeepLookupRequest(
  requestId: string,
  maxWaitMs = 90_000,
): Promise<Record<string, unknown> | null> {
  const started = Date.now()
  while (Date.now() - started < maxWaitMs) {
    const res = await brightDataAuthFetch(`${DEEP_LOOKUP_BASE}/request/${requestId}`)
    const data = (await res.json()) as Record<string, unknown>
    if (!res.ok) {
      console.warn('[brightdata] Deep Lookup poll failed:', res.status, data)
      return null
    }
    const step = readString(data.step)
    const status = readString(data.status)
    if (step === 'done' || status === 'completed') return data
    if (status === 'failed') {
      console.warn('[brightdata] Deep Lookup request failed')
      return null
    }
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  console.warn('[brightdata] Deep Lookup timed out')
  return null
}

async function fetchDeepLookupProspects(
  query: string,
  count: number,
): Promise<LeadProspect[]> {
  if (!query.trim()) return []

  const spec = {
    name: 'people',
    query,
    title: 'LinkedIn prospects',
    columns: [
      {
        name: 'person_name',
        description: 'Full name of the person',
        type: 'enrichment',
      },
      {
        name: 'linkedin_profile_url',
        description: 'Full public LinkedIn profile URL (https://www.linkedin.com/in/...)',
        type: 'enrichment',
      },
      {
        name: 'company_name',
        description: 'Current company name',
        type: 'enrichment',
      },
      {
        name: 'job_title',
        description: 'Current job title or role',
        type: 'enrichment',
      },
      {
        name: 'location',
        description: 'City, region, or country',
        type: 'enrichment',
      },
    ],
  }

  try {
    const triggerRes = await brightDataAuthFetch(`${DEEP_LOOKUP_BASE}/trigger`, {
      method: 'POST',
      body: JSON.stringify({
        query,
        spec,
        result_limit: Math.min(Math.max(count, 5), 25),
      }),
    })
    const triggerData = (await triggerRes.json()) as Record<string, unknown>
    if (!triggerRes.ok) {
      console.warn('[brightdata] Deep Lookup trigger failed:', triggerRes.status, triggerData)
      return []
    }

    const requestId = readString(triggerData.request_id)
    if (!requestId) return []

    const result = await pollDeepLookupRequest(requestId)
    if (!result) return []

    const rows = Array.isArray(result.data) ? result.data : []
    const prospects = rows
      .map((row) => rowToProspect(readRecord(row) ?? {}))
      .filter((prospect): prospect is LeadProspect => Boolean(prospect?.profileUrl || prospect?.name))

    return dedupeBrightDataProspects(prospects).slice(0, count)
  } catch (err) {
    console.warn('[brightdata] Deep Lookup lead fetch failed:', err)
    return []
  }
}

function buildLeadQuery(input: BrightDataTaskInput): string {
  const parts = [
    input.criteria,
    input.targetCustomer,
    input.industry,
    input.region,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
  const focus = parts.join(' · ') || 'B2B decision makers on LinkedIn'
  return `Find LinkedIn professionals matching: ${focus}. Return people with public LinkedIn profile URLs.`
}

export async function fetchBrightDataLeads(
  input: BrightDataTaskInput = {},
): Promise<BrightDataLeadFetchResult> {
  if (!hasBrightData()) return { context: '', prospects: [] }

  const count = Math.min(Math.max(input.count ?? 12, 5), 25)
  const query = buildLeadQuery(input)

  let prospects = await fetchSerpLinkedInProspects(query, count)
  if (prospects.length < Math.min(count, 5)) {
    const deepLookupProspects = await fetchDeepLookupProspects(query, count)
    prospects = dedupeBrightDataProspects([...prospects, ...deepLookupProspects]).slice(0, count)
  }

  if (prospects.length === 0) return { context: '', prospects: [] }

  const lines = prospects.map((prospect, index) => summarizeProspect(prospect, index))
  return {
    context: [
      'Bright Data LinkedIn prospects (real public profiles — keep name + profile URL pairs):',
      ...lines,
    ].join('\n'),
    prospects,
  }
}

/** Task-aware Bright Data fetch — lead generation uses LinkedIn discovery. */
export async function fetchBrightDataTaskContext(
  task: typeof MODEL_TASK.LEAD_SCORING,
  input: BrightDataTaskInput = {},
): Promise<BrightDataLeadFetchResult> {
  if (task !== MODEL_TASK.LEAD_SCORING) return { context: '', prospects: [] }
  return fetchBrightDataLeads(input)
}

export { mergeProfileUrls }
