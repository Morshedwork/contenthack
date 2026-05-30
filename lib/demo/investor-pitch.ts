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
import { demoAgents, demoAgentTasks, demoIntegrations, demoModels, demoModelRouting, demoROI, demoSafetySettings } from '@/lib/demo/data'

export const INVESTOR_PITCH_CAMPAIGN_ID = 'camp-investor-pitch'

export const INVESTOR_PITCH_COMPANY = {
  name: 'ContentOps AI',
  industry: 'B2B SaaS — AI marketing operations',
  targetCustomers: 'seed-stage VCs, angel syndicates, and growth-stage marketing leaders evaluating AI ops platforms',
  region: 'United States & Japan',
  goal: 'Build investor pipeline and thought leadership for a $2M seed round via multi-agent content, outreach, and ROI proof',
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
  tone: 'Confident, data-driven, founder-authentic',
  contentFrequency: '4 posts per week + 2 investor touchpoints',
  startDate: '2026-06-01',
  endDate: '2026-09-30',
  mainOffer: 'Private data room + 15-min product walkthrough for qualified investors',
  ctaStyle: 'Request deck & live demo',
  status: 'active',
}

export const investorPitchResearch: MarketResearch = {
  id: 'mr-investor-001',
  industry: INVESTOR_PITCH_COMPANY.industry,
  targetCustomer: INVESTOR_PITCH_COMPANY.targetCustomers,
  region: INVESTOR_PITCH_COMPANY.region,
  competitors: ['Jasper', 'Copy.ai', 'HubSpot AI', 'Clay', 'Traditional agency retainers'],
  offer: 'Private data room + live multi-agent demo',
  marketSummary:
    'Marketing ops automation is a $28B+ category growing 22% YoY. Investors are funding “AI employee” stacks; teams want measurable hours saved, not another chat UI. ContentOps AI differentiates with end-to-end agent orchestration and approval-gated publishing.',
  painPoints: [
    'Founders burn 15+ hrs/week on content + outreach with no pipeline attribution',
    'Point tools don’t connect research → publish → leads',
    'Agencies are slow and expensive for early-stage teams',
    'Investors want proof of agent ROI, not slideware',
    'Compliance risk without brand-safety gates',
  ],
  trends: [
    { title: 'Multi-Agent Orchestration', description: 'Buyers want coordinated agents, not single prompts', score: 96 },
    { title: 'Content-Led Fundraising', description: 'Founders raise visibility before warm intros', score: 88 },
    { title: 'Human-in-the-Loop AI', description: 'Approval boards required for brand & compliance', score: 92 },
    { title: 'JP–US Cross-Border SaaS', description: 'Dual-market GTM for AI ops tools', score: 84 },
  ],
  competitorGaps: [
    { competitor: 'Jasper / Copy.ai', gap: 'Copy-only — no leads, calendar, or publish', opportunity: 'Full-funnel agent OS' },
    { competitor: 'HubSpot AI', gap: 'CRM-centric, weak creative agents', opportunity: 'Creator-first workflow' },
    { competitor: 'Agencies', gap: 'Manual, opaque ROI', opportunity: 'Transparent hours-saved metrics' },
  ],
  keywords: [
    { keyword: 'AI marketing agents', volume: 3200, intent: 'high' },
    { keyword: 'content operations automation', volume: 1900, intent: 'high' },
    { keyword: 'seed stage GTM AI', volume: 890, intent: 'high' },
    { keyword: 'multi-agent SaaS', volume: 1400, intent: 'medium' },
  ],
  highIntentTopics: [
    'Why we built a marketing command center, not another chatbot',
    'Agent ROI: 5.25 hours saved in week one (real dashboard)',
    'From research to published post in one workflow',
    'Safety-first AI publishing for regulated brands',
    'Japan + US GTM with the same agent stack',
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
    rationale: 'Core investor narrative — category creation',
  },
  {
    id: 'tp-2',
    title: 'Week-one ROI: hours saved on a real campaign',
    pillar: 'Traction proof',
    intentScore: 92,
    searchIntent: 'commercial',
    contentAngle: 'Screenshot-friendly metrics from Impact Report',
    suggestedFormats: ['LinkedIn post', 'Email'],
    hookIdeas: ['5.25 hours saved before we finished the pitch deck'],
    keyPointsCovered: ['Hours saved', 'Cost reduction', 'Agent productivity'],
    rationale: 'Investors want operational proof, not vanity metrics',
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
    keyPointsCovered: ['Claim detection', 'Outreach approval', 'Enterprise readiness'],
    rationale: 'De-risks AI adoption for investors',
  },
  {
    id: 'tp-4',
    title: 'Building for Japan and global from day one',
    pillar: 'Market expansion',
    intentScore: 85,
    searchIntent: 'informational',
    contentAngle: 'Cross-border GTM + localization',
    suggestedFormats: ['Carousel', 'Video script'],
    hookIdeas: ['Same agents, two markets — JST-optimized scheduling'],
    keyPointsCovered: ['Region targeting', 'Calendar optimization', 'Bilingual outreach'],
    rationale: 'Shows TAM and founder market insight',
  },
  {
    id: 'tp-5',
    title: 'The $2M seed: what we will build next',
    pillar: 'Fundraise',
    intentScore: 90,
    searchIntent: 'commercial',
    contentAngle: 'Use of funds — integrations, models, enterprise',
    suggestedFormats: ['Email', 'LinkedIn'],
    hookIdeas: ['We are raising to turn every marketing team into an agent team'],
    keyPointsCovered: ['Roadmap', 'Team', 'Milestones'],
    rationale: 'Direct investor CTA',
  },
]

