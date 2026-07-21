import type {
  AgentDefinition,
  AgentTask,
  Campaign,
  ContentDraft,
  GeneratedTopic,
  Lead,
  MarketResearch,
  OutreachMessage,
  CalendarPost,
  PublishLog,
  VideoScript,
  BrandProfile,
} from '@/types'
import { demoAgents, demoAgentTasks, demoIntegrations, demoModelRouting, demoROI, demoSafetySettings } from '@/lib/demo/data'
import { getAvailableModels } from '@/lib/models'

export const INVESTOR_PITCH_CAMPAIGN_ID = 'camp-investor-pitch'

export const INVESTOR_PITCH_COMPANY = {
  name: 'ContentOps AI',
  industry: 'AI marketing & sales automation',
  targetCustomers: 'marketing teams, agencies, and growth founders who need faster social content, lead gen, and sales outreach',
  region: 'United States & Japan',
  goal: 'Scale social presence and sales pipeline with AI agents — research, create, schedule, publish, and convert leads across LinkedIn, X, Instagram, and email',
}

export const investorPitchCampaign: Campaign = {
  id: INVESTOR_PITCH_CAMPAIGN_ID,
  companyName: INVESTOR_PITCH_COMPANY.name,
  industry: INVESTOR_PITCH_COMPANY.industry,
  targetAudience: INVESTOR_PITCH_COMPANY.targetCustomers,
  region: INVESTOR_PITCH_COMPANY.region,
  productService:
    'Multi-agent marketing OS: research, content, video, scheduling, publishing, lead discovery, and outreach — one command center',
  campaignGoal: INVESTOR_PITCH_COMPANY.goal,
  platforms: ['linkedin', 'x', 'email', 'carousel'],
  tone: 'Confident, helpful, results-focused',
  contentFrequency: '5 posts per week + 3 sales touchpoints',
  startDate: '2026-06-01',
  endDate: '2026-09-30',
  mainOffer: 'Free 14-day trial + live onboarding walkthrough',
  ctaStyle: 'Start free trial / Book demo',
  status: 'active',
}

export const investorPitchResearch: MarketResearch = {
  id: 'mr-investor-001',
  industry: INVESTOR_PITCH_COMPANY.industry,
  targetCustomer: INVESTOR_PITCH_COMPANY.targetCustomers,
  region: INVESTOR_PITCH_COMPANY.region,
  competitors: ['Jasper', 'Copy.ai', 'HubSpot AI', 'Hootsuite', 'Traditional agency retainers'],
  offer: 'Free trial + live multi-agent platform demo',
  marketSummary:
    'Marketing teams spend 15+ hours/week on content, scheduling, and outreach across disconnected tools. ContentOps AI replaces the stack with 11 coordinated agents — research, strategy, content, video, safety, calendar, publishing, leads, outreach, and analytics — in one command center.',
  painPoints: [
    'Manual content creation across LinkedIn, X, and Instagram eats the week',
    'Social scheduling and publishing live in separate tools from lead gen',
    'Sales outreach is disconnected from content performance',
    'Agencies and freelancers are slow and hard to scale',
    'No single view of hours saved, posts shipped, or pipeline impact',
  ],
  trends: [
    { title: 'Multi-Agent Marketing', description: 'Teams want coordinated AI agents, not one-off prompts', score: 96 },
    { title: 'Social-First GTM', description: 'Content-led demand gen on LinkedIn and X', score: 88 },
    { title: 'Human-in-the-Loop AI', description: 'Approval boards before anything goes live', score: 92 },
    { title: 'Sales + Marketing Unification', description: 'Same agents for content and outreach', score: 84 },
  ],
  competitorGaps: [
    { competitor: 'Jasper / Copy.ai', gap: 'Copy-only — no leads, calendar, or publish', opportunity: 'Full-funnel agent OS' },
    { competitor: 'HubSpot AI', gap: 'CRM-centric, weak creative agents', opportunity: 'Creator-first workflow' },
    { competitor: 'Agencies', gap: 'Manual, opaque ROI', opportunity: 'Transparent hours-saved metrics' },
  ],
  keywords: [
    { keyword: 'AI social media manager', volume: 4100, intent: 'high' },
    { keyword: 'content operations automation', volume: 1900, intent: 'high' },
    { keyword: 'AI marketing agents', volume: 3200, intent: 'high' },
    { keyword: 'automated sales outreach', volume: 2400, intent: 'medium' },
  ],
  highIntentTopics: [
    'How AI agents replace your content + social + outreach stack',
    'Week-one ROI: hours saved on a real marketing campaign',
    'From research to published post in one workflow',
    'Safety-first AI publishing for brand teams',
    'Run LinkedIn, X, and email from one command center',
  ],
  opportunityScore: 91,
}

