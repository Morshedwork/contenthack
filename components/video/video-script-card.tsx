'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { VideoScript } from '@/types'
import { getPromotionTypeLabel, getVideoFormatLabel } from '@/lib/models/video-options'
import { Clock, Copy, Film, Send } from 'lucide-react'
import { toast } from 'sonner'

interface VideoScriptCardProps {
  script: VideoScript
  selectable?: boolean
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
  onUsePrompt?: (prompt: string) => void
}

export function VideoScriptCard({
  script,
  selectable,
  selected,
  onSelectChange,
  onUsePrompt,
}: VideoScriptCardProps) {
  return (
    <Card className={`bg-card/60 ${selected ? 'ring-2 ring-violet-500/50' : ''}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {selectable && (
            <Checkbox
              checked={selected}
              onCheckedChange={(v) => onSelectChange?.(v === true)}
              className="mt-1"
              aria-label={`Select ${script.title}`}
            />
          )}
          <div className="min-w-0">
            <CardTitle className="text-base">{script.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="size-3" /> {script.duration}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {script.format && (
                <Badge variant="secondary" className="text-[10px]">
                  {getVideoFormatLabel(script.format)}
                </Badge>
              )}
              {script.promotionType && (
                <Badge variant="outline" className="text-[10px]">
                  {getPromotionTypeLabel(script.promotionType)}
                </Badge>
              )}
              {script.sourcePlatform && (
                <Badge variant="outline" className="text-[10px] capitalize">
                  from {script.sourcePlatform === 'x' ? 'X' : script.sourcePlatform}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="capitalize shrink-0">
          {script.status.replace(/_/g, ' ')}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg bg-violet-500/10 p-3 border border-violet-500/20">
          <p className="text-[10px] text-muted-foreground mb-1">First 3-second hook</p>
          <p className="text-sm font-medium">{script.hook}</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">Scene Timeline</p>
          {script.scenes.map((scene, i) => (
            <div key={`${script.id}-${scene.title}-${i}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="size-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-mono">
                  {i + 1}
                </div>
                {i < script.scenes.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
              </div>
              <div className="flex-1 rounded-lg border border-border/50 p-3 mb-1">
                <p className="text-sm font-medium mb-1">{scene.title}</p>
                <p className="text-xs text-muted-foreground mb-1">{scene.voiceover}</p>
                <p className="text-[10px] text-violet-400">{scene.onScreenText}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Visuals: {scene.visuals}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-secondary/30 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">AI Video Prompt</p>
          <p className="text-xs">{script.aiVideoPrompt}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(script.aiVideoPrompt)
              toast.success('Prompt copied')
            }}
          >
            <Copy data-icon="inline-start" />
            Copy Prompt
          </Button>
          {onUsePrompt && (
            <Button size="sm" variant="outline" onClick={() => onUsePrompt(script.aiVideoPrompt)}>
              <Film data-icon="inline-start" />
              Generate Video
            </Button>
          )}
          <Button size="sm" onClick={() => toast.success('Sent to approval board')}>
            <Send data-icon="inline-start" />
            Send to Approval
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
