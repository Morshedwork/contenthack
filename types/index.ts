export type AgentStatus = 'idle' | 'running' | 'waiting_for_approval' | 'completed' | 'failed'
export type Platform = 'linkedin' | 'instagram' | 'facebook' | 'x' | 'tiktok' | 'youtube' | 'email' | 'carousel'
export type ContentStatus = 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published'
export type LeadStatus = 'new' | 'reviewed' | 'contacted' | 'replied' | 'qualified' | 'not_relevant'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface AgentDefinition {
  id: string
  name: string
  role: string
  assignedModel: string
  currentTask: string
  status: AgentStatus
  progress: number
  confidence: number
  lastOutput: string
}

export interface AgentTask {
  id: string
  name: string
  assignedAgent: string
  priority: TaskPriority
  status: AgentStatus
  createdAt: string
  estimatedTimeSaved: string
  outputPreview: string
}

export interface AIModel {
  id: string
  name: string
  provider: string
  bestFor: string
  speed: 'fast' | 'medium' | 'slow'
  costLevel: 'low' | 'medium' | 'high'
  qualityScore: number
  contextSize: string
  status: 'available' | 'limited' | 'offline'
  useCases: string[]
  isDefault?: boolean
}

export interface ModelRouting {
  taskType: string
  assignedModel: string
  fallbackModel: string
  temperature: number
  maxTokens: number
  costEstimate: string
  qualityPriority: 'speed' | 'balanced' | 'quality'
}

export interface Campaign {
  id: string
  companyName: string
  industry: string
  targetAudience: string
  region: string
  productService: string
  campaignGoal: string
  platforms: Platform[]
  tone: string
  contentFrequency: string
  startDate: string
  endDate: string
  mainOffer: string
  ctaStyle: string
  status: 'active' | 'draft' | 'completed'
}

export interface MarketResearch {
  id: string
  industry: string
  targetCustomer: string
  region: string
  competitors: string[]
  offer: string
  marketSummary: string
  painPoints: string[]
  trends: { title: string; description: string; score: number }[]
  competitorGaps: { competitor: string; gap: string; opportunity: string }[]
  keywords: { keyword: string; volume: number; intent: string }[]
  highIntentTopics: string[]
  opportunityScore: number
}

export interface ContentDraft {
  id: string
  platform: Platform
  hook: string
  mainCopy: string
  cta: string
  hashtags: string[]
  audienceFitScore: number
  brandSafetyScore: number
  leadPotentialScore: number
  status: ContentStatus
  campaignId: string
}

export type VideoFormat = 'reel' | 'shorts' | 'tiktok' | 'story'

export type VideoPromotionType =
  | 'product_launch'
  | 'sale'
  | 'testimonial'
  | 'brand_awareness'
  | 'event'
  | 'tutorial'
  | 'ugc'
  | 'lead_gen'
  | 'announcement'

export interface VideoScript {
  id: string
  title: string
  hook: string
  scenes: { title: string; voiceover: string; onScreenText: string; visuals: string }[]
  voiceover: string
  bRoll: string[]
  aiVideoPrompt: string
  cta: string
  duration: string
  status: ContentStatus
  format?: VideoFormat
  promotionType?: VideoPromotionType
  sourceContentId?: string
  sourcePlatform?: Platform
  generatedVideo?: GeneratedVideo
}

export interface GeneratedImage {
  id: string
  prompt: string
  enhancedPrompt: string
  style: string
  aspectRatio: string
  imageUrl: string
  model: string
  provider: string
  status: 'generating' | 'completed' | 'failed'
  createdAt: string
}

export interface GeneratedVideo {
  id: string
  prompt: string
  videoUrl?: string
  videoId?: number
  model: string
  provider: string
  duration: number
  aspectRatio: string
  status: 'generating' | 'processing' | 'completed' | 'failed'
  createdAt: string
}

export type LibraryContentType = 'post' | 'image' | 'video' | 'script' | 'topic'

export interface LibraryItem {
  id: string
  type: LibraryContentType
  title: string
  preview: string
  createdAt: string
  model?: string
  provider?: string
  platform?: Platform
  status?: string
  thumbnailUrl?: string
  mediaUrl?: string
  meta?: string
  href?: string
}