export const investorPitchTopics: GeneratedTopic[] = [
  {
    id: 'tp-1',
    title: 'Why multi-agent beats single-prompt marketing tools',
    pillar: 'Product differentiation',
    intentScore: 94,
    searchIntent: 'commercial',
    contentAngle: 'Orchestration story with live agent statuses',
    suggestedFormats: ['LinkedIn carousel', 'Thread'],
    hookIdeas: ['Your marketing stack has 12 tabs. Ours has 11 agents.'],
    keyPointsCovered: ['End-to-end workflow', 'Approval gates', 'ROI dashboard'],
    rationale: 'Core product narrative — full-stack vs copy-only tools',
  },
  {
    id: 'tp-2',
    title: 'Week-one ROI: hours saved on a real campaign',
    pillar: 'Results proof',
    intentScore: 92,
    searchIntent: 'commercial',
    contentAngle: 'Screenshot-friendly metrics from Impact Report',
    suggestedFormats: ['LinkedIn post', 'Email'],
    hookIdeas: ['5+ hours saved before the first week ended'],
    keyPointsCovered: ['Hours saved', 'Cost reduction', 'Agent productivity'],
    rationale: 'Buyers want operational proof, not vanity metrics',
  },
  {
    id: 'tp-3',
    title: 'Human-in-the-loop: why we ship an Approval Board',
    pillar: 'Trust & safety',
    intentScore: 88,
    searchIntent: 'informational',
    contentAngle: 'Brand safety agent + compliance',
    suggestedFormats: ['LinkedIn', 'Blog excerpt'],
    hookIdeas: ['AI that publishes without approval is a liability'],
    keyPointsCovered: ['Claim detection', 'Outreach approval', 'Brand safety'],
    rationale: 'De-risks AI adoption for marketing teams',
  },
  {
    id: 'tp-4',
    title: 'One calendar for LinkedIn, X, Instagram, and email',
    pillar: 'Social ops',
    intentScore: 85,
    searchIntent: 'informational',
    contentAngle: 'Multi-platform scheduling from one dashboard',
    suggestedFormats: ['Carousel', 'Video script'],
    hookIdeas: ['Stop tab-switching between Hootsuite, Canva, and your CRM'],
    keyPointsCovered: ['Cross-platform publish', 'Calendar optimization', 'Unified workflow'],
    rationale: 'Shows social media management value',
  },
  {
    id: 'tp-5',
    title: 'From content to qualified lead — same agent pipeline',
    pillar: 'Sales enablement',
    intentScore: 90,
    searchIntent: 'commercial',
    contentAngle: 'Content performance → lead scoring → outreach',
    suggestedFormats: ['Email', 'LinkedIn'],
    hookIdeas: ['Your posts should feed your pipeline, not just your feed'],
    keyPointsCovered: ['Lead finder', 'Outreach agent', 'Pipeline attribution'],
    rationale: 'Connects marketing to sales outcomes',
  },
]

