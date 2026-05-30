import type {
  MarketResearch,
  ContentDraft,
  VideoScript,
  Lead,
  OutreachMessage,
  Platform,
  BrandProfile,
} from '@/types'
import { DEMO_COMPANY, demoBrandProfile } from '@/lib/demo/data'
import { generateJSON, generateText, OPENAI_MODEL_QUALITY } from './openai'
import { appendCustomPrompt, normalizeCustomPromptDetails, platformsFromPromptHint } from './prompt-utils'

function buildBrandContext(profile?: BrandProfile, region?: string): string {
  const p = profile ?? demoBrandProfile
  const wordsToAvoid = Array.isArray(p.wordsToAvoid) ? p.wordsToAvoid.join(', ') : ''
  const contentRules = Array.isArray(p.contentRules) ? p.contentRules.join('; ') : ''
  return `Company: ${p.brandName || DEMO_COMPANY.name}
Description: ${p.brandDescription || ''}
Product/Service: ${p.productDescription || ''}
Target audience: ${p.targetAudience || DEMO_COMPANY.targetCustomers}
Region: ${region ?? DEMO_COMPANY.region}
Tone of voice: ${p.tone || 'Professional'}
Main offer: ${p.mainOffer || demoBrandProfile.mainOffer}
CTA style: ${p.ctaStyle || demoBrandProfile.ctaStyle}
Words to avoid: ${wordsToAvoid}
Content rules: ${contentRules}`
}

const clamp = (n: unknown, fallback = 85): number => {
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.max(0, Math.min(100, Math.round(v)))
}

const id = (prefix: string, i: number) => `${prefix}-${Date.now().toString(36)}-${i}`

const PLATFORM_ALIASES: Record<string, Platform> = {
  linkedin: 'linkedin',
  linked_in: 'linkedin',
  instagram: 'instagram',
  insta: 'instagram',
  facebook: 'facebook',
  fb: 'facebook',
  x: 'x',
  twitter: 'x',
  tiktok: 'tiktok',
  youtube: 'youtube',
  email: 'email',
  carousel: 'carousel',
}

export function normalizePlatform(value: unknown, fallback: Platform): Platform {
  if (typeof value !== 'string') return fallback
  const key = value.toLowerCase().trim().replace(/[\s-]+/g, '_').replace(/^@/, '')
  return PLATFORM_ALIASES[key] ?? PLATFORM_ALIASES[key.replace(/_/g, '')] ?? fallback
}