export const investorPitchContentDrafts: ContentDraft[] = [
  {
    id: 'ipc1',
    platform: 'linkedin',
    hook: 'We did not build another chatbot. We built a marketing command center.',
    mainCopy:
      'ContentOps AI runs 11 specialized agents — research, strategy, content, video, safety, calendar, publish, leads, outreach, and analytics — in one pipeline.\n\nFounders configure a campaign once. Agents execute with human approval at every publish step.\n\nLive demo available for qualified investors.',
    cta: 'Request deck + 15-min walkthrough →',
    hashtags: ['#AIAgents', '#SaaS', '#Fundraising'],
    audienceFitScore: 96,
    brandSafetyScore: 98,
    leadPotentialScore: 94,
    status: 'approved',
    campaignId: INVESTOR_PITCH_CAMPAIGN_ID,
  },
  {
    id: 'ipc2',
    platform: 'linkedin',
    hook: '5.25 hours saved in week one — with mock integrations off.',
    mainCopy:
      'Our Impact Report tracks hours saved, cost reduction, and agent productivity from real workspace runs — not vanity impressions.\n\nThis is the same dashboard we use to pitch: transparent ROI for buyers and investors.',
    cta: 'See the live investor demo workspace',
    hashtags: ['#BuildInPublic', '#AIROI'],
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
    hook: 'Raising $2M seed to give every marketing team an agent army.',
    mainCopy:
      'ContentOps AI — multi-agent marketing OS.\n\n✓ Research → publish → leads\n✓ Model hub (GPT-4o, Kimi, PixVerse)\n✓ Approval-gated publishing\n\nDM for data room.',
    cta: 'DM for deck',
    hashtags: ['#startups', '#AI'],
    audienceFitScore: 84,
    brandSafetyScore: 94,
    leadPotentialScore: 86,
    status: 'needs_review',
    campaignId: INVESTOR_PITCH_CAMPAIGN_ID,
  },
  {
    id: 'ipc5',
    platform: 'email',
    hook: 'Subject: 15-min live demo — multi-agent marketing OS',
    mainCopy:
      'Hi {{first_name}},\n\nWe are building ContentOps AI — agents that run market research, content, scheduling, publishing, and investor-grade outreach from one dashboard.\n\nHappy to share our deck and run a live walkthrough of the full pipeline (no slides-only pitch).\n\nBest,\nContentOps team',
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
    title: '60s: Full pipeline investor demo',
    hook: 'From campaign goal to qualified lead — in one screen.',
    scenes: [
      { title: 'Overview', voiceover: 'This is ContentOps AI.', onScreenText: 'Command Center', visuals: 'Dashboard pan' },
      { title: 'Agents', voiceover: 'Eleven agents, one workflow.', onScreenText: '11 Agents', visuals: 'Agent grid' },
      { title: 'ROI', voiceover: 'Hours saved, visible immediately.', onScreenText: '5.25h saved', visuals: 'Impact report' },
    ],
    voiceover: 'Full investor demo script...',
    bRoll: ['Product UI', 'Founder intro'],
    aiVideoPrompt: 'SaaS product demo, dark UI, violet accents, professional',
    cta: 'Request live walkthrough',
    duration: '1:00',
    status: 'approved',
  },
  {
    id: 'ipv2',
    title: '30s: Why now for AI marketing ops',
    hook: 'Marketing teams are the next function to get an agent team.',
    scenes: [{ title: 'Market', voiceover: '$28B category.', onScreenText: '22% YoY', visuals: 'Chart animation' }],
    voiceover: 'Market timing script...',
    bRoll: ['Stats overlay'],
    aiVideoPrompt: 'Investor-style motion graphics, clean typography',
    cta: 'See data room',
    duration: '0:30',
    status: 'scheduled',
  },
]

