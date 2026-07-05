import type {
  MarketResearch,
  ContentDraft,
  VideoScript,
  VideoFormat,
  VideoPromotionType,
  Lead,
  OutreachMessage,
  Platform,
  BrandProfile,
} from '@/types'
import { DEMO_COMPANY, demoBrandProfile } from '@/lib/demo/data'
import {
  brightDataPromptBlock,
  fetchBrightDataLeads,
  hasBrightData,
} from './brightdata'
import { fetchCrustdataLeadProspects } from './crustdata'
import {
  buildLeadsFromProspects,
  dedupeProspects,
  mergeProfileUrls,
} from './lead-prospects'
import {
  crustdataPromptBlock,
  fetchTaskContext,
  mergeCrustdataSignals,
  type CrustdataTaskInput,
} from './crustdata'
import { generateJSON, generateText } from './layer'
import { appendCustomPrompt, normalizeCustomPromptDetails, platformsFromPromptHint } from './prompt-utils'
import { MODEL_TASK, resolveTaskModel, type TaskModelConfig } from '@/lib/models/routing'
import {
  getVideoFormatLabel,
  VIDEO_PROMOTION_TYPES,
} from '@/lib/models/video-options'

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

function taskConfig(input: { modelConfig?: TaskModelConfig }, taskType: TaskModelConfig['taskType']): TaskModelConfig {
  return input.modelConfig ?? resolveTaskModel(taskType)
}

type GenerateDataInput = {
  signals?: CrustdataTaskInput
  brandProfile?: BrandProfile
  research?: MarketResearch | null
}

async function loadCrustdata(
  task: TaskModelConfig['taskType'],
  base: CrustdataTaskInput,
  input: GenerateDataInput,
): Promise<string> {
  const merged = mergeCrustdataSignals(base, input.brandProfile, input.research)
  return fetchTaskContext(task, { ...merged, ...input.signals })
}

// ─── Market research ───────────────────────────────────────────────────────
export async function generateResearch(input: {
  industry?: string
  targetCustomer?: string
  region?: string
  offer?: string
  customPromptDetails?: string
  brandProfile?: BrandProfile
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
  modelConfig?: TaskModelConfig
}): Promise<MarketResearch> {
  const mc = taskConfig(input, MODEL_TASK.MARKET_RESEARCH)
  const industry = input.industry || DEMO_COMPANY.industry
  const targetCustomer = input.targetCustomer || DEMO_COMPANY.targetCustomers
  const region = input.region || DEMO_COMPANY.region
  const offer = input.offer || input.brandProfile?.mainOffer || demoBrandProfile.mainOffer
  const brandContext = buildBrandContext(input.brandProfile, region)
  const crustdataContext = await loadCrustdata(
    MODEL_TASK.MARKET_RESEARCH,
    { industry, region, targetCustomer, offer },
    input,
  )

  const data = await generateJSON<Partial<MarketResearch>>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system: `You are a senior B2B market research analyst. Produce sharp, data-aware insights for a marketing team. When CrustData evidence is provided, treat it as primary source material and ground competitors, trends, and gaps in that data. Always respond with a single valid JSON object and nothing else.`,
    user: appendCustomPrompt(`${brandContext}${crustdataPromptBlock(crustdataContext, 'market data')}
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
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
  modelConfig?: TaskModelConfig
}): Promise<string[]> {
  const mc = taskConfig(input, MODEL_TASK.CONTENT_GENERATION)
  const count = input.count ?? 12
  const brandContext = buildBrandContext(input.brandProfile)
  const crustdataContext = await loadCrustdata(
    MODEL_TASK.CONTENT_GENERATION,
    { goal: input.goal, topic: input.goal },
    input,
  )
  const data = await generateJSON<{ topics?: string[] }>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system: `You are a B2B content strategist. When CrustData evidence is provided, ground topic ideas in real market signals. Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}${crustdataPromptBlock(crustdataContext, 'content strategy data')}

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
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
  modelConfig?: TaskModelConfig
}): Promise<ContentDraft[]> {
  const mc = taskConfig(input, MODEL_TASK.CONTENT_GENERATION)
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
  const crustdataContext = await loadCrustdata(
    MODEL_TASK.CONTENT_GENERATION,
    { topic: topicFocus },
    input,
  )

  const data = await generateJSON<{ drafts?: Partial<ContentDraft>[] }>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system: `You are an expert social media copywriter. Write platform-native, high-converting posts that respect the brand's tone and content rules. Ground claims in CrustData evidence when provided. Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}${crustdataPromptBlock(crustdataContext, 'content market data')}

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
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
  modelConfig?: TaskModelConfig
}): Promise<VideoScript[]> {
  const mc = taskConfig(input, MODEL_TASK.VIDEO_SCRIPTS)
  const count = input.count ?? 3
  const brandContext = buildBrandContext(input.brandProfile)
  const profile = input.brandProfile ?? demoBrandProfile
  const crustdataContext = await loadCrustdata(
    MODEL_TASK.VIDEO_SCRIPTS,
    { topic: input.topic },
    input,
  )
  const data = await generateJSON<{ scripts?: Partial<VideoScript>[] }>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system: `You are a short-form video scriptwriter (Reels, Shorts, TikTok). Use CrustData trend signals when provided. Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}${crustdataPromptBlock(crustdataContext, 'video trend data')}

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
    status: 'draft' as const,
  }))
}

