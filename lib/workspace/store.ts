import 'server-only'

import type {
  AgentDefinition,
  AgentTask,
  AIModel,
  BrandProfile,
  CalendarPost,
  Campaign,
  ContentDraft,
  GeneratedImage,
  GeneratedTopic,
  GeneratedVideo,
  Lead,
  MarketResearch,
  ModelRouting,
  OutreachMessage,
  PlatformIntegration,
  PublishLog,
  ROIReport,
  SafetySettings,
  VideoScript,
} from '@/types'
import {
  demoAgents,
  demoAgentTasks,
  demoBrandProfile,
  demoCalendarPosts,
  demoCampaign,
  demoContentDrafts,
  demoIntegrations,
  demoLeads,
  demoMarketResearch,
  demoModelRouting,
  demoOutreachMessages,
  demoPublishLogs,
  demoROI,
  demoSafetySettings,
  demoVideoScripts,
} from '@/lib/demo/data'
import { assignedModelLabel } from '@/lib/models/routing'
import { getAvailableModels } from '@/lib/models'
import { isDemoMode } from '@/lib/demo/mode'
import { buildInvestorPitchWorkspaceSlice } from '@/lib/demo/investor-pitch'
import type { DemoPresetId } from '@/lib/demo/presets'
import { loadConnectedPlatforms, mergeIntegrationConnectionState } from '@/lib/integrations/store'
import { DEMO_WORKSPACE_ID, resolveWorkspaceContext, type WorkspaceContext } from '@/lib/workspace/context'
import { hasSupabasePersistence, loadWorkspaceState, saveWorkspaceState } from '@/lib/workspace/persistence'

export interface WorkspaceState {
  campaign: Campaign
  research: MarketResearch | null
  topics: GeneratedTopic[]
  contentDrafts: ContentDraft[]
  videoScripts: VideoScript[]
  generatedImages: GeneratedImage[]
  generatedVideos: GeneratedVideo[]
  leads: Lead[]
  outreach: OutreachMessage[]
  agents: AgentDefinition[]
  tasks: AgentTask[]
  calendarPosts: CalendarPost[]
  publishLogs: PublishLog[]
  roi: ROIReport
  brandProfile: BrandProfile
  safetySettings: SafetySettings
  integrations: PlatformIntegration[]
  models: AIModel[]
  modelRouting: ModelRouting[]
  lastWorkflow: { workflowId: string; live: boolean; completedAt: string; estimatedTimeSaved: string } | null
  customPromptDetails: string
}

function newCampaignId() {
  return `camp-${Date.now().toString(36)}`
}

function emptyCampaign(): Campaign {
  return {
    id: newCampaignId(),
    companyName: '',
    industry: '',
    targetAudience: '',
    region: '',
    productService: '',
    campaignGoal: '',
    platforms: ['linkedin'],
    tone: 'Professional',
    contentFrequency: '3 posts per week',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    mainOffer: '',
    ctaStyle: '',
    status: 'draft',
  }
}

function idleAgents(routing = demoModelRouting): AgentDefinition[] {
  return demoAgents.map((a) => ({
    ...a,
    assignedModel: assignedModelLabel(a.id, routing),
    status: 'idle' as const,
    progress: 0,
    confidence: 0,
    currentTask: 'Ready',
    lastOutput: '',
  }))
}

export function createEmptyWorkspace(): WorkspaceState {
  return {
    campaign: emptyCampaign(),
    research: null,
    topics: [],
    contentDrafts: [],
    videoScripts: [],
    generatedImages: [],
    generatedVideos: [],
    leads: [],
    outreach: [],
    agents: idleAgents(),
    tasks: [],
    calendarPosts: [],
    publishLogs: [],
    roi: { ...demoROI, agentProductivity: [], postsGenerated: [], leadScores: [] },
    brandProfile: { ...demoBrandProfile, brandName: '', brandDescription: '', productDescription: '', mainOffer: '', themeCollection: [], activeThemeId: undefined },
    safetySettings: { ...demoSafetySettings },
    integrations: demoIntegrations.map((i) => ({ ...i, connected: false, mockMode: false })),
    models: getAvailableModels().map((m) => ({ ...m })),
    modelRouting: demoModelRouting.map((r) => ({ ...r })),
    lastWorkflow: null,
    customPromptDetails: '',
  }
}

