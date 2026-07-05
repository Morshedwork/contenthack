import type {
  AgentDefinition,
  AgentTask,
  AIModel,
  ModelRouting,
  Campaign,
  MarketResearch,
  ContentDraft,
  VideoScript,
  ApprovalItem,
  CalendarPost,
  Lead,
  OutreachMessage,
  PublishLog,
  PlatformIntegration,
  ROIReport,
  BrandProfile,
  SafetySettings,
} from '@/types'

export const DEMO_COMPANY = {
  name: 'Cognisor AI',
  industry: 'AI automation and AI software development',
  targetCustomers: 'startups, SMEs, founders, marketing teams, and business owners',
  region: 'Japan and global',
  goal: 'generate qualified leads for AI automation, website development, and AI agent services',
}

export const demoCampaign: Campaign = {
  id: 'camp-001',
  companyName: DEMO_COMPANY.name,
  industry: DEMO_COMPANY.industry,
  targetAudience: DEMO_COMPANY.targetCustomers,
  region: DEMO_COMPANY.region,
  productService: 'AI automation, website development, and AI agent services',
  campaignGoal: DEMO_COMPANY.goal,
  platforms: ['linkedin', 'instagram', 'facebook', 'x'],
  tone: 'Professional, innovative, approachable',
  contentFrequency: '5 posts per week',
  startDate: '2026-06-01',
  endDate: '2026-08-31',
  mainOffer: 'Free AI automation audit for qualifying businesses',
  ctaStyle: 'Book a discovery call',
  status: 'active',
}

export const demoAgents: AgentDefinition[] = [
  { id: 'research', name: 'Research Agent', role: 'Market & competitor analysis', assignedModel: 'GPT-4o', currentTask: 'Analyzing Japan SME automation trends', status: 'completed', progress: 100, confidence: 94, lastOutput: '12 trend insights, 8 competitor gaps identified' },
  { id: 'strategy', name: 'Strategy Agent', role: 'Topic & content strategy', assignedModel: 'GPT-4.1', currentTask: 'Building content pillar map', status: 'completed', progress: 100, confidence: 91, lastOutput: '12 high-intent topics generated' },
  { id: 'content', name: 'Content Agent', role: 'Social post generation', assignedModel: 'GPT-4o', currentTask: 'Generating LinkedIn carousel', status: 'running', progress: 72, confidence: 88, lastOutput: '8 posts drafted across 4 platforms' },
  { id: 'brandtheme', name: 'Brand Theme Agent', role: 'Extract colors & visual identity from URLs', assignedModel: 'GPT-4o', currentTask: 'Ready to scan company website', status: 'idle', progress: 0, confidence: 0, lastOutput: 'Extract brand palette from a company URL' },
  { id: 'video', name: 'Video Agent', role: 'Short-form video scripts', assignedModel: 'GPT-4.1 mini', currentTask: 'Scripting 60s explainer reel', status: 'running', progress: 65, confidence: 86, lastOutput: '5 video scripts with scene breakdowns' },
  { id: 'safety', name: 'Brand Safety Agent', role: 'Compliance & risk checks', assignedModel: 'o4-mini', currentTask: 'Reviewing claim language', status: 'waiting_for_approval', progress: 90, confidence: 97, lastOutput: '2 posts flagged for claim review' },
  { id: 'scheduler', name: 'Scheduler Agent', role: 'Calendar optimization', assignedModel: 'GPT-4o mini', currentTask: 'Optimizing post timing for JST', status: 'idle', progress: 0, confidence: 0, lastOutput: '12 posts scheduled for June' },
  { id: 'publisher', name: 'Publisher Agent', role: 'Multi-platform publishing', assignedModel: 'GPT-4o mini', currentTask: 'Publish queue ready', status: 'idle', progress: 0, confidence: 0, lastOutput: 'Connect platforms in Integrations to publish' },
  { id: 'leadfinder', name: 'Lead Finder Agent', role: 'Prospect discovery', assignedModel: 'GPT-4o', currentTask: 'Scanning LinkedIn engagement signals', status: 'running', progress: 58, confidence: 89, lastOutput: '15 qualified leads identified' },
  { id: 'outreach', name: 'Outreach Agent', role: 'Personalized messaging', assignedModel: 'GPT-4o', currentTask: 'Drafting connection requests', status: 'idle', progress: 0, confidence: 0, lastOutput: '10 outreach drafts pending approval' },
  { id: 'analytics', name: 'Analytics Agent', role: 'ROI & performance tracking', assignedModel: 'GPT-4o mini', currentTask: 'Compiling weekly impact report', status: 'completed', progress: 100, confidence: 93, lastOutput: 'ROI report: 5.25 hrs saved this week' },
]