export const investorPitchContentDrafts: ContentDraft[] = [
  {
    id: 'ipc1',
    platform: 'linkedin',
    hook: 'We did not build another chatbot. We built a marketing command center.',
    mainCopy:
      'ContentOps AI runs 11 specialized agents — research, strategy, content, video, safety, calendar, publish, leads, outreach, and analytics — in one pipeline.\n\nSet your campaign once. Agents create social posts, schedule across platforms, find leads, and draft sales outreach — with human approval before anything goes live.\n\nTry it free for 14 days.',
    cta: 'Start free trial →',
    hashtags: ['#AIMarketing', '#SocialMedia', '#ContentOps'],
    audienceFitScore: 96,
    brandSafetyScore: 98,
    leadPotentialScore: 94,
    status: 'approved',
    campaignId: INVESTOR_PITCH_CAMPAIGN_ID,
  },
  {
    id: 'ipc2',
    platform: 'linkedin',
    hook: '5+ hours saved in week one — real dashboard, real campaign.',
    mainCopy:
      'Our Impact Report tracks hours saved, posts generated, leads found, and agent productivity from live workspace runs — not vanity impressions.\n\nMarketing teams use the same dashboard to prove ROI to leadership and clients.',
    cta: 'See the live demo workspace',
    hashtags: ['#MarketingROI', '#AIAgents'],
    audienceFitScore: 93,
    brandSafetyScore: 97,
    leadPotentialScore: 91,
    status: 'scheduled',
    campaignId: INVESTOR_PITCH_CAMPAIGN_ID,
  },
  {
    id: 'ipc3',
    platform: 'carousel',
    hook: '11 agents. 1 workflow. 0 context switching.',
    mainCopy:
      'Slide 1: Campaign goal\nSlide 2: Market research\nSlide 3: Topic strategy\nSlide 4: Content + video\nSlide 5: Approval board\nSlide 6: Calendar + publish\nSlide 7: Leads + outreach\nSlide 8: ROI analytics',
    cta: 'Swipe → book demo',
    hashtags: ['#ProductDemo'],
    audienceFitScore: 95,
    brandSafetyScore: 99,
    leadPotentialScore: 88,
    status: 'approved',
    campaignId: INVESTOR_PITCH_CAMPAIGN_ID,
  },
  {
    id: 'ipc4',
    platform: 'x',
    hook: 'Your marketing team needs agents, not another tab.',
    mainCopy:
      'ContentOps AI — AI agents for content, social, and sales.\n\n✓ Research → create → schedule → publish\n✓ LinkedIn, X, Instagram, email\n✓ Lead finder + outreach built in\n\nFree trial → link in bio',
    cta: 'Start free trial',
    hashtags: ['#MarTech', '#AI'],
    audienceFitScore: 84,
    brandSafetyScore: 94,
    leadPotentialScore: 86,
    status: 'needs_review',
    campaignId: INVESTOR_PITCH_CAMPAIGN_ID,
  },
  {
    id: 'ipc5',
    platform: 'email',
    hook: 'Subject: 15-min demo — AI agents for content, social & sales',
    mainCopy:
      'Hi {{first_name}},\n\nContentOps AI replaces your scattered marketing stack with 11 coordinated agents — market research, social content, scheduling, publishing, lead discovery, and sales outreach from one dashboard.\n\nHappy to run a live 15-min walkthrough of the full pipeline.\n\nBest,\nContentOps team',
    cta: 'Reply with a time that works',
    hashtags: [],
    audienceFitScore: 97,
    brandSafetyScore: 99,
    leadPotentialScore: 95,
    status: 'approved',
    campaignId: INVESTOR_PITCH_CAMPAIGN_ID,
  },
]

export const investorPitchVideoScripts: VideoScript[] = [
  {
    id: 'ipv1',
    title: '60s: Full platform demo — content to lead',
    hook: 'From campaign goal to qualified lead — in one screen.',
    scenes: [
      { title: 'Overview', voiceover: 'This is ContentOps AI.', onScreenText: 'Command Center', visuals: 'Dashboard pan' },
      { title: 'Agents', voiceover: 'Eleven agents, one workflow.', onScreenText: '11 Agents', visuals: 'Agent grid' },
      { title: 'ROI', voiceover: 'Hours saved, visible immediately.', onScreenText: '5.25h saved', visuals: 'Impact report' },
    ],
    voiceover: 'Full product demo script...',
    bRoll: ['Product UI', 'Marketing workflow'],
    aiVideoPrompt: 'SaaS product demo, dark UI, violet accents, professional',
    cta: 'Start free trial',
    duration: '1:00',
    status: 'approved',
  },
  {
    id: 'ipv2',
    title: '30s: Why marketing teams need AI agents',
    hook: 'Content, social, and sales — one agent team.',
    scenes: [{ title: 'Problem', voiceover: 'Too many tools.', onScreenText: '15+ hrs/week', visuals: 'Tab chaos animation' }],
    voiceover: 'Marketing pain script...',
    bRoll: ['Stats overlay'],
    aiVideoPrompt: 'Clean motion graphics, social media icons, professional',
    cta: 'Book a demo',
    duration: '0:30',
    status: 'scheduled',
  },
]