function cloneDemoDefaults(): WorkspaceState {
  return {
    campaign: { ...demoCampaign },
    research: { ...demoMarketResearch },
    topics: [],
    contentDrafts: [...demoContentDrafts],
    videoScripts: [...demoVideoScripts],
    generatedImages: [],
    generatedVideos: [],
    leads: [...demoLeads],
    outreach: [...demoOutreachMessages],
    agents: demoAgents.map((a) => ({ ...a })),
    tasks: demoAgentTasks.map((t) => ({ ...t })),
    calendarPosts: [...demoCalendarPosts],
    publishLogs: [...demoPublishLogs],
    roi: { ...demoROI, agentProductivity: demoROI.agentProductivity.map((a) => ({ ...a })) },
    brandProfile: { ...demoBrandProfile },
    safetySettings: { ...demoSafetySettings },
    integrations: demoIntegrations.map((i) => ({ ...i })),
    models: getAvailableModels().map((m) => ({ ...m })),
    modelRouting: demoModelRouting.map((r) => ({ ...r })),
    lastWorkflow: null,
    customPromptDetails: '',
  }
}

const cache = new Map<string, WorkspaceState>()

async function ensureContext(ctx?: WorkspaceContext, allowAnonymous = false): Promise<WorkspaceContext> {
  return ctx ?? (await resolveWorkspaceContext({ allowAnonymous }))
}

function normalizeBrandProfile(profile: BrandProfile): BrandProfile {
  return {
    ...profile,
    themeCollection: profile.themeCollection ?? [],
  }
}

async function loadState(ctx: WorkspaceContext): Promise<WorkspaceState> {
  let state = cache.get(ctx.workspaceId)
  if (!state) {
    const fromDb = await loadWorkspaceState(ctx.workspaceId)
    const useDemoSeed =
      isDemoMode() || !hasSupabasePersistence() || ctx.workspaceId === DEMO_WORKSPACE_ID
    state = fromDb ?? (useDemoSeed ? cloneDemoDefaults() : createEmptyWorkspace())
    state.brandProfile = normalizeBrandProfile(state.brandProfile)
  }

  const connectedPlatforms = await loadConnectedPlatforms(ctx.workspaceId)
  state.integrations = mergeIntegrationConnectionState(
    state.integrations.map((integration) => ({ ...integration })),
    connectedPlatforms,
  )
  cache.set(ctx.workspaceId, state)
  return state
}

async function persist(ctx: WorkspaceContext, state: WorkspaceState): Promise<void> {
  cache.set(ctx.workspaceId, state)
  await saveWorkspaceState(ctx.workspaceId, state)
}

export async function getWorkspace(ctx?: WorkspaceContext, options?: { allowAnonymous?: boolean }): Promise<WorkspaceState> {
  const resolved = await ensureContext(ctx, options?.allowAnonymous)
  return loadState(resolved)
}

export async function resetWorkspace(ctx?: WorkspaceContext): Promise<WorkspaceState> {
  const resolved = await ensureContext(ctx)
  const state = isDemoMode() ? cloneDemoDefaults() : createEmptyWorkspace()
  await persist(resolved, state)
  return state
}

function buildPresetState(presetId: DemoPresetId): WorkspaceState {
  switch (presetId) {
    case 'investor-pitch':
      return { ...createEmptyWorkspace(), ...buildInvestorPitchWorkspaceSlice() }
    case 'empty':
      return createEmptyWorkspace()
    case 'default':
    default:
      return cloneDemoDefaults()
  }
}

export async function loadDemoPreset(presetId: DemoPresetId, ctx?: WorkspaceContext): Promise<WorkspaceState> {
  const resolved = await ensureContext(ctx)
  const state = buildPresetState(presetId)
  await persist(resolved, state)
  return state
}

export async function patchWorkspace(partial: Partial<WorkspaceState>, ctx?: WorkspaceContext): Promise<WorkspaceState> {
  const resolved = await ensureContext(ctx)
  const current = await loadState(resolved)
  const updated = { ...current, ...partial }
  await persist(resolved, updated)
  return updated
}

export async function updateAgent(agentId: string, patch: Partial<AgentDefinition>, ctx?: WorkspaceContext): Promise<void> {
  const resolved = await ensureContext(ctx)
  const current = await loadState(resolved)
  current.agents = current.agents.map((a) => (a.id === agentId ? { ...a, ...patch } : a))
  await persist(resolved, current)
}

export async function upsertTask(task: AgentTask, ctx?: WorkspaceContext): Promise<void> {
  const resolved = await ensureContext(ctx)
  const current = await loadState(resolved)
  const idx = current.tasks.findIndex((t) => t.id === task.id)
  if (idx >= 0) {
    current.tasks[idx] = task
  } else {
    current.tasks = [task, ...current.tasks]
  }
  await persist(resolved, current)
}