export const demoAgentTasks: AgentTask[] = [
  { id: 't1', name: 'Japan SME market scan', assignedAgent: 'Research Agent', priority: 'high', status: 'completed', createdAt: '2026-05-28T09:00:00Z', estimatedTimeSaved: '2.5 hrs', outputPreview: 'Market growing 23% YoY in automation adoption...' },
  { id: 't2', name: 'Content pillar generation', assignedAgent: 'Strategy Agent', priority: 'high', status: 'completed', createdAt: '2026-05-28T10:30:00Z', estimatedTimeSaved: '1.8 hrs', outputPreview: 'Pillar 1: AI Agents for SMEs, Pillar 2: Web Dev...' },
  { id: 't3', name: 'LinkedIn post batch', assignedAgent: 'Content Agent', priority: 'medium', status: 'running', createdAt: '2026-05-28T11:00:00Z', estimatedTimeSaved: '3.2 hrs', outputPreview: 'Stop losing leads to manual workflows...' },
  { id: 't4', name: 'Reels script pack', assignedAgent: 'Video Agent', priority: 'medium', status: 'running', createdAt: '2026-05-28T11:30:00Z', estimatedTimeSaved: '2.0 hrs', outputPreview: 'Hook: Your team spends 20hrs/week on tasks AI can do...' },
  { id: 't5', name: 'Claim detection review', assignedAgent: 'Brand Safety Agent', priority: 'critical', status: 'waiting_for_approval', createdAt: '2026-05-28T12:00:00Z', estimatedTimeSaved: '0.5 hrs', outputPreview: 'Flagged: "guaranteed 10x ROI" — needs softening' },
  { id: 't6', name: 'June calendar build', assignedAgent: 'Scheduler Agent', priority: 'medium', status: 'idle', createdAt: '2026-05-28T13:00:00Z', estimatedTimeSaved: '1.5 hrs', outputPreview: '12 posts scheduled across 4 platforms' },
  { id: 't7', name: 'LinkedIn lead scan', assignedAgent: 'Lead Finder Agent', priority: 'high', status: 'running', createdAt: '2026-05-28T14:00:00Z', estimatedTimeSaved: '1.7 hrs', outputPreview: 'Found: Yuki Tanaka, CTO at TechFlow Tokyo...' },
  { id: 't8', name: 'Outreach personalization', assignedAgent: 'Outreach Agent', priority: 'low', status: 'idle', createdAt: '2026-05-28T15:00:00Z', estimatedTimeSaved: '2.3 hrs', outputPreview: 'Hi Yuki, noticed your post about manual ops...' },
  { id: 't9', name: 'Weekly ROI compile', assignedAgent: 'Analytics Agent', priority: 'medium', status: 'completed', createdAt: '2026-05-28T16:00:00Z', estimatedTimeSaved: '1.0 hrs', outputPreview: '5.25 hours saved, $420 cost reduction...' },
  { id: 't10', name: 'Publish batch', assignedAgent: 'Publisher Agent', priority: 'low', status: 'idle', createdAt: '2026-05-28T17:00:00Z', estimatedTimeSaved: '0.8 hrs', outputPreview: 'Awaiting connected platform publish' },
]

export const demoModels: AIModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', bestFor: 'Content generation, research', speed: 'medium', costLevel: 'medium', qualityScore: 92, contextSize: '128K', status: 'available', useCases: ['Market research', 'Content generation', 'Lead scoring'], isDefault: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'OpenAI', bestFor: 'Fast, low-cost bulk tasks', speed: 'fast', costLevel: 'low', qualityScore: 87, contextSize: '128K', status: 'available', useCases: ['Content generation', 'Scheduling', 'Bulk generation'] },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', bestFor: 'High-quality, long-context', speed: 'medium', costLevel: 'medium', qualityScore: 94, contextSize: '1M', status: 'available', useCases: ['Market research', 'Strategy', 'Outreach writing'] },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini', provider: 'OpenAI', bestFor: 'Balanced speed & quality', speed: 'fast', costLevel: 'low', qualityScore: 89, contextSize: '1M', status: 'available', useCases: ['Video scripts', 'Analytics summary'] },
  { id: 'o4-mini', name: 'o4-mini', provider: 'OpenAI', bestFor: 'Reasoning, safety & scoring', speed: 'medium', costLevel: 'medium', qualityScore: 91, contextSize: '200K', status: 'available', useCases: ['Brand safety', 'Lead scoring'] },
  { id: 'kimi-k2.5', name: 'Kimi K2.5', provider: 'Moonshot AI', bestFor: 'AI image prompt enhancement', speed: 'medium', costLevel: 'medium', qualityScore: 90, contextSize: '256K', status: 'available', useCases: ['Image prompts', 'Visual briefs', 'Social creatives'] },
  { id: 'gpt-image-1.5', name: 'GPT Image 1.5', provider: 'OpenAI', bestFor: 'Best OpenAI image generation via API', speed: 'medium', costLevel: 'medium', qualityScore: 96, contextSize: 'N/A', status: 'available', useCases: ['Image generation', 'Brand creatives', 'Marketing visuals'] },
  { id: 'gpt-image-2', name: 'GPT Image 2.0', provider: 'OpenAI', bestFor: 'Latest flagship — 2K/4K, reasoning mode', speed: 'medium', costLevel: 'high', qualityScore: 98, contextSize: 'N/A', status: 'available', useCases: ['Image generation', 'High-res assets', 'Product shots', 'Complex compositions'] },
  { id: 'gpt-image-1', name: 'GPT Image 1', provider: 'OpenAI', bestFor: 'Reliable OpenAI image generation', speed: 'medium', costLevel: 'medium', qualityScore: 93, contextSize: 'N/A', status: 'available', useCases: ['Image generation', 'Social creatives'] },
  { id: 'gpt-image-1-mini', name: 'GPT Image 1 Mini', provider: 'OpenAI', bestFor: 'Cost-efficient bulk image generation', speed: 'fast', costLevel: 'low', qualityScore: 88, contextSize: 'N/A', status: 'available', useCases: ['Image generation', 'Bulk creatives', 'Drafts'] },
  { id: 'pixverse-v4.5', name: 'PixVerse v4.5', provider: 'PixVerse', bestFor: 'Text-to-video generation', speed: 'slow', costLevel: 'medium', qualityScore: 88, contextSize: 'N/A', status: 'available', useCases: ['Text-to-video', 'Short-form reels', 'Marketing clips'] },
  { id: 'pixverse-v6', name: 'PixVerse v6', provider: 'PixVerse', bestFor: 'High-quality AI video', speed: 'slow', costLevel: 'high', qualityScore: 93, contextSize: 'N/A', status: 'available', useCases: ['Text-to-video', '1080p video', 'Cinematic clips'] },
]