export interface ApprovalItem {
  id: string
  title: string
  platform: Platform
  preview: string
  riskLevel: 'low' | 'medium' | 'high'
  brandSafetyScore: number
  leadPotentialScore: number
  status: ContentStatus
}

export interface CalendarPost {
  id: string
  platform: Platform
  title: string
  time: string
  date: string
  status: ContentStatus
  campaign: string
  owner: string
}

export interface Lead {
  id: string
  name: string
  company: string
  role: string
  /** Public profile URL (e.g. LinkedIn) from Bright Data lead discovery */
  profileUrl?: string
  platform: Platform
  matchReason: string
  painPoint: string
  suggestedOffer: string
  score: number
  status: LeadStatus
  suggestedAction: string
}

export interface OutreachMessage {
  id: string
  leadId: string
  leadName: string
  linkedinConnection: string
  linkedinFollowUp: string
  emailSubject: string
  emailBody: string
  shortPitch: string
  personalizationReason: string
  approved: boolean
}

export interface PublishLog {
  id: string
  title: string
  platform: Platform
  status: 'success' | 'failed' | 'pending' | 'scheduled'
  time: string
  url?: string
  error?: string
}

export interface PlatformIntegration {
  id: Platform | 'google_drive' | 'notion' | 'hubspot' | 'slack' | 'google_calendar'
  name: string
  connected: boolean
  mockMode: boolean
  lastPublished?: string
  scheduledCount: number
  failedCount: number
  apiStatus: 'healthy' | 'degraded' | 'offline'
  scopes?: string[]
}

export interface ROIReport {
  weeklyHoursSaved: number
  monthlyCostSaved: number
  manualTasksReduced: number
  contentOutputIncrease: number
  leadResearchImprovement: number
  campaignSpeedImprovement: number
  beforeAfter: { task: string; before: string; after: string }[]
  postsGenerated: { week: string; count: number }[]
  leadScores: { week: string; avgScore: number }[]
  agentProductivity: { agent: string; tasks: number }[]
  platformPerformance: { platform: string; engagement: number }[]
}

export type BrandThemeColorRole = 'primary' | 'secondary' | 'accent' | 'background' | 'text' | 'neutral'

export interface BrandThemeColor {
  role: BrandThemeColorRole
  hex: string
  label?: string
}

export interface ExtractedBrandTheme {
  id: string
  sourceUrl: string
  companyName: string
  extractedAt: string
  colors: BrandThemeColor[]
  typography: string
  visualStyle: string
  mood: string
  logoUrl?: string
  notes?: string
}

export interface BrandProfile {
  brandName: string
  brandDescription: string
  targetAudience: string
  tone: string
  wordsToAvoid: string[]
  contentRules: string[]
  productDescription: string
  mainOffer: string
  ctaStyle: string
  /** Brand themes extracted from company URLs */
  themeCollection: ExtractedBrandTheme[]
  /** Active theme used as default reference for image/video generation */
  activeThemeId?: string
}

export interface SafetySettings {
  requireApprovalBeforePosting: boolean
  enableBrandSafetyCheck: boolean
  enableClaimDetection: boolean
  enableSpamRiskDetection: boolean
  enableOutreachApproval: boolean
}

export type SearchIntent = 'informational' | 'commercial' | 'transactional'

export interface TopicBrief {
  title: string
  goal: string
  keyPoints: string[]
  baseContent: string
  targetAudience: string
  tone: string
  platforms: Platform[]
  topicCount?: number
  customPromptDetails?: string
}

/** Optional manual instructions appended to AI prompts across generation endpoints. */
export interface GenerationPromptOptions {
  customPromptDetails?: string
}

export interface ContentPillar {
  name: string
  description: string
  topicCount: number
}

export interface GeneratedTopic {
  id: string
  title: string
  pillar: string
  intentScore: number
  searchIntent: SearchIntent
  contentAngle: string
  suggestedFormats: string[]
  hookIdeas: string[]
  keyPointsCovered: string[]
  rationale: string
}

export interface TraeSoloTopicResult {
  agent: 'trae-solo'
  task: 'topic_strategy' | 'content_generation'
  status: 'completed' | 'running' | 'failed'
  topics: GeneratedTopic[]
  contentPillars: ContentPillar[]
  summary: string
  executionSteps: string[]
  modelUsed: string
}
