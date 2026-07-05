import { MODEL_TASK, type ModelTaskType } from '@/lib/models/routing'
import type { BrandProfile, MarketResearch } from '@/types'

const CRUSTDATA_BASE = 'https://api.crustdata.com'
const CRUSTDATA_API_VERSION = '2025-11-01'

export type CrustdataFilterCondition = {
  field: string
  type: string
  value: unknown
}

export type CrustdataFilterGroup = {
  op: 'and' | 'or'
  conditions: Array<CrustdataFilterCondition | CrustdataFilterGroup>
}

export type CrustdataFilter = CrustdataFilterCondition | CrustdataFilterGroup

export type CrustdataTaskInput = {
  industry?: string
  region?: string
  targetCustomer?: string
  offer?: string
  topic?: string
  goal?: string
  criteria?: string
  company?: string
  leadName?: string
  content?: string
  domain?: string
  count?: number
  competitors?: string[]
  marketSummary?: string
  painPoints?: string[]
  highIntentTopics?: string[]
}

type CampaignSignals = {
  industry?: string
  region?: string
  targetAudience?: string
  campaignGoal?: string
  mainOffer?: string
}

function getApiKey(): string | undefined {
  return process.env.CRUSTDATA_API_KEY?.trim()
}

export function hasCrustdata(): boolean {
  return Boolean(getApiKey())
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readNumber(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] ?? ''
  }
}

export function mergeCrustdataSignals(
  overrides: CrustdataTaskInput = {},
  brandProfile?: BrandProfile,
  research?: MarketResearch | null,
  campaign?: CampaignSignals,
): CrustdataTaskInput {
  return {
    industry: overrides.industry ?? campaign?.industry ?? research?.industry,
    region: overrides.region ?? campaign?.region ?? research?.region,
    targetCustomer:
      overrides.targetCustomer ??
      campaign?.targetAudience ??
      research?.targetCustomer ??
      brandProfile?.targetAudience,
    offer: overrides.offer ?? campaign?.mainOffer ?? research?.offer ?? brandProfile?.mainOffer,
    goal: overrides.goal ?? campaign?.campaignGoal,
    competitors: overrides.competitors ?? research?.competitors,
    marketSummary: overrides.marketSummary ?? research?.marketSummary,
    painPoints: overrides.painPoints ?? research?.painPoints,
    highIntentTopics: overrides.highIntentTopics ?? research?.highIntentTopics,
    criteria: overrides.criteria ?? research?.marketSummary,
    topic: overrides.topic,
    company: overrides.company,
    leadName: overrides.leadName,
    content: overrides.content,
    domain: overrides.domain,
    count: overrides.count,
  }
}

export function crustdataPromptBlock(context: string, label = 'CrustData evidence'): string {
  if (!context.trim()) return ''
  return `\nREAL ${label.toUpperCase()} (prioritize over assumptions):\n${context.trim()}\n`
}

