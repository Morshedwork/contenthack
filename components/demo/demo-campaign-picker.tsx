'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEMO_PRESETS, type DemoPresetId } from '@/lib/demo/presets'
import { loadDemoPresetClient } from '@/lib/workspace/client'
import { cn } from '@/lib/utils'
import { Briefcase, Loader2, Presentation, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DemoCampaignPickerProps {
  activePreset?: DemoPresetId | null
  onLoaded?: () => void
  compact?: boolean
}

const presetIcons: Record<DemoPresetId, typeof Sparkles> = {
  'investor-pitch': Presentation,
  default: Briefcase,
  empty: Trash2,
}

export function DemoCampaignPicker({ activePreset, onLoaded, compact }: DemoCampaignPickerProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<DemoPresetId | null>(null)

  const handleLoad = async (presetId: DemoPresetId) => {
    setLoadingId(presetId)
    try {
      await loadDemoPresetClient(presetId)
      toast.success(
        presetId === 'investor-pitch'
          ? 'Investor pitch demo loaded — follow the tour from Overview'
          : presetId === 'empty'
            ? 'Blank workspace ready'
            : 'Cognisor demo campaign loaded',
      )
      onLoaded?.()
      if (presetId === 'investor-pitch') {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load demo')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3')}>
      {DEMO_PRESETS.map((preset) => {
        const Icon = presetIcons[preset.id]
        const isActive = activePreset === preset.id
        const loading = loadingId === preset.id

        return (
          <Card
            key={preset.id}
            className={cn(
              'relative overflow-hidden transition-colors',
              preset.id === 'investor-pitch' && 'border-violet-500/40 bg-violet-500/5',
              isActive && 'ring-2 ring-violet-500/50',
            )}
          >
            {preset.badge && (
              <Badge className="absolute top-3 right-3 bg-violet-500/20 text-violet-200 border-violet-500/30 text-[10px]">
                {preset.badge}
              </Badge>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/15">
                  <Icon className="size-4 text-violet-300" />
                </div>
                <div>
                  <CardTitle className="text-base">{preset.title}</CardTitle>
                  <CardDescription className="text-xs">{preset.subtitle}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{preset.description}</p>
              {preset.estimatedMinutes > 0 && (
                <p className="text-xs text-muted-foreground">
                  ~{preset.estimatedMinutes} min walkthrough
                </p>
              )}
              <Button
                variant={preset.id === 'investor-pitch' ? 'default' : 'outline'}
                className="w-full"
                disabled={loading || isActive}
                onClick={() => handleLoad(preset.id)}
              >
                {loading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Sparkles data-icon="inline-start" />
                )}
                {isActive ? 'Currently loaded' : loading ? 'Loading...' : 'Load demo'}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