function readDraftField(draft: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = draft[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

// ─── Market research ───────────────────────────────────────────────────────
export async function generateResearch(input: {
  industry?: string
  targetCustomer?: string
  region?: string
  offer?: string
  customPromptDetails?: string
  brandProfile?: BrandProfile
}): Promise<MarketResearch> {
  const industry = input.industry || DEMO_COMPANY.industry
  const targetCustomer = input.targetCustomer || DEMO_COMPANY.targetCustomers
  const region = input.region || DEMO_COMPANY.region
  const offer = input.offer || input.brandProfile?.mainOffer || demoBrandProfile.mainOffer
  const brandContext = buildBrandContext(input.brandProfile, region)

  const data = await generateJSON<Partial<MarketResearch>>({
    model: OPENAI_MODEL_QUALITY,
    temperature: 0.4,
    maxTokens: 3000,
    system: `You are a senior B2B market research analyst. Produce sharp, data-aware insights for a marketing team. Always respond with a single valid JSON object and nothing else.`,
    user: appendCustomPrompt(`${brandContext}

Run market research for:
- Industry: ${industry}
- Target customer: ${targetCustomer}
- Region: ${region}
- Offer: ${offer}

Return JSON with exactly this shape:
{
  "competitors": ["string", ...4-5],
  "marketSummary": "2-3 sentence summary",
  "painPoints": ["string", ...6],
  "trends": [{"title": "string", "description": "string", "score": 0-100}, ...4],
  "competitorGaps": [{"competitor": "string", "gap": "string", "opportunity": "string"}, ...3],
  "keywords": [{"keyword": "string", "volume": number, "intent": "high"|"medium"|"low"}, ...5],
  "highIntentTopics": ["string", ...5],
  "opportunityScore": 0-100
}`, input.customPromptDetails),
  })

  return {
    id: id('mr', 1),
    industry,
    targetCustomer,
    region,
    offer,
    competitors: data.competitors ?? [],
    marketSummary: data.marketSummary ?? '',
    painPoints: data.painPoints ?? [],
    trends: (data.trends ?? []).map((t) => ({ ...t, score: clamp(t.score) })),
    competitorGaps: data.competitorGaps ?? [],
    keywords: data.keywords ?? [],
    highIntentTopics: data.highIntentTopics ?? [],
    opportunityScore: clamp(data.opportunityScore),
  }
}

// ─── Content topics ──────────────────────────────────────────────────────────
export async function generateTopics(input: {
  goal?: string
  count?: number
  customPromptDetails?: string
  brandProfile?: BrandProfile
}): Promise<string[]> {
  const count = input.count ?? 12
  const brandContext = buildBrandContext(input.brandProfile)
  const data = await generateJSON<{ topics?: string[] }>({
    temperature: 0.8,
    system: `You are a B2B content strategist. Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}

Campaign goal: ${input.goal || DEMO_COMPANY.goal}

Generate ${count} high-intent, scroll-stopping social content topic ideas tailored to the brand and audience.
Return JSON: { "topics": ["string", ...${count}] }`, input.customPromptDetails),
  })
  return data.topics ?? []
}

// ─── Content drafts ──────────────────────────────────────────────────────────
export async function generateContentDrafts(input: {
  platform?: Platform
  topic?: string
  platforms?: Platform[]
  campaignId?: string
  customPromptDetails?: string
  brandProfile?: BrandProfile
}): Promise<ContentDraft[]> {
  const defaultPlatforms: Platform[] =
    input.platforms ?? (input.platform ? [input.platform] : ['linkedin', 'instagram', 'facebook', 'x'])
  const platforms = input.platform
    ? [input.platform]
    : platformsFromPromptHint(input.customPromptDetails, defaultPlatforms)
  const campaignId = input.campaignId || 'camp-001'
  const brandContext = buildBrandContext(input.brandProfile)
  const profile = input.brandProfile ?? demoBrandProfile
  const topicFocus =
    input.topic?.trim() ||
    normalizeCustomPromptDetails(input.customPromptDetails) ||
    profile.mainOffer ||
    DEMO_COMPANY.goal

  const data = await generateJSON<{ drafts?: Partial<ContentDraft>[] }>({
    temperature: 0.75,
    maxTokens: 3000,
    system: `You are an expert social media copywriter. Write platform-native, high-converting posts that respect the brand's tone and content rules. Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}

Topic / offer focus: ${topicFocus}
Write one post for each of these platforms: ${platforms.join(', ')}.

Return JSON with this shape:
{
  "drafts": [
    {
      "platform": "${platforms.join('"|"')}",
      "hook": "scroll-stopping first line",
      "mainCopy": "the post body",
      "cta": "clear call to action",
      "hashtags": ["#tag", ...],
      "audienceFitScore": 0-100,
      "brandSafetyScore": 0-100,
      "leadPotentialScore": 0-100
    }
  ]
}`, input.customPromptDetails),
  })

  const drafts = data.drafts ?? []
  if (drafts.length === 0) {
    throw new Error('OpenAI returned no content drafts — try again or narrow the platform list')
  }

  return drafts.map((raw, i) => {
    const d = raw as Partial<ContentDraft> & Record<string, unknown>
    const fallbackPlatform = platforms[i % platforms.length]
    return {
      id: id('c', i),
      platform: normalizePlatform(d.platform, fallbackPlatform),
      hook: readDraftField(d, 'hook', 'headline', 'title'),
      mainCopy: readDraftField(d, 'mainCopy', 'main_copy', 'body', 'content', 'copy'),
      cta: readDraftField(d, 'cta', 'call_to_action') || profile.ctaStyle,
      hashtags: Array.isArray(d.hashtags)
        ? d.hashtags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      audienceFitScore: clamp(d.audienceFitScore ?? d.audience_fit_score),
      brandSafetyScore: clamp(d.brandSafetyScore ?? d.brand_safety_score, 95),
      leadPotentialScore: clamp(d.leadPotentialScore ?? d.lead_potential_score),
      status: 'draft' as const,
      campaignId,
    }
  })
}

