'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AIModel } from '@/types'
import { Cpu, ImageIcon, Video, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const speedColors = { fast: 'text-emerald-400', medium: 'text-amber-400', slow: 'text-red-400' }
const costColors = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' }

function ModelIcon({ model }: { model: AIModel }) {
  if (model.useCases.some((u) => u.toLowerCase().includes('image'))) {
    return <ImageIcon className="text-fuchsia-200" />
  }
  if (model.useCases.some((u) => u.toLowerCase().includes('video'))) {
    return <Video className="text-blue-200" />
  }
  return <Cpu className="text-violet-200" />
}

interface ModelCardProps {
  model: AIModel
  onSetDefault?: (id: string) => void
}

export function ModelCard({ model, onSetDefault }: ModelCardProps) {
  return (
    <Card className={cn('glass-panel border-0 hover:-translate-y-0.5', model.isDefault && 'glow-ring')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 ring-1 ring-violet-500/20">
              <ModelIcon model={model} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{model.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{model.provider}</p>
            </div>
          </div>
          {model.isDefault && <Badge className="text-[10px]">Default</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Best for: </span>
          <span>{model.bestFor}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-secondary/50 p-2">
            <p className="text-muted-foreground mb-0.5">Speed</p>
            <p className={cn('capitalize font-medium', speedColors[model.speed])}>{model.speed}</p>
          </div>
          <div className="rounded-md bg-secondary/50 p-2">
            <p className="text-muted-foreground mb-0.5">Cost</p>
            <p className={cn('capitalize font-medium', costColors[model.costLevel])}>{model.costLevel}</p>
          </div>
          <div className="rounded-md bg-secondary/50 p-2">
            <p className="text-muted-foreground mb-0.5">Quality</p>
            <p className="font-medium">{model.qualityScore}/100</p>
          </div>
          <div className="rounded-md bg-secondary/50 p-2">
            <p className="text-muted-foreground mb-0.5">Context</p>
            <p className="font-medium font-mono">{model.contextSize}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {model.useCases.map((uc) => (
            <Badge key={uc} variant="outline" className="text-[10px]">{uc}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={cn(
            'text-[10px] capitalize',
            model.status === 'available' ? 'text-emerald-400' : model.status === 'limited' ? 'text-amber-400' : 'text-red-400',
          )}>
            <Zap data-icon="inline-start" />
            {model.status}
          </Badge>
          {!model.isDefault && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSetDefault?.(model.id)}>
              Set as Default
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