export const demoModelRouting: ModelRouting[] = [
  { taskType: 'Market research', assignedModel: 'GPT-4o', fallbackModel: 'GPT-4.1', temperature: 0.3, maxTokens: 4096, costEstimate: '$0.08/task', qualityPriority: 'quality' },
  { taskType: 'Content generation', assignedModel: 'GPT-4o', fallbackModel: 'GPT-4o mini', temperature: 0.7, maxTokens: 2048, costEstimate: '$0.05/post', qualityPriority: 'balanced' },
  { taskType: 'Video scripts', assignedModel: 'GPT-4.1 mini', fallbackModel: 'GPT-4o', temperature: 0.8, maxTokens: 3072, costEstimate: '$0.04/script', qualityPriority: 'balanced' },
  { taskType: 'Brand safety', assignedModel: 'o4-mini', fallbackModel: 'GPT-4o', temperature: 0.1, maxTokens: 1024, costEstimate: '$0.03/check', qualityPriority: 'quality' },
  { taskType: 'Lead scoring', assignedModel: 'o4-mini', fallbackModel: 'GPT-4o mini', temperature: 0.2, maxTokens: 4096, costEstimate: '$0.02/lead', qualityPriority: 'speed' },
  { taskType: 'Outreach writing', assignedModel: 'GPT-4o', fallbackModel: 'GPT-4.1', temperature: 0.6, maxTokens: 1536, costEstimate: '$0.04/message', qualityPriority: 'quality' },
  { taskType: 'Analytics summary', assignedModel: 'GPT-4o mini', fallbackModel: 'GPT-4.1 mini', temperature: 0.3, maxTokens: 2048, costEstimate: '$0.02/report', qualityPriority: 'speed' },
  { taskType: 'Image generation', assignedModel: 'GPT Image 1.5', fallbackModel: 'GPT Image 1', temperature: 0.7, maxTokens: 1024, costEstimate: '$0.04/image', qualityPriority: 'quality' },
  { taskType: 'Video generation', assignedModel: 'Sora 2 Pro', fallbackModel: 'Veo 3.1', temperature: 0.8, maxTokens: 512, costEstimate: '$0.25/video', qualityPriority: 'quality' },
]

export const demoMarketResearch: MarketResearch = {
  id: 'mr-001',
  industry: DEMO_COMPANY.industry,
  targetCustomer: DEMO_COMPANY.targetCustomers,
  region: DEMO_COMPANY.region,
  competitors: ['UiPath', 'Automation Anywhere', 'Local JP dev agencies', 'Freelance AI consultants'],
  offer: 'Free AI automation audit',
  marketSummary: 'Japan\'s SME sector is rapidly adopting AI automation, with 34% of businesses planning AI investments in 2026. Global demand for AI agents and custom web development continues to surge, especially among founders seeking operational efficiency.',
  painPoints: [
    'Manual workflows consuming 15-20 hours per week',
    'Disconnected tools causing data silos',
    'High cost of traditional agency retainers',
    'Difficulty finding trusted AI implementation partners',
    'Language barriers in global AI tool adoption',
    'Lack of ROI visibility from marketing spend',
  ],
  trends: [
    { title: 'AI Agent Adoption', description: 'Multi-agent systems replacing single-task automation', score: 94 },
    { title: 'No-Code + AI Hybrid', description: 'SMEs prefer visual builders with AI backends', score: 87 },
    { title: 'Japan Digital Transformation', description: 'Government incentives driving SME tech adoption', score: 91 },
    { title: 'Content-Led Lead Gen', description: 'B2B buyers research via social before contacting', score: 85 },
  ],
  competitorGaps: [
    { competitor: 'UiPath', gap: 'Too enterprise-focused for SMEs', opportunity: 'Affordable starter packages' },
    { competitor: 'Local JP agencies', gap: 'Limited AI agent expertise', opportunity: 'Position as AI-native partner' },
    { competitor: 'Freelance consultants', gap: 'Inconsistent delivery & support', opportunity: 'End-to-end managed service' },
  ],
  keywords: [
    { keyword: 'AI automation for SMEs', volume: 2400, intent: 'high' },
    { keyword: 'custom AI agents', volume: 1800, intent: 'high' },
    { keyword: 'website development Japan', volume: 3200, intent: 'medium' },
    { keyword: 'business process automation', volume: 4100, intent: 'medium' },
    { keyword: 'AI lead generation', volume: 1600, intent: 'high' },
  ],
  highIntentTopics: [
    'How AI agents replace 5 manual workflows',
    'ROI calculator: automation vs hiring',
    'Case study: Tokyo startup saved 30hrs/week',
    'AI website vs traditional development',
    'Getting started with AI automation (JP market)',
  ],
  opportunityScore: 87,
}

