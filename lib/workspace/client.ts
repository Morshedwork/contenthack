import type {
  AgentDefinition,
  AgentTask,
  AIModel,
  ApprovalItem,
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

export type WorkspacePayload = {
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
  approvalItems: ApprovalItem[]
  overviewKPIs: { label: string; value: string; change: string }[]
}

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string }

async function parseApi<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiEnvelope<T>
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || `Request failed (${res.status})`)
  }
  return json.data
}

export async function fetchWorkspace(): Promise<WorkspacePayload> {
  return parseApi(await fetch('/api/workspace', { cache: 'no-store' }))
}

export async function patchWorkspaceClient(body: Record<string, unknown>): Promise<WorkspacePayload> {
  return parseApi(
    await fetch('/api/workspace', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

export async function loadDemoPresetClient(preset: 'default' | 'investor-pitch' | 'empty'): Promise<WorkspacePayload> {
  return patchWorkspaceClient({ action: 'loadPreset', preset })
}