async function crustdataFetch<T>(path: string, body: unknown): Promise<T> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('CRUSTDATA_API_KEY is not configured')

  const res = await fetch(`${CRUSTDATA_BASE}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'x-api-version': CRUSTDATA_API_VERSION,
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const err = data.error
    const msg =
      (typeof err === 'object' && err && 'message' in err && readString((err as { message?: unknown }).message)) ||
      readString(data.description) ||
      readString(data.error) ||
      `CrustData request failed (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

function andFilters(conditions: CrustdataFilterCondition[]): CrustdataFilter {
  if (conditions.length === 0) {
    return { field: 'basic_info.name', type: '(.)', value: 'company' }
  }
  if (conditions.length === 1) return conditions[0]
  return { op: 'and', conditions }
}

function summarizeCompany(company: unknown, index: number): string {
  const row = readRecord(company)
  if (!row) return ''

  const basic = readRecord(row.basic_info)
  const headcount = readRecord(row.headcount)
  const funding = readRecord(row.funding)
  const taxonomy = readRecord(row.taxonomy)
  const locations = readRecord(row.locations)
  const hiring = readRecord(row.hiring)
  const growth = readRecord(headcount?.growth_percent)

  const parts = [
    `${index + 1}. ${readString(basic?.name) || 'Unknown company'}`,
    readString(basic?.primary_domain) ? `domain: ${readString(basic?.primary_domain)}` : '',
    readString(taxonomy?.professional_network_industry)
      ? `industry: ${readString(taxonomy?.professional_network_industry)}`
      : '',
    readNumber(headcount?.total) !== undefined ? `employees: ${readNumber(headcount?.total)}` : '',
    readNumber(funding?.total_investment_usd) !== undefined
      ? `funding_usd: ${readNumber(funding?.total_investment_usd)}`
      : '',
    readString(funding?.last_round_type) ? `last_round: ${readString(funding?.last_round_type)}` : '',
    readNumber(growth?.['12m']) !== undefined ? `12m_headcount_growth_pct: ${readNumber(growth?.['12m'])}` : '',
    readNumber(hiring?.openings_count) !== undefined ? `open_roles: ${readNumber(hiring?.openings_count)}` : '',
    readString(locations?.headquarters) ? `hq: ${readString(locations?.headquarters)}` : '',
  ].filter(Boolean)

  return parts.join(' | ')
}

function summarizeEnrichedCompany(match: unknown, index: number): string {
  const row = readRecord(match)
  const data = readRecord(row?.company_data)
  if (!data) return summarizeCompany(match, index)
  return summarizeCompany({ ...data, basic_info: readRecord(data.basic_info) ?? data.basic_info }, index)
}

function summarizeProfile(profile: unknown, index: number): string {
  const row = readRecord(profile)
  if (!row) return ''

  const basic = readRecord(row.basic_profile)
  const experience = readRecord(row.experience)
  const employment = readRecord(experience?.employment_details)
  const current = readRecord(employment?.current)
  const social = readRecord(row.social_handles)
  const networkId = readRecord(social?.professional_network_identifier)
  const location = readRecord(basic?.location)

  const parts = [
    `${index + 1}. ${readString(basic?.name) || 'Unknown person'}`,
    readString(basic?.headline) ? `headline: ${readString(basic?.headline)}` : '',
    readString(current?.title) || readString(basic?.current_title)
      ? `title: ${readString(current?.title) || readString(basic?.current_title)}`
      : '',
    readString(current?.company_name) ? `company: ${readString(current?.company_name)}` : '',
    readString(location?.full_location) || readString(basic?.location)
      ? `location: ${readString(location?.full_location) || readString(basic?.location)}`
      : '',
    readString(networkId?.profile_url) ? `profile: ${readString(networkId?.profile_url)}` : '',
  ].filter(Boolean)

  return parts.join(' | ')
}

function summarizeWebResult(result: unknown, index: number): string {
  const row = readRecord(result)
  if (!row) return ''

  const parts = [
    `${index + 1}. ${readString(row.title) || 'Untitled result'}`,
    readString(row.snippet) ? `snippet: ${readString(row.snippet)}` : '',
    readString(row.url) ? `url: ${readString(row.url)}` : '',
  ].filter(Boolean)

  return parts.join(' | ')
}

async function fetchWebSearchContext(query: string, limit = 5): Promise<string> {
  if (!query.trim()) return ''
  try {
    const web = await crustdataFetch<{ results?: unknown[] }>('/web/search/live', {
      query: query.trim(),
      limit,
    })
    const lines = (web.results ?? [])
      .map((result, index) => summarizeWebResult(result, index))
      .filter(Boolean)
    if (lines.length === 0) return ''
    return ['CrustData web search:', ...lines].join('\n')
  } catch {
    return ''
  }
}

async function fetchCompanyEnrichByNames(names: string[]): Promise<string> {
  const cleaned = names.map((name) => name.trim()).filter(Boolean).slice(0, 5)
  if (cleaned.length === 0) return ''

  try {
    const result = await crustdataFetch<{ matches?: unknown[] }>('/company/enrich', {
      names: cleaned,
      fields: ['basic_info', 'headcount', 'taxonomy', 'funding', 'hiring'],
    })
    const lines = (result.matches ?? [])
      .map((match, index) => summarizeEnrichedCompany(match, index))
      .filter(Boolean)
    if (lines.length === 0) return ''
    return ['CrustData company profiles:', ...lines].join('\n')
  } catch {
    return ''
  }
}

export async function fetchCompanyEnrichByDomain(domainOrUrl: string): Promise<string> {
  const domain = hostnameFromUrl(domainOrUrl)
  if (!domain) return ''

  try {
    const result = await crustdataFetch<{ matches?: unknown[] }>('/company/enrich', {
      domains: [domain],
      fields: ['basic_info', 'headcount', 'taxonomy', 'funding', 'locations'],
    })
    const lines = (result.matches ?? [])
      .map((match, index) => summarizeEnrichedCompany(match, index))
      .filter(Boolean)
    if (lines.length === 0) return ''
    return ['CrustData company profile:', ...lines].join('\n')
  } catch {
    return ''
  }
}

async function fetchPersonByNameAndCompany(name?: string, company?: string): Promise<string> {
  const conditions: CrustdataFilterCondition[] = []
  if (name?.trim()) {
    conditions.push({ field: 'basic_profile.name', type: '(.)', value: name.trim() })
  }
  if (company?.trim()) {
    conditions.push({
      field: 'experience.employment_details.current.company_name',
      type: '(.)',
      value: company.trim(),
    })
  }
  if (conditions.length === 0) return ''

  try {
    const search = await crustdataFetch<{ profiles?: unknown[] }>('/person/search', {
      filters: andFilters(conditions),
      limit: 3,
      fields: [
        'basic_profile.name',
        'basic_profile.headline',
        'basic_profile.current_title',
        'basic_profile.location',
        'experience.employment_details.current.company_name',
        'experience.employment_details.current.title',
        'social_handles.professional_network_identifier.profile_url',
      ],
    })
    const profiles = (search.profiles ?? [])
      .map((profile, index) => summarizeProfile(profile, index))
      .filter(Boolean)
    if (profiles.length === 0) return ''
    return ['CrustData prospect profile:', ...profiles].join('\n')
  } catch {
    return ''
  }
}

function cachedResearchLines(input: CrustdataTaskInput): string[] {
  const lines: string[] = []
  if (input.marketSummary) lines.push(`Market summary: ${input.marketSummary}`)
  if (input.highIntentTopics?.length) {
    lines.push(`High-intent topics: ${input.highIntentTopics.slice(0, 8).join('; ')}`)
  }
  if (input.painPoints?.length) {
    lines.push(`Pain points: ${input.painPoints.slice(0, 6).join('; ')}`)
  }
  if (input.competitors?.length) {
    lines.push(`Known competitors: ${input.competitors.slice(0, 8).join(', ')}`)
  }
  return lines
}

export async function fetchResearchContext(input: {
  industry: string
  region?: string
  targetCustomer?: string
}): Promise<string> {
  if (!hasCrustdata()) return ''

  const conditions: CrustdataFilterCondition[] = [
    {
      field: 'taxonomy.professional_network_industry',
      type: '(.)',
      value: input.industry,
    },
  ]

  if (input.region?.trim()) {
    conditions.push({
      field: 'locations.headquarters',
      type: '(.)',
      value: input.region.trim(),
    })
  }

  try {
    const search = await crustdataFetch<{ companies?: unknown[]; total_count?: number }>(
      '/company/search',
      {
        filters: andFilters(conditions),
        limit: 15,
        sorts: [{ field: 'headcount.total', order: 'desc' }],
        fields: [
          'basic_info.name',
          'basic_info.primary_domain',
          'headcount.total',
          'headcount.growth_percent.12m',
          'taxonomy.professional_network_industry',
          'funding.total_investment_usd',
          'funding.last_round_type',
          'hiring.openings_count',
          'locations.headquarters',
        ],
      },
    )

    const companies = (search.companies ?? [])
      .map((company, index) => summarizeCompany(company, index))
      .filter(Boolean)

    const web = await fetchWebSearchContext(
      `${input.industry} market trends ${input.region ?? ''} ${input.targetCustomer ?? ''}`.trim(),
      5,
    )

    if (companies.length === 0 && !web) return ''

    return [
      'CrustData company search (real indexed companies):',
      ...companies,
      search.total_count !== undefined ? `total_matches: ${search.total_count}` : '',
      web,
    ]
      .filter(Boolean)
      .join('\n')
  } catch (err) {
    console.warn('[crustdata] research fetch failed:', err)
    return ''
  }
}

export async function fetchLeadContext(input: {
  criteria?: string
  targetCustomer?: string
  count?: number
}): Promise<string> {
  if (!hasCrustdata()) return ''

  const focus = (input.criteria || input.targetCustomer || '').trim()
  const conditions: CrustdataFilterCondition[] = [
    { field: 'basic_profile.headline', type: '(!)', value: 'Intern' },
    { field: 'basic_profile.headline', type: '(!)', value: 'Student' },
  ]

  if (focus) {
    conditions.unshift({
      field: 'basic_profile.headline',
      type: '(.)',
      value: focus,
    })
  }

  try {
    const search = await crustdataFetch<{ profiles?: unknown[]; total_count?: number }>(
      '/person/search',
      {
        filters: andFilters(conditions),
        limit: Math.min(Math.max(input.count ?? 12, 5), 25),
        sorts: [{ field: 'professional_network.connections', order: 'desc' }],
        fields: [
          'basic_profile.name',
          'basic_profile.headline',
          'basic_profile.current_title',
          'basic_profile.location',
          'experience.employment_details.current.company_name',
          'experience.employment_details.current.title',
          'social_handles.professional_network_identifier.profile_url',
        ],
      },
    )

    const profiles = (search.profiles ?? [])
      .map((profile, index) => summarizeProfile(profile, index))
      .filter(Boolean)

    if (profiles.length === 0) return ''

    return [
      'CrustData person search (real indexed profiles — use these as lead sources):',
      ...profiles,
      search.total_count !== undefined ? `total_matches: ${search.total_count}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  } catch (err) {
    console.warn('[crustdata] lead fetch failed:', err)
    return ''
  }
}

async function fetchContentStrategyContext(input: CrustdataTaskInput): Promise<string> {
  const parts = cachedResearchLines(input)
  const web = await fetchWebSearchContext(
    [input.topic, input.goal, input.industry, input.targetCustomer, 'content marketing trends']
      .filter(Boolean)
      .join(' '),
    5,
  )
  if (web) parts.push(web)

  if (input.competitors?.length) {
    const competitors = await fetchCompanyEnrichByNames(input.competitors.slice(0, 3))
    if (competitors) parts.push(competitors)
  }

  return parts.filter(Boolean).join('\n\n')
}

async function fetchOutreachContext(input: CrustdataTaskInput): Promise<string> {
  const parts: string[] = []
  if (input.company) {
    const company = await fetchCompanyEnrichByNames([input.company])
    if (company) parts.push(company)
  }
  const person = await fetchPersonByNameAndCompany(input.leadName, input.company)
  if (person) parts.push(person)
  return parts.filter(Boolean).join('\n\n')
}

async function fetchBrandSafetyContext(input: CrustdataTaskInput): Promise<string> {
  const parts: string[] = []
  if (input.content?.trim()) {
    const web = await fetchWebSearchContext(`fact check verify ${input.content.slice(0, 240)}`, 3)
    if (web) parts.push(web)
  }
  if (input.domain) {
    const company = await fetchCompanyEnrichByDomain(input.domain)
    if (company) parts.push(company)
  } else if (input.competitors?.length) {
    const competitors = await fetchCompanyEnrichByNames(input.competitors.slice(0, 2))
    if (competitors) parts.push(competitors)
  }
  return parts.filter(Boolean).join('\n\n')
}

async function fetchMediaContext(input: CrustdataTaskInput): Promise<string> {
  return fetchWebSearchContext(
    [input.topic, input.industry, input.goal, 'visual marketing trends creative direction']
      .filter(Boolean)
      .join(' '),
    4,
  )
}

/** Task-aware CrustData fetch — used by every AI generation path when data helps. */
export async function fetchTaskContext(
  task: ModelTaskType,
  input: CrustdataTaskInput = {},
): Promise<string> {
  if (!hasCrustdata()) return ''

  try {
    switch (task) {
      case MODEL_TASK.MARKET_RESEARCH:
        return fetchResearchContext({
          industry: input.industry || 'technology',
          region: input.region,
          targetCustomer: input.targetCustomer,
        })
      case MODEL_TASK.LEAD_SCORING:
        return fetchLeadContext({
          criteria: input.criteria,
          targetCustomer: input.targetCustomer,
          count: input.count,
        })
      case MODEL_TASK.CONTENT_GENERATION:
      case MODEL_TASK.VIDEO_SCRIPTS:
        return fetchContentStrategyContext(input)
      case MODEL_TASK.OUTREACH_WRITING:
        return fetchOutreachContext(input)
      case MODEL_TASK.BRAND_SAFETY:
        return fetchBrandSafetyContext(input)
      case MODEL_TASK.ANALYTICS_SUMMARY:
        return fetchResearchContext({
          industry: input.industry || 'technology',
          region: input.region,
          targetCustomer: input.targetCustomer,
        })
      case MODEL_TASK.IMAGE_GENERATION:
      case MODEL_TASK.VIDEO_GENERATION:
        return fetchMediaContext(input)
      default:
        return ''
    }
  } catch (err) {
    console.warn(`[crustdata] ${task} fetch failed:`, err)
    return ''
  }
}