export const investorPitchLeads: Lead[] = [
  { id: 'il1', name: 'Alex Morgan', company: 'BrightPath Agency', role: 'Marketing Director', platform: 'linkedin', matchReason: 'Posted about scaling client content output', painPoint: 'Team spends 20+ hrs/week on social posts per client', suggestedOffer: 'Free trial + agency onboarding', score: 96, status: 'qualified', suggestedAction: 'Send personalized demo invite' },
  { id: 'il2', name: 'Priya Shah', company: 'ScaleUp SaaS', role: 'Head of Growth', platform: 'linkedin', matchReason: 'Engaged with AI marketing automation content', painPoint: 'Content and outreach live in separate tools', suggestedOffer: 'ROI dashboard walkthrough', score: 91, status: 'reviewed', suggestedAction: 'Share Impact Report screenshot' },
  { id: 'il3', name: 'James Liu', company: 'Liu Digital', role: 'Founder', platform: 'x', matchReason: 'Active in #MarTech and #AIAgents', painPoint: 'Solo founder doing all content + sales outreach', suggestedOffer: '15-min product demo', score: 88, status: 'contacted', suggestedAction: 'Follow up on DM' },
  { id: 'il4', name: 'Elena Vasquez', company: 'Northwind B2B', role: 'VP Marketing', platform: 'linkedin', matchReason: 'Attended social selling webinar', painPoint: 'LinkedIn pipeline flat despite posting weekly', suggestedOffer: 'Lead finder + outreach demo', score: 89, status: 'new', suggestedAction: 'Draft outreach' },
  { id: 'il5', name: 'Ken Yamada', company: 'Tokyo Growth Co', role: 'CMO', platform: 'linkedin', matchReason: 'Japan market + bilingual content needs', painPoint: 'Managing JP and US social from different tools', suggestedOffer: 'Multi-region campaign demo', score: 94, status: 'qualified', suggestedAction: 'Schedule JP-friendly call' },
  { id: 'il6', name: 'Sarah Okonkwo', company: 'RevLoop', role: 'Sales Lead', platform: 'linkedin', matchReason: 'Shared thread on AI outreach tools', painPoint: 'Sales team lacks content that converts to meetings', suggestedOffer: 'Content-to-outreach pipeline demo', score: 87, status: 'replied', suggestedAction: 'Send calendar link' },
]

export const investorPitchOutreach: OutreachMessage[] = investorPitchLeads.map((lead, i) => ({
  id: `io${i + 1}`,
  leadId: lead.id,
  leadName: lead.name,
  linkedinConnection: `Hi ${lead.name.split(' ')[0]}, we built ContentOps AI — AI agents that handle content, social scheduling, publishing, and sales outreach from one dashboard. Would love to show you if ${lead.company} is looking to scale marketing without adding headcount.`,
  linkedinFollowUp: `Thanks for connecting! Happy to run a 15-min live demo — research through outreach — if useful for your team at ${lead.company}.`,
  emailSubject: `Demo: AI agents for content, social & sales (${INVESTOR_PITCH_COMPANY.name})`,
  emailBody: `Hi ${lead.name.split(' ')[0]},\n\nContentOps AI replaces scattered marketing tools with 11 coordinated agents — social content, scheduling, publishing, lead discovery, and outreach in one place.\n\nCan I book a short live walkthrough for ${lead.company}?\n\nBest,\nContentOps AI`,
  shortPitch: `${lead.company} — live agent pipeline for content, social, and sales.`,
  personalizationReason: lead.matchReason,
  approved: i < 4,
}))

export const investorPitchCalendarPosts: CalendarPost[] = [
  { id: 'ical1', platform: 'linkedin', title: 'Marketing command center, not chatbot', time: '09:00', date: '2026-06-02', status: 'scheduled', campaign: 'ContentOps AI Launch', owner: 'Content Agent' },
  { id: 'ical2', platform: 'linkedin', title: '5+ hours saved week one', time: '09:00', date: '2026-06-04', status: 'scheduled', campaign: 'ContentOps AI Launch', owner: 'Analytics Agent' },
  { id: 'ical3', platform: 'x', title: 'AI agents for social + sales', time: '14:00', date: '2026-06-05', status: 'scheduled', campaign: 'ContentOps AI Launch', owner: 'Content Agent' },
  { id: 'ical4', platform: 'linkedin', title: '11 agents carousel', time: '09:00', date: '2026-06-09', status: 'scheduled', campaign: 'ContentOps AI Launch', owner: 'Strategy Agent' },
  { id: 'ical5', platform: 'email', title: 'Prospect demo invite batch', time: '10:00', date: '2026-06-10', status: 'scheduled', campaign: 'ContentOps AI Launch', owner: 'Outreach Agent' },
]

