export type DemoPresetId = 'default' | 'investor-pitch' | 'empty'

export interface DemoPresetMeta {
  id: DemoPresetId
  title: string
  subtitle: string
  description: string
  badge?: string
  estimatedMinutes: number
}

export const DEMO_PRESETS: DemoPresetMeta[] = [
  {
    id: 'investor-pitch',
    title: 'Investor Pitch Demo',
    subtitle: 'Full pipeline · seed raise narrative',
    description:
      'Pre-loaded ContentOps AI fundraise campaign: research, content, approval, calendar, VC leads, outreach, and ROI — ready for a live walkthrough.',
    badge: 'Recommended for pitches',
    estimatedMinutes: 12,
  },
  {
    id: 'default',
    title: 'Cognisor Lead Gen',
    subtitle: 'B2B services campaign',
    description:
      'Original demo with Cognisor AI automation positioning — agents, leads, and calendar populated.',
    estimatedMinutes: 10,
  },
  {
    id: 'empty',
    title: 'Blank Workspace',
    subtitle: 'Start from scratch',
    description: 'Empty campaign and idle agents. Use when showing setup from zero.',
    estimatedMinutes: 0,
  },
]

export function getPresetMeta(presetId: DemoPresetId): DemoPresetMeta {
  return DEMO_PRESETS.find((p) => p.id === presetId) ?? DEMO_PRESETS[0]
}
