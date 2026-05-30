'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { GeneratedTopic } from '@/types'
import { ArrowRight, Sparkles, Target } from 'lucide-react'

const intentColors: Record<string, string> = {
  informational: 'bg-blue-500/10 text-blue-400',
  commercial: 'bg-amber-500/10 text-amber-400',
  transactional: 'bg-emerald-500/10 text-emerald-400',
}

interface TopicResultCardProps {
  topic: GeneratedTopic
  rank: number
  selected?: boolean
  onSelect?: () => void
  onGenerateContent?: () => void
}

export function TopicResultCard({
  topic,
  rank,
  selected,
  onSelect,
  onGenerateContent,
}: TopicResultCardProps) {
  return (
    <Card
      className={`bg-card/80 backdrop-blur border-border/60 transition-all cursor-pointer ${
        selected ? 'ring-2 ring-violet-500/50 border-violet-500/30' : 'hover:border-violet-500/20'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-[10px] font-mono text-violet-300">
              {rank}
            </span>
            <p className="text-sm font-medium leading-snug">{topic.title}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {topic.intentScore}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge variant="secondary" className="text-[10px]">{topic.pillar}</Badge>
          <Badge className={`text-[10px] ${intentColors[topic.searchIntent]}`}>
            {topic.searchIntent}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Content angle</p>
          <p className="text-xs text-muted-foreground">{topic.contentAngle}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Hook ideas</p>
          <ul className="flex flex-col gap-1">
            {topic.hookIdeas.slice(0, 2).map((hook) => (
              <li key={hook} className="text-xs text-foreground/80 pl-2 border-l-2 border-violet-500/30">
                {hook}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-1">
          {topic.suggestedFormats.slice(0, 3).map((fmt) => (
            <Badge key={fmt} variant="outline" className="text-[9px] font-normal">
              {fmt}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0 gap-2">
        <Button
          size="sm"
          variant={selected ? 'default' : 'outline'}
          className="h-7 text-xs flex-1"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.()
          }}
        >
          <Target data-icon="inline-start" />
          {selected ? 'Selected' : 'Select'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs flex-1"
          onClick={(e) => {
            e.stopPropagation()
            onGenerateContent?.()
          }}
        >
          <Sparkles data-icon="inline-start" />
          Draft
          <ArrowRight className="size-3" />
        </Button>
      </CardFooter>
    </Card>
  )
}