export function computeDynamicROI(state: WorkspaceState): ROIReport {
  const drafts = state.contentDrafts.length
  const leads = state.leads.length
  const qualified = state.leads.filter((l) => l.status === 'qualified').length
  const avgLeadScore = leads > 0 ? Math.round(state.leads.reduce((s, l) => s + l.score, 0) / leads) : 0

  const hoursSaved = Math.round((drafts * 0.4 + leads * 0.15 + (state.research ? 2.5 : 0)) * 10) / 10

  return {
    ...state.roi,
    weeklyHoursSaved: hoursSaved || state.roi.weeklyHoursSaved,
    monthlyCostSaved: Math.round(hoursSaved * 32 * 4),
    postsGenerated: [
      { week: 'W1', count: Math.max(2, Math.floor(drafts * 0.2)) },
      { week: 'W2', count: Math.max(4, Math.floor(drafts * 0.35)) },
      { week: 'W3', count: Math.max(6, Math.floor(drafts * 0.55)) },
      { week: 'W4', count: drafts },
    ],
    leadScores: [
      { week: 'W1', avgScore: Math.max(60, avgLeadScore - 12) },
      { week: 'W2', avgScore: Math.max(65, avgLeadScore - 8) },
      { week: 'W3', avgScore: Math.max(70, avgLeadScore - 4) },
      { week: 'W4', avgScore: avgLeadScore || 75 },
    ],
    agentProductivity: state.agents.map((a) => ({
      agent: a.name.replace(' Agent', ''),
      tasks: a.progress >= 100 ? Math.floor(a.confidence / 3) + 5 : Math.floor(a.progress / 10),
    })),
  }
}

export function buildApprovalItems(state: WorkspaceState) {
  return state.contentDrafts.map((c) => ({
    id: c.id,
    title: c.hook.slice(0, 50),
    platform: c.platform,
    preview: c.mainCopy.slice(0, 120) + (c.mainCopy.length > 120 ? '...' : ''),
    riskLevel: (c.brandSafetyScore < 95 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
    brandSafetyScore: c.brandSafetyScore,
    leadPotentialScore: c.leadPotentialScore,
    status: c.status,
  }))
}

export function buildOverviewKPIs(state: WorkspaceState) {
  const qualified = state.leads.filter((l) => l.status === 'qualified').length
  const scheduled = state.calendarPosts.filter((p) => p.status === 'scheduled').length
  const published = state.publishLogs.filter((p) => p.status === 'success').length
  const roi = computeDynamicROI(state)

  return [
    { label: 'Active Campaigns', value: state.campaign.status === 'active' ? '1' : '0', change: state.campaign.companyName || 'No campaign' },
    { label: 'AI Tasks Completed', value: String(state.tasks.filter((t) => t.status === 'completed').length), change: `${state.tasks.filter((t) => t.status === 'running').length} running` },
    { label: 'Posts Generated', value: String(state.contentDrafts.length), change: `${new Set(state.contentDrafts.map((d) => d.platform)).size} platforms` },
    { label: 'Videos Scripted', value: String(state.videoScripts.length), change: `${state.videoScripts.filter((v) => v.status === 'needs_review').length} pending review` },
    { label: 'Posts Scheduled', value: String(scheduled), change: scheduled ? `Next: ${state.calendarPosts[0]?.date ?? '—'}` : 'None yet' },
    { label: 'Posts Published', value: String(published), change: state.lastWorkflow?.live ? 'Live AI' : 'Ready' },
    { label: 'Leads Found', value: String(state.leads.length), change: `${qualified} qualified` },
    { label: 'Outreach Drafts', value: String(state.outreach.length), change: `${state.outreach.filter((o) => o.approved).length} approved` },
    { label: 'Hours Saved', value: String(roi.weeklyHoursSaved), change: 'This week' },
    { label: 'Est. Cost Saved', value: `$${Math.round(roi.weeklyHoursSaved * 80)}`, change: 'This week' },
  ]
}

export function scheduleFromDrafts(state: WorkspaceState, drafts: ContentDraft[]): CalendarPost[] {
  const start = state.campaign.startDate ? new Date(state.campaign.startDate) : new Date()
  return drafts.slice(0, 12).map((d, i) => {
    const date = new Date(start)
    date.setDate(date.getDate() + i * 2)
    return {
      id: `cal-${d.id}`,
      platform: d.platform,
      title: d.hook.slice(0, 60),
      time: i % 2 === 0 ? '09:00' : '14:00',
      date: date.toISOString().slice(0, 10),
      status: 'scheduled' as const,
      campaign: state.campaign.companyName,
      owner: 'Content Agent',
    }
  })
}

export async function updateContentDraftStatus(
  draftId: string,
  status: ContentDraft['status'],
  ctx?: WorkspaceContext,
): Promise<WorkspaceState> {
  const resolved = await ensureContext(ctx)
  const current = await loadState(resolved)
  current.contentDrafts = current.contentDrafts.map((d) => (d.id === draftId ? { ...d, status } : d))
  await persist(resolved, current)
  return current
}

export async function connectIntegration(
  platformId: string,
  ctx?: WorkspaceContext,
): Promise<WorkspaceState> {
  const resolved = await ensureContext(ctx)
  const current = await loadState(resolved)
  current.integrations = current.integrations.map((i) =>
    i.id === platformId ? { ...i, connected: true, mockMode: false } : i,
  )
  await persist(resolved, current)
  return current
}