// ─── Video scripts ───────────────────────────────────────────────────────────
export async function generateVideoScripts(input: {
  topic?: string
  count?: number
  customPromptDetails?: string
  brandProfile?: BrandProfile
}): Promise<VideoScript[]> {
  const count = input.count ?? 3
  const brandContext = buildBrandContext(input.brandProfile)
  const profile = input.brandProfile ?? demoBrandProfile
  const data = await generateJSON<{ scripts?: Partial<VideoScript>[] }>({
    temperature: 0.8,
    maxTokens: 3500,
    system: `You are a short-form video scriptwriter (Reels, Shorts, TikTok). Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}

${input.topic ? `Topic focus: ${input.topic}` : ''}
Write ${count} short-form video scripts.

Return JSON with this shape:
{
  "scripts": [
    {
      "title": "string",
      "hook": "first 3-second hook",
      "scenes": [{"title": "string", "voiceover": "string", "onScreenText": "string", "visuals": "string"}],
      "voiceover": "full voiceover script",
      "bRoll": ["string", ...],
      "aiVideoPrompt": "prompt for an AI video generator",
      "cta": "string",
      "duration": "e.g. 0:45"
    }
  ]
}`, input.customPromptDetails),
  })

  return (data.scripts ?? []).map((s, i) => ({
    id: id('v', i),
    title: s.title ?? `Video ${i + 1}`,
    hook: s.hook ?? '',
    scenes: s.scenes ?? [],
    voiceover: s.voiceover ?? '',
    bRoll: s.bRoll ?? [],
    aiVideoPrompt: s.aiVideoPrompt ?? '',
    cta: s.cta ?? profile.ctaStyle,
    duration: s.duration ?? '0:45',
    status: 'draft',
  }))
}

// ─── Leads ───────────────────────────────────────────────────────────────────
export async function generateLeads(input: {
  count?: number
  criteria?: string
  customPromptDetails?: string
  brandProfile?: BrandProfile
}): Promise<Lead[]> {
  const count = input.count ?? 12
  const brandContext = buildBrandContext(input.brandProfile)
  const profile = input.brandProfile ?? demoBrandProfile
  const data = await generateJSON<{ leads?: Partial<Lead>[] }>({
    temperature: 0.7,
    maxTokens: 3500,
    system: `You are a B2B lead generation researcher. Generate realistic, plausible prospect profiles (these are illustrative examples, not real contact data). Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}

${input.criteria ? `Targeting criteria: ${input.criteria}` : ''}
Generate ${count} qualified prospect profiles that fit the ideal customer.

Return JSON with this shape:
{
  "leads": [
    {
      "name": "Full Name",
      "company": "Company",
      "role": "Job title",
      "platform": "linkedin"|"instagram"|"facebook"|"x",
      "matchReason": "why they matched",
      "painPoint": "their likely pain point",
      "suggestedOffer": "best offer for them",
      "score": 0-100,
      "status": "new"|"reviewed"|"qualified",
      "suggestedAction": "recommended next step"
    }
  ]
}`, input.customPromptDetails),
  })

  return (data.leads ?? []).map((l, i) => ({
    id: id('l', i),
    name: l.name ?? `Prospect ${i + 1}`,
    company: l.company ?? '',
    role: l.role ?? '',
    platform: (l.platform as Platform) || 'linkedin',
    matchReason: l.matchReason ?? '',
    painPoint: l.painPoint ?? '',
    suggestedOffer: l.suggestedOffer ?? profile.mainOffer,
    score: clamp(l.score),
    status: (l.status as Lead['status']) || 'new',
    suggestedAction: l.suggestedAction ?? '',
  }))
}