function mapVideoScripts(
  scripts: Partial<VideoScript>[] | undefined,
  profile: BrandProfile,
  extras?: Partial<VideoScript>,
): VideoScript[] {
  return (scripts ?? []).map((s, i) => ({
    id: id('v', i),
    title: s.title ?? `Video ${i + 1}`,
    hook: s.hook ?? '',
    scenes: s.scenes ?? [],
    voiceover: s.voiceover ?? '',
    bRoll: s.bRoll ?? [],
    aiVideoPrompt: s.aiVideoPrompt ?? '',
    cta: s.cta ?? profile.ctaStyle,
    duration: s.duration ?? '0:45',
    status: 'draft' as const,
    ...extras,
    ...(s.sourceContentId ? { sourceContentId: s.sourceContentId } : {}),
    ...(s.sourcePlatform ? { sourcePlatform: s.sourcePlatform } : {}),
  }))
}

/** Generate reel scripts adapted from existing content drafts (one reel per draft). */
export async function generateReelsFromContent(input: {
  contentDrafts: ContentDraft[]
  format?: VideoFormat
  customPromptDetails?: string
  brandProfile?: BrandProfile
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
  modelConfig?: TaskModelConfig
}): Promise<VideoScript[]> {
  const mc = taskConfig(input, MODEL_TASK.VIDEO_SCRIPTS)
  const profile = input.brandProfile ?? demoBrandProfile
  const format = input.format ?? 'reel'
  const formatLabel = getVideoFormatLabel(format)
  const brandContext = buildBrandContext(input.brandProfile)
  const crustdataContext = await loadCrustdata(
    MODEL_TASK.VIDEO_SCRIPTS,
    { topic: input.contentDrafts.map((d) => d.hook).join('; ') },
    input,
  )

  const draftBlocks = input.contentDrafts
    .map(
      (d, i) => `--- Draft ${i + 1} (${d.platform}) ---
ID: ${d.id}
Hook: ${d.hook}
Copy: ${d.mainCopy}
CTA: ${d.cta}
Hashtags: ${d.hashtags.join(', ')}`,
    )
    .join('\n\n')

  const data = await generateJSON<{ scripts?: Partial<VideoScript>[] }>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system: `You are a short-form video scriptwriter. Adapt written content into ${formatLabel} scripts. Respond only with valid JSON.`,
    user: appendCustomPrompt(`${brandContext}${crustdataPromptBlock(crustdataContext, 'video trend data')}

Convert each content draft below into a separate ${formatLabel} script. Preserve the core message, hook energy, and CTA. Optimize pacing for vertical short-form (15–60s).

${draftBlocks}

Return JSON:
{
  "scripts": [
    {
      "title": "string",
      "hook": "first 3-second hook",
      "scenes": [{"title": "string", "voiceover": "string", "onScreenText": "string", "visuals": "string"}],
      "voiceover": "full voiceover",
      "bRoll": ["string"],
      "aiVideoPrompt": "prompt for AI video generator — vertical 9:16, ${formatLabel} style",
      "cta": "string",
      "duration": "e.g. 0:30",
      "sourceContentId": "draft id from input",
      "sourcePlatform": "platform from draft"
    }
  ]
}

Write exactly ${input.contentDrafts.length} script(s), one per draft.`, input.customPromptDetails),
  })

  return mapVideoScripts(data.scripts, profile, { format }).map((script, i) => ({
    ...script,
    sourceContentId: script.sourceContentId ?? input.contentDrafts[i]?.id,
    sourcePlatform: script.sourcePlatform ?? input.contentDrafts[i]?.platform,
  }))
}