export const investorPitchLeads: Lead[] = [
  { id: 'il1', name: 'Alex Morgan', company: 'Horizon Ventures', role: 'Partner', platform: 'linkedin', matchReason: 'Posted about AI agent infrastructure', painPoint: 'Portfolio companies lack unified marketing ops', suggestedOffer: 'Live demo + data room', score: 96, status: 'qualified', suggestedAction: 'Send personalized deck request' },
  { id: 'il2', name: 'Priya Shah', company: 'Northstar Capital', role: 'Principal', platform: 'linkedin', matchReason: 'Engaged with B2B AI SaaS content', painPoint: 'Needs traction metrics beyond ARR', suggestedOffer: 'ROI dashboard walkthrough', score: 91, status: 'reviewed', suggestedAction: 'Share Impact Report screenshot' },
  { id: 'il3', name: 'James Liu', company: 'Pacific Angels', role: 'Angel', platform: 'x', matchReason: 'Active in #AIAgents hashtag', painPoint: 'Wants founder-led GTM tools', suggestedOffer: '15-min product demo', score: 88, status: 'contacted', suggestedAction: 'Follow up on DM' },
  { id: 'il4', name: 'Elena Vasquez', company: 'ScaleUp Fund', role: 'Associate', platform: 'linkedin', matchReason: 'Attended AI ops webinar', painPoint: 'Evaluating marketing automation bets', suggestedOffer: 'Competitive matrix', score: 89, status: 'new', suggestedAction: 'Draft outreach' },
  { id: 'il5', name: 'Ken Yamada', company: 'Tokyo Bridge VC', role: 'Partner', platform: 'linkedin', matchReason: 'Japan cross-border SaaS focus', painPoint: 'Needs JP+US GTM proof', suggestedOffer: 'Bilingual campaign demo', score: 94, status: 'qualified', suggestedAction: 'Schedule JP-friendly call' },
  { id: 'il6', name: 'Sarah Okonkwo', company: 'Founders Guild', role: 'Syndicate Lead', platform: 'linkedin', matchReason: 'Shared multi-agent thread', painPoint: 'Members ask for marketing AI stack', suggestedOffer: 'Syndicate office hours demo', score: 87, status: 'replied', suggestedAction: 'Send calendar link' },
]

