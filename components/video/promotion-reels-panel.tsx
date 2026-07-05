'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VideoAgentPipeline } from '@/components/video/video-agent-pipeline'
import type { VideoFormat, VideoPromotionType } from '@/types'
import { VIDEO_FORMATS, VIDEO_PROMOTION_TYPES } from '@/lib/models/video-options'

interface PromotionReelsPanelProps {
  draftCount: number
  topicCount: number
  onGenerated: () => void
}

export function PromotionReelsPanel({ draftCount, topicCount, onGenerated }: PromotionReelsPanelProps) {
  const [promotionType, setPromotionType] = useState<VideoPromotionType>('lead_gen')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(3)
  const [format, setFormat] = useState<VideoFormat>('reel')

  const selectedPromo = VIDEO_PROMOTION_TYPES.find((p) => p.id === promotionType)

  return (
    <div className="flex flex-col gap-4">
      <VideoAgentPipeline
        kind="promotion_reels"
        title="Promotion Reels (Multi-Agent)"
        description="Video Agent writes promo variants → Safety Agent checks claims → Scheduler Agent queues reels."
        draftCount={draftCount}
        topicCount={topicCount}
        promotionType={promotionType}
        format={format}
        count={count}
        topic={topic.trim() || undefined}
        accent="amber"
        runLabel={`Run ${count} Promotion Agent${count === 1 ? '' : 's'}`}
        onComplete={onGenerated}
      />

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VIDEO_PROMOTION_TYPES.map((promo) => (
              <Card
                key={promo.id}
                className={`cursor-pointer transition-all ${
                  promotionType === promo.id
                    ? 'ring-2 ring-amber-500/50 bg-amber-500/10'
                    : 'hover:bg-secondary/40'
                }`}
                onClick={() => setPromotionType(promo.id)}
              >
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{promo.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{promo.description}</p>
                  {promotionType === promo.id && (
                    <Badge variant="secondary" className="text-[10px] mt-2">
                      Selected
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPromo && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
              <span className="text-muted-foreground">Hook style: </span>
              {selectedPromo.hookStyle}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="promo-topic">Offer / topic focus (optional)</Label>
              <Input
                id="promo-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Free automation audit, 30% off launch week..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Script variants</Label>
              <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} variant{n === 1 ? '' : 's'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Video format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as VideoFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_FORMATS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