/** Generate multiple promotion-focused reel scripts for a specific campaign type. */
export async function generatePromotionReels(input: {
  promotionType: VideoPromotionType
  topic?: string
  count?: number
  format?: VideoFormat
  customPromptDetails?: string
  brandProfile?: BrandProfile
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
  modelConfig?: TaskModelConfig
}): Promise<VideoScript[]> {
  const mc = taskConfig(input, MODEL_TASK.VIDEO_SCRIPTS)
  const count = input.count ?? 3
  const format = input.format ?? 'reel'
  const formatLabel = getVideoFormatLabel(format)
  const promo = VIDEO_PROMOTION_TYPES.find((p) => p.id === input.promotionType)
  const brandContext = buildBrandContext(input.brandProfile)
  const profile = input.brandProfile ?? demoBrandProfile
  const crustdataContext = await loadCrustdata(
    MODEL_TASK.VIDEO_SCRIPTS,
    { topic: input.topic ?? promo?.label },
    input,
  )

  const data = await generateJSON<{ scripts?: Partial<VideoScript>[] }>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system: `You are a short-form video scriptwriter specializing in promotional ${formatLabel} content. Respond only with valid JSON.`,
    user: appendCustomPrompt(`${brandContext}${crustdataPromptBlock(crustdataContext, 'video trend data')}

Promotion type: ${promo?.label ?? input.promotionType}
Goal: ${promo?.description ?? ''}
Hook style: ${promo?.hookStyle ?? 'Attention-grabbing, platform-native'}
${input.topic ? `Topic / offer focus: ${input.topic}` : ''}

Write ${count} distinct ${formatLabel} scripts for this promotion type. Vary hooks and angles (e.g. problem-led, stat-led, story-led) while staying on-brand.

Return JSON:
{
  "scripts": [
    {
      "title": "string",
      "hook": "first 3-second hook",
      "scenes": [{"title": "string", "voiceover": "string", "onScreenText": "string", "visuals": "string"}],
      "voiceover": "full voiceover",
      "bRoll": ["string"],
      "aiVideoPrompt": "vertical 9:16 ${formatLabel}, ${promo?.label ?? 'promotional'} style",
      "cta": "string",
      "duration": "e.g. 0:30"
    }
  ]
}`, input.customPromptDetails),
  })

  return mapVideoScripts(data.scripts, profile, {
    format,
    promotionType: input.promotionType,
  })
}