export const demoContentTopics = [
  'AI agents for SME workflow automation',
  '5 signs your business needs AI automation',
  'Tokyo startup case study: 30hrs saved weekly',
  'AI website development vs traditional agencies',
  'Free automation audit: what to expect',
  'Multi-agent systems explained simply',
  'Japan SME digital transformation guide',
  'Content-led lead generation with AI',
  'Building custom AI tools without coding',
  'ROI of AI automation in 2026',
  'How founders scale ops with AI agents',
  'LinkedIn outreach automation best practices',
]

export const demoContentDrafts: ContentDraft[] = [
  { id: 'c1', platform: 'linkedin', hook: 'Your team spends 20 hours/week on tasks AI can handle in minutes.', mainCopy: 'Most SMEs lose 20+ hours weekly to manual data entry, email follow-ups, and report generation. Cognisor AI builds custom automation that pays for itself in the first month. We recently helped a Tokyo startup reclaim 30 hours per week — what could your team do with that time?', cta: 'Book your free AI automation audit →', hashtags: ['#AIAutomation', '#SME', '#Productivity'], audienceFitScore: 94, brandSafetyScore: 97, leadPotentialScore: 91, status: 'approved', campaignId: 'camp-001' },
  { id: 'c2', platform: 'linkedin', hook: 'Stop hiring for tasks AI agents can do better.', mainCopy: 'Before you post another job listing for "operations coordinator," ask: can an AI agent handle 80% of this role? Multi-agent systems now manage lead scoring, content scheduling, and customer follow-ups — simultaneously.', cta: 'See how Cognisor AI builds your agent team', hashtags: ['#AIAgents', '#FutureOfWork'], audienceFitScore: 89, brandSafetyScore: 95, leadPotentialScore: 88, status: 'scheduled', campaignId: 'camp-001' },
  { id: 'c3', platform: 'instagram', hook: 'POV: You just automated your entire lead follow-up 🚀', mainCopy: 'From manual spreadsheets to AI-powered pipelines in 2 weeks. Swipe to see the before & after workflow transformation.', cta: 'Link in bio for free audit', hashtags: ['#AI', '#Automation', '#StartupLife'], audienceFitScore: 86, brandSafetyScore: 96, leadPotentialScore: 82, status: 'needs_review', campaignId: 'camp-001' },
  { id: 'c4', platform: 'facebook', hook: 'Is your business still running on manual processes?', mainCopy: 'Japanese SMEs are leading the AI adoption wave. Cognisor AI helps businesses automate workflows, build custom websites, and deploy AI agents — without enterprise budgets.', cta: 'Get your free automation assessment', hashtags: ['#DigitalTransformation', '#JapanBusiness'], audienceFitScore: 88, brandSafetyScore: 98, leadPotentialScore: 85, status: 'draft', campaignId: 'camp-001' },
  { id: 'c5', platform: 'x', hook: 'Hot take: Every SME will have an AI agent team by 2027.', mainCopy: 'The question isn\'t IF — it\'s WHO builds it. Cognisor AI: custom agents, web dev, and automation for founders who move fast.', cta: 'DM for free audit', hashtags: ['#AI', '#SME', '#BuildInPublic'], audienceFitScore: 82, brandSafetyScore: 93, leadPotentialScore: 79, status: 'draft', campaignId: 'camp-001' },
  { id: 'c6', platform: 'carousel', hook: '5 workflows you should automate TODAY', mainCopy: 'Slide 1: Lead follow-up\nSlide 2: Report generation\nSlide 3: Content scheduling\nSlide 4: Customer onboarding\nSlide 5: Invoice processing', cta: 'Save this & book your audit', hashtags: ['#AutomationTips', '#SME'], audienceFitScore: 91, brandSafetyScore: 99, leadPotentialScore: 87, status: 'approved', campaignId: 'camp-001' },
  { id: 'c7', platform: 'email', hook: 'Subject: Your competitors are automating — are you?', mainCopy: 'Hi {{first_name}},\n\nI noticed {{company}} is growing fast — congrats! Many founders at your stage spend 15-20 hours weekly on ops tasks that AI agents handle effortlessly.\n\nWe\'d love to offer a free 30-min automation audit. No pitch, just actionable insights.', cta: 'Reply YES to schedule', hashtags: [], audienceFitScore: 93, brandSafetyScore: 96, leadPotentialScore: 92, status: 'approved', campaignId: 'camp-001' },
  { id: 'c8', platform: 'linkedin', hook: 'Case study: How a Tokyo fintech saved ¥2M/year with AI agents', mainCopy: 'TechFlow Tokyo was drowning in manual KYC checks and customer onboarding. We deployed 3 AI agents that now handle 85% of their workflow. Result: ¥2M annual savings, 30hrs/week reclaimed, 40% faster onboarding.', cta: 'Read the full case study →', hashtags: ['#CaseStudy', '#FinTech', '#AI'], audienceFitScore: 96, brandSafetyScore: 94, leadPotentialScore: 95, status: 'published', campaignId: 'camp-001' },
]