export const investorPitchOutreach: OutreachMessage[] = investorPitchLeads.map((lead, i) => ({
  id: `io${i + 1}`,
  leadId: lead.id,
  leadName: lead.name,
  linkedinConnection: `Hi ${lead.name.split(' ')[0]}, we're building ContentOps AI — a multi-agent marketing OS with measurable ROI (hours saved, not just impressions). Would value your perspective as someone who backs ${lead.company.includes('Tokyo') ? 'cross-border' : 'B2B AI'} companies.`,
  linkedinFollowUp: `Thanks for connecting! Happy to share a 15-min live demo of the full agent pipeline — research through outreach — if useful for your ${lead.company} thesis.`,
  emailSubject: `Live demo: multi-agent marketing OS (${INVESTOR_PITCH_COMPANY.name})`,
  emailBody: `Hi ${lead.name.split(' ')[0]},\n\nWe're raising a $2M seed for ContentOps AI. Unlike copy-only tools, we orchestrate 11 agents with approval-gated publishing and investor-grade ROI reporting.\n\nCan I send the deck and book a short live walkthrough?\n\nBest,\nContentOps AI`,
  shortPitch: `${lead.company} — live agent pipeline demo, not slide-only.`,
  personalizationReason: lead.matchReason,
  approved: i < 4,
}))

export const investorPitchCalendarPosts: CalendarPost[] = [
  { id: 'ical1', platform: 'linkedin', title: 'Marketing command center, not chatbot', time: '09:00', date: '2026-06-02', status: 'scheduled', campaign: 'ContentOps Seed Raise', owner: 'Content Agent' },
  { id: 'ical2', platform: 'linkedin', title: '5.25 hours saved week one', time: '09:00', date: '2026-06-04', status: 'scheduled', campaign: 'ContentOps Seed Raise', owner: 'Analytics Agent' },
  { id: 'ical3', platform: 'x', title: '$2M seed — agent army for marketing', time: '14:00', date: '2026-06-05', status: 'scheduled', campaign: 'ContentOps Seed Raise', owner: 'Content Agent' },
  { id: 'ical4', platform: 'linkedin', title: '11 agents carousel', time: '09:00', date: '2026-06-09', status: 'scheduled', campaign: 'ContentOps Seed Raise', owner: 'Strategy Agent' },
  { id: 'ical5', platform: 'email', title: 'Investor demo invite batch', time: '10:00', date: '2026-06-10', status: 'scheduled', campaign: 'ContentOps Seed Raise', owner: 'Outreach Agent' },
]

export const investorPitchPublishLogs: PublishLog[] = [
  { id: 'ipub1', title: 'We built a command center', platform: 'linkedin', status: 'success', time: '2026-05-28T09:00:00Z', url: 'https://linkedin.com/posts/mock/contentops-pitch' },
  { id: 'ipub2', title: 'Agent ROI thread', platform: 'x', status: 'success', time: '2026-05-27T14:00:00Z', url: 'https://x.com/mock/status/contentops-roi' },
  { id: 'ipub3', title: 'Approval board deep dive', platform: 'linkedin', status: 'scheduled', time: '2026-06-06T09:00:00Z' },
]

export const investorPitchAgents: AgentDefinition[] = demoAgents.map((a) => {
  const overrides: Partial<Record<string, Partial<AgentDefinition>>> = {
    research: { currentTask: 'Mapping AI marketing ops TAM', status: 'completed', progress: 100, lastOutput: '91 opportunity score, 4 competitor gaps' },
    strategy: { currentTask: 'Investor narrative pillars', status: 'completed', progress: 100, lastOutput: '5 high-intent fundraise topics' },
    content: { currentTask: 'LinkedIn fundraise carousel', status: 'running', progress: 78, lastOutput: '5 drafts — 2 approved for investor audience' },
    video: { currentTask: '60s product demo script', status: 'running', progress: 70, lastOutput: '2 video scripts ready for review' },
    safety: { currentTask: 'Fundraise claim review', status: 'waiting_for_approval', progress: 95, lastOutput: 'Flagged: round size — verify disclosure' },
    leadfinder: { currentTask: 'VC & angel signal scan', status: 'running', progress: 62, lastOutput: '6 qualified investor leads' },
    outreach: { currentTask: 'Personalized deck requests', status: 'running', progress: 45, lastOutput: '4 outreach drafts approved' },
    analytics: { currentTask: 'Investor metrics pack', status: 'completed', progress: 100, lastOutput: 'ROI report ready for data room' },
  }
  return { ...a, ...overrides[a.id] }
})