// ─── Leads ───────────────────────────────────────────────────────────────────
export async function generateLeads(input: {
  count?: number
  criteria?: string
  customPromptDetails?: string
  brandProfile?: BrandProfile
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
  modelConfig?: TaskModelConfig
}): Promise<Lead[]> {
  const mc = taskConfig(input, MODEL_TASK.LEAD_SCORING)
  const count = input.count ?? 12
  const brandContext = buildBrandContext(input.brandProfile)
  const profile = input.brandProfile ?? demoBrandProfile
  const leadSignals = {
    criteria: input.criteria,
    targetCustomer: profile.targetAudience,
    industry: input.research?.industry ?? input.brandProfile?.targetAudience,
    region: input.research?.region,
    count,
  }

  const brightData = hasBrightData()
    ? await fetchBrightDataLeads(leadSignals)
    : { context: '', prospects: [] }

  const crustdataProspects = await fetchCrustdataLeadProspects({
    criteria: input.criteria,
    targetCustomer: profile.targetAudience,
    count,
  })

  const allProspects = dedupeProspects([...brightData.prospects, ...crustdataProspects])

  const crustdataContext =
    brightData.context ||
    (allProspects.length === 0
      ? await loadCrustdata(
          MODEL_TASK.LEAD_SCORING,
          {
            criteria: input.criteria,
            targetCustomer: profile.targetAudience,
            count,
          },
          input,
        )
      : '')

  const prospectContext = brightData.context
    ? brightDataPromptBlock(brightData.context, 'prospect profiles')
    : allProspects.length > 0
      ? crustdataPromptBlock(
          allProspects
            .map(
              (prospect, index) =>
                `${index + 1}. ${prospect.name} | profileUrl: ${prospect.profileUrl || 'n/a'} | company: ${prospect.company || 'n/a'} | title: ${prospect.role || 'n/a'}`,
            )
            .join('\n'),
          'prospect profiles',
        )
      : crustdataPromptBlock(crustdataContext, 'prospect profiles')

  const usingRealProspects = allProspects.length > 0
  const leadCountForPrompt = usingRealProspects ? Math.min(allProspects.length, count) : count

  const data = await generateJSON<{ leads?: Partial<Lead>[] }>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: Math.max(mc.maxTokens, 4096),
    system: prospectContext
      ? brightData.context
        ? `You are a B2B lead generation researcher. Bright Data LinkedIn profiles below are real public people with profile URLs — score each prospect and add outreach angles. Preserve each profileUrl exactly as provided. Do not invent different names, companies, or URLs. Respond only with a valid JSON object.`
        : `You are a B2B lead generation researcher. Real indexed profiles below include profileUrl fields — score each and add outreach angles. Preserve profileUrl exactly. Do not invent different names, companies, or URLs. Respond only with a valid JSON object.`
      : `You are a B2B lead generation researcher. Generate realistic, plausible prospect profiles (these are illustrative examples, not real contact data). Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}${prospectContext}
${input.criteria ? `Targeting criteria: ${input.criteria}` : ''}
${usingRealProspects ? `Score and enrich these ${leadCountForPrompt} real prospects.` : `Generate ${count} qualified prospect profiles that fit the ideal customer.`}

Return JSON with this shape:
{
  "leads": [
    {
      "name": "Full Name",
      "company": "Company",
      "role": "Job title",
      "profileUrl": "https://www.linkedin.com/in/username",
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

  const rawLeads = data.leads ?? []

  if (usingRealProspects) {
    return buildLeadsFromProspects(allProspects, rawLeads, count, profile, (i) => id('l', i))
  }

  const profileUrls = mergeProfileUrls(rawLeads, allProspects)

  return rawLeads.map((l, i) => ({
    id: id('l', i),
    name: l.name ?? `Prospect ${i + 1}`,
    company: l.company ?? '',
    role: l.role ?? '',
    profileUrl: l.profileUrl || profileUrls[i]?.profileUrl || undefined,
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
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
  modelConfig?: TaskModelConfig
}): Promise<OutreachMessage> {
  const mc = taskConfig(input, MODEL_TASK.OUTREACH_WRITING)
  const brandContext = buildBrandContext(input.brandProfile)
  const crustdataContext = await loadCrustdata(
    MODEL_TASK.OUTREACH_WRITING,
    { company: input.company, leadName: input.leadName },
    input,
  )
  const data = await generateJSON<Partial<OutreachMessage>>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system: `You are an expert B2B outreach copywriter. Write warm, personalized, non-spammy messages grounded in CrustData prospect/company data when provided. Respond only with a valid JSON object.`,
    user: appendCustomPrompt(`${brandContext}${crustdataPromptBlock(crustdataContext, 'prospect intelligence')}

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

export async function checkBrandSafety(input: {
  content?: string
  brandProfile?: BrandProfile
  research?: MarketResearch | null
  signals?: CrustdataTaskInput
  modelConfig?: TaskModelConfig
}): Promise<SafetyResult> {
  const mc = taskConfig(input, MODEL_TASK.BRAND_SAFETY)
  const content = input.content || ''
  const brandContext = buildBrandContext(input.brandProfile)
  const crustdataContext = await loadCrustdata(
    MODEL_TASK.BRAND_SAFETY,
    { content },
    input,
  )
  const data = await generateJSON<Partial<SafetyResult>>({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system: `You are a brand safety and compliance reviewer. Detect risky claims, unverifiable guarantees, spammy phrasing, and off-brand language. Use CrustData fact-check signals when provided. Respond only with a valid JSON object.`,
    user: `${brandContext}${crustdataPromptBlock(crustdataContext, 'fact-check data')}

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
  modelConfig?: TaskModelConfig,
  research?: MarketResearch | null,
  signals?: CrustdataTaskInput,
): Promise<string> {
  const mc = modelConfig ?? resolveTaskModel(MODEL_TASK.ANALYTICS_SUMMARY)
  const brandContext = buildBrandContext(brandProfile)
  const crustdataContext = await loadCrustdata(
    MODEL_TASK.ANALYTICS_SUMMARY,
    { topic: taskType, goal: input },
    { brandProfile, research, signals },
  )
  return generateText({
    model: mc.model,
    fallbackModel: mc.fallbackModel,
    modelChain: mc.modelChain,
    temperature: mc.temperature,
    maxTokens: mc.maxTokens,
    system: `You are an AI marketing agent specialized in "${taskType}". Ground analysis in CrustData when provided. ${brandContext}`,
    user: appendCustomPrompt(
      `${crustdataPromptBlock(crustdataContext, 'analytics data')}${input || `Perform the "${taskType}" task and summarize the result.`}`,
      customPromptDetails,
    ),
  })
}