export const demoVideoScripts: VideoScript[] = [
  { id: 'v1', title: 'AI Agents Explained in 60 Seconds', hook: 'Your team spends 20 hours a week on tasks AI can do in minutes.', scenes: [{ title: 'Problem', voiceover: 'Every SME has repetitive tasks eating their time.', onScreenText: '20 hrs/week wasted', visuals: 'Frustrated founder at desk' }, { title: 'Solution', voiceover: 'AI agents handle lead follow-up, reports, and scheduling.', onScreenText: 'AI Agent Team', visuals: 'Dashboard with agent cards' }, { title: 'Result', voiceover: 'Clients save 30+ hours weekly.', onScreenText: '30hrs saved ✓', visuals: 'Happy team celebrating' }], voiceover: 'Full 60s script...', bRoll: ['Office B-roll', 'Dashboard screen recording', 'Team collaboration'], aiVideoPrompt: 'Create a 60-second professional explainer video showing SME workflow automation with AI agents, modern office setting, blue/purple gradient theme', cta: 'Book free audit at cognisor.ai', duration: '0:60', status: 'approved' },
  { id: 'v2', title: 'Before & After: Manual vs Automated', hook: 'This spreadsheet was costing them ¥500K/month.', scenes: [{ title: 'Before', voiceover: 'Manual processes, errors, delays.', onScreenText: 'BEFORE: Chaos', visuals: 'Messy spreadsheet' }, { title: 'After', voiceover: 'Clean automated pipeline.', onScreenText: 'AFTER: Automated', visuals: 'Clean dashboard' }], voiceover: 'Full script...', bRoll: ['Spreadsheet close-up', 'Automation flow diagram'], aiVideoPrompt: 'Split-screen before/after automation transformation, corporate style', cta: 'Get your free audit', duration: '0:45', status: 'needs_review' },
  { id: 'v3', title: '5 Workflows to Automate Today', hook: 'If you do any of these manually, watch this.', scenes: [{ title: 'Intro', voiceover: 'Five workflows killing your productivity.', onScreenText: '5 Workflows', visuals: 'Countdown animation' }], voiceover: 'Full script...', bRoll: ['List animation'], aiVideoPrompt: 'Fast-paced listicle video with bold text overlays', cta: 'Save & follow for more', duration: '0:30', status: 'draft' },
  { id: 'v4', title: 'Japan SME AI Adoption Trends', hook: '34% of Japanese SMEs plan AI investments in 2026.', scenes: [{ title: 'Stat', voiceover: 'The market is moving fast.', onScreenText: '34% adopting AI', visuals: 'Japan map with data points' }], voiceover: 'Full script...', bRoll: ['Tokyo skyline', 'Office tech'], aiVideoPrompt: 'Data-driven market trend video with Japan focus', cta: 'Learn more at cognisor.ai', duration: '0:55', status: 'draft' },
  { id: 'v5', title: 'Client Testimonial: TechFlow Tokyo', hook: 'We saved ¥2M and 30 hours a week.', scenes: [{ title: 'Testimonial', voiceover: 'TechFlow CTO shares their transformation.', onScreenText: '¥2M saved', visuals: 'Interview setup' }], voiceover: 'Full script...', bRoll: ['Office tour', 'Team at work'], aiVideoPrompt: 'Professional testimonial video, interview style', cta: 'Book your audit', duration: '1:20', status: 'scheduled' },
]

export const demoApprovalItems: ApprovalItem[] = demoContentDrafts.map((c, i) => ({
  id: c.id,
  title: c.hook.slice(0, 50),
  platform: c.platform,
  preview: c.mainCopy.slice(0, 120) + '...',
  riskLevel: c.brandSafetyScore < 95 ? 'medium' as const : 'low' as const,
  brandSafetyScore: c.brandSafetyScore,
  leadPotentialScore: c.leadPotentialScore,
  status: c.status,
}))