export const investorPitchTasks: AgentTask[] = demoAgentTasks.map((t, i) => ({
  ...t,
  name: [
    'AI marketing ops market scan',
    'Fundraise content pillars',
    'Investor LinkedIn batch',
    'Demo reel script pack',
    'Fundraise claim review',
    'June investor calendar',
    'VC signal scan',
    'Deck request outreach',
    'Investor ROI compile',
    'Scheduled publish batch',
  ][i] ?? t.name,
}))

export const investorPitchBrandProfile: BrandProfile = {
  brandName: INVESTOR_PITCH_COMPANY.name,
  brandDescription:
    'Multi-agent marketing operations platform — research, create, approve, publish, and convert leads with measurable ROI.',
  targetAudience: INVESTOR_PITCH_COMPANY.targetCustomers,
  tone: 'Confident, data-driven, founder-authentic',
  wordsToAvoid: ['guaranteed returns', 'revolutionary', 'unicorn', 'disrupt everything'],
  contentRules: ['Cite ROI from dashboard', 'Include approval-board mention', 'Offer live demo CTA', 'No forward-looking revenue claims without disclaimer'],
  productDescription: '11-agent marketing command center with model hub and integrations',
  mainOffer: 'Private data room + live 15-min pipeline demo',
  ctaStyle: 'Request deck & demo',
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
      visualStyle: 'Premium SaaS, holographic dashboard, investor-deck aesthetic',
      mood: 'Ambitious, trustworthy, category-defining',
      notes: 'Use pipeline progress and agent status chips in visuals.',
    },
  ],
  activeThemeId: 'theme-contentops-investor',
}

/** Ordered stops for investor walkthrough */
export const investorPitchTourSteps = [
  { step: 1, label: 'Overview', href: '/dashboard', blurb: 'KPIs, pipeline, and agent activity at a glance' },
  { step: 2, label: 'Campaign', href: '/dashboard/campaign-builder', blurb: 'Seed raise campaign goals and workflow' },
  { step: 3, label: 'Research', href: '/dashboard/research', blurb: 'TAM, trends, and competitor gaps' },
  { step: 4, label: 'Content', href: '/dashboard/content', blurb: 'Investor-facing posts and topics' },
  { step: 5, label: 'Video', href: '/dashboard/video', blurb: 'Product demo reels for data room' },
  { step: 6, label: 'Approval', href: '/dashboard/approval', blurb: 'Human-in-the-loop before publish' },
  { step: 7, label: 'Calendar', href: '/dashboard/calendar', blurb: 'Fundraise content schedule' },
  { step: 8, label: 'Publishing', href: '/dashboard/publishing', blurb: 'Multi-platform publish logs' },
  { step: 9, label: 'Leads', href: '/dashboard/leads', blurb: 'VC and angel prospects scored' },
  { step: 10, label: 'Outreach', href: '/dashboard/outreach', blurb: 'Personalized deck requests' },
  { step: 11, label: 'Analytics', href: '/dashboard/analytics', blurb: 'ROI proof for the room' },
  { step: 12, label: 'Impact', href: '/dashboard/impact-report', blurb: 'Before/after story for investors' },
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
    models: demoModels.map((m) => ({ ...m })),
    modelRouting: demoModelRouting.map((r) => ({ ...r })),
    lastWorkflow: {
      workflowId: 'wf-investor-pitch',
      live: false,
      completedAt: '2026-05-30T08:00:00Z',
      estimatedTimeSaved: '8.5 hrs',
    },
    customPromptDetails:
      'Investor pitch mode: emphasize multi-agent orchestration, approval-gated publishing, measurable ROI, and $2M seed use of funds. Tone: confident, data-backed. CTA: request deck + live demo.',
  }
}