export const investorPitchPublishLogs: PublishLog[] = [
  { id: 'ipub1', title: 'We built a command center', platform: 'linkedin', status: 'success', time: '2026-05-28T09:00:00Z', url: 'https://linkedin.com/posts/mock/contentops-pitch' },
  { id: 'ipub2', title: 'Agent ROI thread', platform: 'x', status: 'success', time: '2026-05-27T14:00:00Z', url: 'https://x.com/mock/status/contentops-roi' },
  { id: 'ipub3', title: 'Approval board deep dive', platform: 'linkedin', status: 'scheduled', time: '2026-06-06T09:00:00Z' },
]

export const investorPitchAgents: AgentDefinition[] = demoAgents.map((a) => {
  const overrides: Partial<Record<string, Partial<AgentDefinition>>> = {
    research: { currentTask: 'Mapping AI marketing ops TAM', status: 'completed', progress: 100, lastOutput: '91 opportunity score, 4 competitor gaps' },
    strategy: { currentTask: 'Content pillar strategy', status: 'completed', progress: 100, lastOutput: '5 high-intent marketing topics' },
    content: { currentTask: 'LinkedIn + X post batch', status: 'running', progress: 78, lastOutput: '5 drafts — 2 approved for publish' },
    video: { currentTask: '60s product demo script', status: 'running', progress: 70, lastOutput: '2 video scripts ready for review' },
    safety: { currentTask: 'Brand claim review', status: 'waiting_for_approval', progress: 95, lastOutput: 'Flagged: ROI stat — verify source' },
    leadfinder: { currentTask: 'Prospect signal scan', status: 'running', progress: 62, lastOutput: '6 qualified marketing leads' },
    outreach: { currentTask: 'Personalized demo invites', status: 'running', progress: 45, lastOutput: '4 outreach drafts approved' },
    analytics: { currentTask: 'Campaign ROI report', status: 'completed', progress: 100, lastOutput: 'Impact report ready for client review' },
  }
  return { ...a, ...overrides[a.id] }
})

export const investorPitchTasks: AgentTask[] = demoAgentTasks.map((t, i) => ({
  ...t,
  name: [
    'AI marketing ops market scan',
    'Content pillar strategy',
    'Social post batch — LinkedIn + X',
    'Product demo reel scripts',
    'Brand safety review',
    'June social calendar',
    'Prospect signal scan',
    'Demo invite outreach',
    'Campaign ROI compile',
    'Scheduled publish batch',
  ][i] ?? t.name,
}))

export const investorPitchBrandProfile: BrandProfile = {
  brandName: INVESTOR_PITCH_COMPANY.name,
  brandDescription:
    'Multi-agent marketing operations platform — research, create, approve, publish, and convert leads with measurable ROI.',
  targetAudience: INVESTOR_PITCH_COMPANY.targetCustomers,
  tone: 'Confident, helpful, results-focused',
  wordsToAvoid: ['guaranteed results', 'revolutionary', 'set and forget', 'replace your team'],
  contentRules: ['Cite ROI from dashboard', 'Include approval-board mention', 'Offer free trial or demo CTA', 'No unsubstantiated performance claims'],
  productDescription: '11-agent platform for content generation, social media management, lead discovery, and sales outreach',
  mainOffer: 'Free 14-day trial + live onboarding walkthrough',
  ctaStyle: 'Start free trial / Book demo',
  themeCollection: [
    {
      id: 'theme-contentops-investor',
      sourceUrl: 'https://contentops.ai',
      companyName: INVESTOR_PITCH_COMPANY.name,
      extractedAt: '2026-05-30T10:00:00Z',
      colors: [
        { role: 'primary', hex: '#7c3aed', label: 'Violet' },
        { role: 'secondary', hex: '#3b82f6', label: 'Blue' },
        { role: 'accent', hex: '#34d399', label: 'Success green' },
        { role: 'background', hex: '#0c0a14', label: 'Deep navy' },
        { role: 'text', hex: '#f1f5f9', label: 'Light text' },
      ],
      typography: 'Geist / display serif for headlines',
      visualStyle: 'Premium SaaS, holographic dashboard, social-first marketing aesthetic',
      mood: 'Fast, capable, trustworthy',
      notes: 'Use pipeline progress and agent status chips in visuals.',
    },
  ],
  activeThemeId: 'theme-contentops-investor',
}