// ─── Outreach ────────────────────────────────────────────────────────────────
export async function generateOutreach(input: {
  leadId?: string
  leadName?: string
  company?: string
  painPoint?: string
  matchReason?: string
  customPromptDetails?: string
  brandProfile?: BrandProfile
}): Promise<OutreachMessage> {
  const brandContext = buildBrandContext(input.brandProfile)
  const data = await generateJSON<Partial<OutreachMessage>>({
    temperature: 0.7,
    maxTokens: 1500,
    system: `You are an expert B2B outreach copywriter. Write warm, personalized, non-spammy messages. Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}

Prospect: ${input.leadName || 'the prospect'}${input.company ? ` at ${input.company}` : ''}
${input.painPoint ? `Pain point: ${input.painPoint}` : ''}
${input.matchReason ? `Why they matched: ${input.matchReason}` : ''}

Write personalized outreach. Return JSON with this shape:
{
  "linkedinConnection": "short connection request (<300 chars)",
  "linkedinFollowUp": "follow-up message after connecting",
  "emailSubject": "compelling subject line",
  "emailBody": "personalized email",
  "shortPitch": "one-line pitch",
  "personalizationReason": "why this is personalized"
}`, input.customPromptDetails),
  })

  return {
    id: id('o', 1),
    leadId: input.leadId || 'l1',
    leadName: input.leadName || 'Prospect',
    linkedinConnection: data.linkedinConnection ?? '',
    linkedinFollowUp: data.linkedinFollowUp ?? '',
    emailSubject: data.emailSubject ?? '',
    emailBody: data.emailBody ?? '',
    shortPitch: data.shortPitch ?? '',
    personalizationReason: data.personalizationReason ?? input.matchReason ?? '',
    approved: false,
  }
}

// ─── Brand safety check ───────────────────────────────────────────────────────
export interface SafetyResult {
  passed: boolean
  brandSafetyScore: number
  flags: string[]
  message: string
}

export async function checkBrandSafety(input: { content?: string; brandProfile?: BrandProfile }): Promise<SafetyResult> {
  const content = input.content || ''
  const brandContext = buildBrandContext(input.brandProfile)
  const data = await generateJSON<Partial<SafetyResult>>({
    model: OPENAI_MODEL_QUALITY,
    temperature: 0.1,
    maxTokens: 800,
    system: `You are a brand safety and compliance reviewer. Detect risky claims, unverifiable guarantees, spammy phrasing, and off-brand language. Respond only with a valid JSON object.`,
    user: `${brandContext}

Review this content for brand safety and compliance:
"""
${content}
"""

Return JSON with this shape:
{
  "passed": boolean,
  "brandSafetyScore": 0-100,
  "flags": ["specific issue", ...],
  "message": "short reviewer summary"
}`,
  })

  return {
    passed: data.passed ?? true,
    brandSafetyScore: clamp(data.brandSafetyScore, 95),
    flags: data.flags ?? [],
    message: data.message ?? 'Brand safety check complete',
  }
}

// ─── Generic agent / freeform output ──────────────────────────────────────────
export async function generateOutput(
  taskType: string,
  input: string,
  customPromptDetails?: string,
  brandProfile?: BrandProfile,
): Promise<string> {
  const brandContext = buildBrandContext(brandProfile)
  return generateText({
    temperature: 0.7,
    maxTokens: 1200,
    system: `You are an AI marketing agent specialized in "${taskType}". ${brandContext}`,
    user: appendCustomPrompt(
      input || `Perform the "${taskType}" task and summarize the result.`,
      customPromptDetails,
    ),
  })
}