export const demoCalendarPosts: CalendarPost[] = [
  { id: 'cal1', platform: 'linkedin', title: 'AI Agents for SME workflow automation', time: '09:00', date: '2026-06-02', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
  { id: 'cal2', platform: 'instagram', title: 'POV: Automated lead follow-up', time: '12:00', date: '2026-06-02', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
  { id: 'cal3', platform: 'linkedin', title: 'Case study: TechFlow Tokyo', time: '09:00', date: '2026-06-03', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
  { id: 'cal4', platform: 'x', title: 'Hot take: AI agent teams by 2027', time: '15:00', date: '2026-06-04', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
  { id: 'cal5', platform: 'facebook', title: 'Manual processes holding you back?', time: '10:00', date: '2026-06-05', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
  { id: 'cal6', platform: 'linkedin', title: '5 workflows to automate today', time: '09:00', date: '2026-06-06', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
  { id: 'cal7', platform: 'instagram', title: 'Before & after automation', time: '18:00', date: '2026-06-09', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Video Agent' },
  { id: 'cal8', platform: 'linkedin', title: 'Japan SME AI adoption trends', time: '09:00', date: '2026-06-10', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
  { id: 'cal9', platform: 'linkedin', title: 'ROI calculator: automation vs hiring', time: '09:00', date: '2026-06-12', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Strategy Agent' },
  { id: 'cal10', platform: 'x', title: 'Building custom AI tools without coding', time: '14:00', date: '2026-06-13', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
  { id: 'cal11', platform: 'linkedin', title: 'Free automation audit guide', time: '09:00', date: '2026-06-16', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
  { id: 'cal12', platform: 'facebook', title: 'Digital transformation for SMEs', time: '11:00', date: '2026-06-18', status: 'scheduled', campaign: 'Cognisor Q2 Lead Gen', owner: 'Content Agent' },
]

export const demoLeads: Lead[] = [
  { id: 'l1', name: 'Yuki Tanaka', company: 'TechFlow Tokyo', role: 'CTO', profileUrl: 'https://www.linkedin.com/in/yuki-tanaka-demo', platform: 'linkedin', matchReason: 'Posted about manual ops bottlenecks', painPoint: 'Spending 25hrs/week on manual workflows', suggestedOffer: 'Free AI automation audit', score: 94, status: 'qualified', suggestedAction: 'Send personalized LinkedIn connection' },
  { id: 'l2', name: 'Sarah Chen', company: 'GrowthLab SG', role: 'Founder', profileUrl: 'https://www.linkedin.com/in/sarah-chen-demo', platform: 'linkedin', matchReason: 'Engaged with AI automation content', painPoint: 'Scaling ops without hiring', suggestedOffer: 'AI agent starter package', score: 89, status: 'reviewed', suggestedAction: 'Send case study email' },
  { id: 'l3', name: 'Marcus Weber', company: 'DataPulse GmbH', role: 'Head of Ops', profileUrl: 'https://www.linkedin.com/in/marcus-weber-demo', platform: 'linkedin', matchReason: 'Commented on automation ROI post', painPoint: 'Disconnected marketing tools', suggestedOffer: 'Integration assessment', score: 87, status: 'contacted', suggestedAction: 'Follow up on connection request' },
  { id: 'l4', name: 'Aiko Yamamoto', company: 'Sakura Ventures', role: 'Marketing Director', platform: 'instagram', matchReason: 'Follows AI business accounts', painPoint: 'Content creation bottleneck', suggestedOffer: 'ContentOps demo', score: 82, status: 'new', suggestedAction: 'Draft outreach message' },
  { id: 'l5', name: 'James Okonkwo', company: 'AfriTech Solutions', role: 'CEO', platform: 'linkedin', matchReason: 'Searching for web dev + AI partners', painPoint: 'Need modern website with AI features', suggestedOffer: 'Web + AI bundle', score: 91, status: 'qualified', suggestedAction: 'Schedule discovery call' },
  { id: 'l6', name: 'Emily Rodriguez', company: 'ScaleUp MX', role: 'COO', platform: 'linkedin', matchReason: 'Shared post about hiring challenges', painPoint: 'Can\'t afford full ops team', suggestedOffer: 'AI agent team proposal', score: 86, status: 'replied', suggestedAction: 'Send proposal document' },
  { id: 'l7', name: 'Hiroshi Nakamura', company: 'Nexus JP', role: 'Founder', platform: 'x', matchReason: 'Tweeted about AI adoption in Japan', painPoint: 'Language barrier with global AI tools', suggestedOffer: 'Localized AI solution', score: 88, status: 'reviewed', suggestedAction: 'Send JP-language outreach' },
  { id: 'l8', name: 'Lisa Park', company: 'Innovate Korea', role: 'VP Marketing', platform: 'linkedin', matchReason: 'Liked 3 automation posts', painPoint: 'Lead gen disconnected from content', suggestedOffer: 'ContentOps AI trial', score: 85, status: 'new', suggestedAction: 'Personalized connection request' },
  { id: 'l9', name: 'David Kim', company: 'StartupBridge', role: 'Founder', platform: 'linkedin', matchReason: 'Posted job for automation specialist', painPoint: 'Hiring vs automating decision', suggestedOffer: 'ROI comparison report', score: 92, status: 'contacted', suggestedAction: 'Share ROI calculator' },
  { id: 'l10', name: 'Rina Sato', company: 'EcoTech Osaka', role: 'Director', platform: 'facebook', matchReason: 'Commented on SME automation article', painPoint: 'Legacy systems blocking growth', suggestedOffer: 'Legacy modernization audit', score: 79, status: 'new', suggestedAction: 'Draft email outreach' },
  { id: 'l11', name: 'Tom Bradley', company: 'CloudFirst UK', role: 'CTO', platform: 'linkedin', matchReason: 'Attended AI automation webinar', painPoint: 'Need multi-agent architecture', suggestedOffer: 'Architecture consultation', score: 90, status: 'qualified', suggestedAction: 'Book technical call' },
  { id: 'l12', name: 'Nina Patel', company: 'BrightPath India', role: 'Marketing Lead', platform: 'instagram', matchReason: 'Engaged with carousel content', painPoint: 'Manual social media management', suggestedOffer: 'ContentOps trial', score: 78, status: 'not_relevant', suggestedAction: 'Archive — low budget signal' },
  { id: 'l13', name: 'Kenji Watanabe', company: 'RoboWorks JP', role: 'CEO', platform: 'linkedin', matchReason: 'Competitor follower — ripe for switch', painPoint: 'Current vendor too expensive', suggestedOffer: 'Migration + cost comparison', score: 93, status: 'reviewed', suggestedAction: 'Competitive displacement pitch' },
  { id: 'l14', name: 'Anna Kowalski', company: 'Digital EU', role: 'Founder', platform: 'linkedin', matchReason: 'Shared Cognisor competitor content', painPoint: 'Need end-to-end AI partner', suggestedOffer: 'Full-stack AI partnership', score: 87, status: 'new', suggestedAction: 'Research company further' },
  { id: 'l15', name: 'Raj Sharma', company: 'TechNova IN', role: 'Head of Growth', platform: 'x', matchReason: 'Active in #AIAutomation hashtag', painPoint: 'Content not converting to leads', suggestedOffer: 'Content-to-lead pipeline audit', score: 84, status: 'contacted', suggestedAction: 'Follow up with metrics' },
]

export const demoOutreachMessages: OutreachMessage[] = demoLeads.slice(0, 10).map((lead, i) => ({
  id: `o${i + 1}`,
  leadId: lead.id,
  leadName: lead.name,
  linkedinConnection: `Hi ${lead.name.split(' ')[0]}, I noticed your work at ${lead.company} — especially around ${lead.painPoint.toLowerCase().slice(0, 40)}. We help companies like yours automate these workflows with AI agents. Would love to connect!`,
  linkedinFollowUp: `Thanks for connecting, ${lead.name.split(' ')[0]}! I put together a quick overview of how companies in ${lead.company}'s space are saving 20+ hours/week with AI automation. Happy to share if useful — no pitch attached.`,
  emailSubject: `Quick idea for ${lead.company}'s workflow automation`,
  emailBody: `Hi ${lead.name.split(' ')[0]},\n\nI came across ${lead.company} and noticed you're dealing with ${lead.painPoint.toLowerCase()}.\n\nWe've helped similar companies automate 80% of these workflows using AI agents. I'd love to offer a free 30-minute audit — no strings attached.\n\nBest,\nCognisor AI Team`,
  shortPitch: `${lead.company} could save 20+ hrs/week with AI agents for ${lead.painPoint.toLowerCase().slice(0, 30)}.`,
  personalizationReason: lead.matchReason,
  approved: i < 3,
}))

export const demoPublishLogs: PublishLog[] = [
  { id: 'p1', title: 'Case study: TechFlow Tokyo', platform: 'linkedin', status: 'success', time: '2026-05-28T09:00:00Z', url: 'https://linkedin.com/posts/mock/cognisor-case-study' },
  { id: 'p2', title: 'AI Agents for SMEs', platform: 'linkedin', status: 'success', time: '2026-05-27T09:00:00Z', url: 'https://linkedin.com/posts/mock/cognisor-ai-agents' },
  { id: 'p3', title: 'Automation tips carousel', platform: 'instagram', status: 'success', time: '2026-05-26T12:00:00Z', url: 'https://instagram.com/p/mock-automation-tips' },
  { id: 'p4', title: 'Hot take: AI agent teams', platform: 'x', status: 'failed', time: '2026-05-25T15:00:00Z', error: 'Rate limit exceeded — retry scheduled' },
  { id: 'p5', title: 'Japan SME digital transformation', platform: 'facebook', status: 'scheduled', time: '2026-06-05T10:00:00Z' },
  { id: 'p6', title: '5 workflows to automate', platform: 'linkedin', status: 'pending', time: '2026-06-06T09:00:00Z' },
]

export const demoIntegrations: PlatformIntegration[] = [
  { id: 'linkedin', name: 'LinkedIn', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['w_member_social', 'r_liteprofile'] },
  { id: 'instagram', name: 'Instagram', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['instagram_content_publish'] },
  { id: 'facebook', name: 'Facebook', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['pages_manage_posts'] },
  { id: 'x', name: 'X (Twitter)', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['tweet.read', 'tweet.write'] },
  { id: 'tiktok', name: 'TikTok', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['video.publish'] },
  { id: 'youtube', name: 'YouTube Shorts', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['youtube.upload'] },
  { id: 'google_drive', name: 'Google Drive', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['drive.file'] },
  { id: 'notion', name: 'Notion', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['read_content'] },
  { id: 'hubspot', name: 'HubSpot', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['crm.objects.contacts'] },
  { id: 'slack', name: 'Slack', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['chat:write'] },
  { id: 'google_calendar', name: 'Google Calendar', connected: false, mockMode: false, scheduledCount: 0, failedCount: 0, apiStatus: 'healthy', scopes: ['calendar.events'] },
]

export const demoROI: ROIReport = {
  weeklyHoursSaved: 5.25,
  monthlyCostSaved: 1680,
  manualTasksReduced: 80,
  contentOutputIncrease: 340,
  leadResearchImprovement: 78,
  campaignSpeedImprovement: 70,
  beforeAfter: [
    { task: 'Research & content planning', before: '6 hrs/week', after: '45 min/week' },
    { task: 'Lead research', before: '2 hrs/week', after: '25 min/week' },
    { task: 'Manual posting', before: '3 hrs/week', after: '36 min/week' },
    { task: 'Outreach drafting', before: '2.5 hrs/week', after: '30 min/week' },
    { task: 'Analytics reporting', before: '1.5 hrs/week', after: '15 min/week' },
  ],
  postsGenerated: [
    { week: 'W1', count: 6 }, { week: 'W2', count: 8 }, { week: 'W3', count: 12 }, { week: 'W4', count: 10 },
  ],
  leadScores: [
    { week: 'W1', avgScore: 72 }, { week: 'W2', avgScore: 78 }, { week: 'W3', avgScore: 85 }, { week: 'W4', avgScore: 88 },
  ],
  agentProductivity: demoAgents.map(a => ({ agent: a.name.replace(' Agent', ''), tasks: Math.floor(Math.random() * 50) + 10 })),
  platformPerformance: [
    { platform: 'LinkedIn', engagement: 4.2 }, { platform: 'Instagram', engagement: 3.1 }, { platform: 'Facebook', engagement: 2.4 }, { platform: 'X', engagement: 1.8 },
  ],
}

export const demoBrandProfile: BrandProfile = {
  brandName: DEMO_COMPANY.name,
  brandDescription: 'AI-native software company specializing in automation, custom AI agents, and modern web development for SMEs globally.',
  targetAudience: DEMO_COMPANY.targetCustomers,
  tone: 'Professional, innovative, approachable',
  wordsToAvoid: ['guaranteed ROI', 'revolutionary', 'disrupt', 'cheap'],
  contentRules: ['Always cite data sources', 'Include CTA in every post', 'Avoid competitor bashing', 'Use inclusive language'],
  productDescription: 'Custom AI automation, multi-agent systems, and modern website development',
  mainOffer: 'Free AI automation audit for qualifying businesses',
  ctaStyle: 'Book a discovery call',
  themeCollection: [
    {
      id: 'theme-demo-cognisor',
      sourceUrl: 'https://cognisor.ai',
      companyName: DEMO_COMPANY.name,
      extractedAt: '2026-05-28T10:00:00Z',
      colors: [
        { role: 'primary', hex: '#6366f1', label: 'Indigo' },
        { role: 'secondary', hex: '#8b5cf6', label: 'Violet' },
        { role: 'accent', hex: '#22d3ee', label: 'Cyan accent' },
        { role: 'background', hex: '#0f172a', label: 'Slate dark' },
        { role: 'text', hex: '#f8fafc', label: 'Light text' },
      ],
      typography: 'Geist / Inter sans-serif, tight tracking on headings',
      visualStyle: 'Modern SaaS, dark UI with violet gradients',
      mood: 'Innovative, trustworthy, tech-forward',
      notes: 'Use subtle glow effects and holographic dashboard motifs.',
    },
  ],
  activeThemeId: 'theme-demo-cognisor',
}

export const demoSafetySettings: SafetySettings = {
  requireApprovalBeforePosting: true,
  enableBrandSafetyCheck: true,
  enableClaimDetection: true,
  enableSpamRiskDetection: true,
  enableOutreachApproval: true,
}

export const overviewKPIs = [
  { label: 'Active Campaigns', value: '1', change: 'Cognisor Q2 Lead Gen' },
  { label: 'AI Tasks Completed', value: '47', change: '+12 this week' },
  { label: 'Posts Generated', value: '8', change: '4 platforms' },
  { label: 'Videos Scripted', value: '5', change: '2 pending review' },
  { label: 'Posts Scheduled', value: '12', change: 'Next: Jun 2' },
  { label: 'Posts Published', value: '3', change: 'Mock mode' },
  { label: 'Leads Found', value: '15', change: '5 qualified' },
  { label: 'Outreach Drafts', value: '10', change: '3 approved' },
  { label: 'Hours Saved', value: '5.25', change: 'This week' },
  { label: 'Est. Cost Saved', value: '$420', change: 'This week' },
]

export const workflowSteps = [
  'Campaign Goal', 'Market Research', 'Topic Strategy', 'Content Studio', 'Video Studio',
  'Approve & Publish', 'Calendar', 'Lead Finder', 'Outreach', 'ROI Analytics',
]
