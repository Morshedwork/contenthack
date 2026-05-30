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
    title: 'Campaign Demo',
    subtitle: '3 stops · ~2 min',
    description:
      'One click — full campaign loaded. Overview → Content → Leads in about 2 minutes.',
    badge: 'Fastest start',
    estimatedMinutes: 2,
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