/** Fast campaign demo — 3 screens in ~2 minutes */
export const quickCampaignTourSteps = [
  { step: 1, label: 'Overview', href: '/dashboard', blurb: 'Agents live, KPIs, pipeline' },
  { step: 2, label: 'Content', href: '/dashboard/content', blurb: 'AI posts ready to publish' },
  { step: 3, label: 'Leads', href: '/dashboard/leads', blurb: 'Scored prospects + outreach' },
] as const

/** Full platform walkthrough — all modules */
export const investorPitchTourSteps = [
  { step: 1, label: 'Overview', href: '/dashboard', blurb: 'KPIs, pipeline, and agent activity at a glance' },
  { step: 2, label: 'Campaign', href: '/dashboard/campaign-builder', blurb: 'Campaign goals and AI workflow' },
  { step: 3, label: 'Research', href: '/dashboard/research', blurb: 'Market trends and competitor gaps' },
  { step: 4, label: 'Content', href: '/dashboard/content', blurb: 'Social posts and content topics' },
  { step: 5, label: 'Video', href: '/dashboard/video', blurb: 'Short-form video scripts for social' },
  { step: 6, label: 'Approve & Publish', href: '/dashboard/approval', blurb: 'Review, approve, and publish to platforms' },
  { step: 7, label: 'Calendar', href: '/dashboard/calendar', blurb: 'Cross-platform content schedule' },
  { step: 8, label: 'Leads', href: '/dashboard/leads', blurb: 'Prospects scored for outreach' },
  { step: 9, label: 'Outreach', href: '/dashboard/outreach', blurb: 'Personalized sales messages' },
  { step: 10, label: 'Analytics', href: '/dashboard/analytics', blurb: 'Marketing and sales ROI' },
  { step: 11, label: 'Impact', href: '/dashboard/impact-report', blurb: 'Before/after results summary' },
] as const

export function isInvestorPitchCampaign(campaignId: string): boolean {
  return campaignId === INVESTOR_PITCH_CAMPAIGN_ID
}

export function buildInvestorPitchWorkspaceSlice() {
  return {
    campaign: { ...investorPitchCampaign },
    research: { ...investorPitchResearch },
    topics: [...investorPitchTopics],
    contentDrafts: [...investorPitchContentDrafts],
    videoScripts: [...investorPitchVideoScripts],
    generatedImages: [],
    generatedVideos: [],
    leads: [...investorPitchLeads],
    outreach: [...investorPitchOutreach],
    agents: investorPitchAgents.map((a) => ({ ...a })),
    tasks: investorPitchTasks.map((t) => ({ ...t })),
    calendarPosts: [...investorPitchCalendarPosts],
    publishLogs: [...investorPitchPublishLogs],
    roi: {
      ...demoROI,
      weeklyHoursSaved: 8.5,
      monthlyCostSaved: 2720,
      contentOutputIncrease: 420,
      campaignSpeedImprovement: 85,
      agentProductivity: demoROI.agentProductivity.map((a) => ({ ...a })),
      postsGenerated: [
        { week: 'W1', count: 4 },
        { week: 'W2', count: 7 },
        { week: 'W3', count: 11 },
        { week: 'W4', count: 14 },
      ],
      leadScores: [
        { week: 'W1', avgScore: 78 },
        { week: 'W2', avgScore: 84 },
        { week: 'W3', avgScore: 89 },
        { week: 'W4', avgScore: 93 },
      ],
    },
    brandProfile: { ...investorPitchBrandProfile },
    safetySettings: { ...demoSafetySettings },
    integrations: demoIntegrations.map((i) => ({ ...i, connected: i.id === 'linkedin', mockMode: false })),
    models: getAvailableModels().map((m) => ({ ...m })),
    modelRouting: demoModelRouting.map((r) => ({ ...r })),
    lastWorkflow: {
      workflowId: 'wf-investor-pitch',
      live: false,
      completedAt: '2026-05-30T08:00:00Z',
      estimatedTimeSaved: '8.5 hrs',
    },
    customPromptDetails:
      'Product demo mode: emphasize AI agents for content generation, social media management, lead discovery, and sales outreach. Show end-to-end workflow from campaign setup to publish to pipeline. Tone: confident, practical. CTA: free trial or book demo.',
  }
}
