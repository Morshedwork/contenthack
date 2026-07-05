import type { BrandProfile, Lead, Platform } from '@/types'

export type LeadProspect = {
  name: string
  profileUrl: string
  company: string
  role: string
  location?: string
  headline?: string
}

export function normalizeLinkedInUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (!parsed.hostname.includes('linkedin.com')) return trimmed
    parsed.protocol = 'https:'
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return trimmed
  }
}

export function isLinkedInProfileUrl(url: string): boolean {
  return /linkedin\.com\/in\//i.test(url)
}

export function dedupeProspects(prospects: LeadProspect[]): LeadProspect[] {
  const seen = new Set<string>()
  const out: LeadProspect[] = []
  for (const prospect of prospects) {
    const key = prospect.profileUrl || `${prospect.name}|${prospect.company}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(prospect)
  }
  return out
}

export function mergeProfileUrls(
  leads: Array<{ name?: string; profileUrl?: string }>,
  prospects: LeadProspect[],
): Array<{ profileUrl?: string }> {
  return leads.map((lead, index) => {
    const existing = normalizeLinkedInUrl(typeof lead.profileUrl === 'string' ? lead.profileUrl : '')
    if (isLinkedInProfileUrl(existing)) return { profileUrl: existing }

    const byIndex = prospects[index]
    if (byIndex?.profileUrl) return { profileUrl: byIndex.profileUrl }

    const leadName = (lead.name ?? '').trim().toLowerCase()
    const match = prospects.find((prospect) => prospect.name.toLowerCase() === leadName)
    if (match?.profileUrl) return { profileUrl: match.profileUrl }

    return { profileUrl: '' }
  })
}

function clampScore(n: unknown, fallback = 85): number {
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.max(0, Math.min(100, Math.round(v)))
}

function findAiLead(
  aiLeads: Partial<Lead>[],
  prospect: LeadProspect,
  index: number,
): Partial<Lead> | undefined {
  const direct = aiLeads[index]
  if (direct) return direct
  const name = prospect.name.toLowerCase()
  return aiLeads.find((lead) => (lead.name ?? '').trim().toLowerCase() === name)
}

/** Build leads from real prospect records — profile URLs are always preserved. */
export function buildLeadsFromProspects(
  prospects: LeadProspect[],
  aiLeads: Partial<Lead>[],
  count: number,
  profile: BrandProfile,
  createId: (index: number) => string,
): Lead[] {
  const linked = prospects.filter((prospect) => isLinkedInProfileUrl(prospect.profileUrl))
  const source = linked.length > 0 ? linked : prospects

  return source.slice(0, count).map((prospect, index) => {
    const ai = findAiLead(aiLeads, prospect, index)
    const profileUrl = prospect.profileUrl || normalizeLinkedInUrl(ai?.profileUrl ?? '')
    return {
      id: createId(index),
      name: prospect.name,
      company: prospect.company || ai?.company || '',
      role: prospect.role || ai?.role || '',
      profileUrl: profileUrl || undefined,
      platform: (ai?.platform as Platform) || 'linkedin',
      matchReason: ai?.matchReason || prospect.headline || 'Matches targeting criteria',
      painPoint: ai?.painPoint || '',
      suggestedOffer: ai?.suggestedOffer || profile.mainOffer,
      score: clampScore(ai?.score),
      status: (ai?.status as Lead['status']) || 'new',
      suggestedAction:
        ai?.suggestedAction ||
        (profileUrl ? 'Open LinkedIn profile and send connection request' : 'Send connection request'),
    }
  })
}
