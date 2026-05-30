'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { ContentDraft } from '@/types'
import { Calendar, Edit, RefreshCw, Send, Shield } from 'lucide-react'

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-500/10 text-blue-400',
  instagram: 'bg-pink-500/10 text-pink-400',
  facebook: 'bg-indigo-500/10 text-indigo-400',
  x: 'bg-sky-500/10 text-sky-400',
  carousel: 'bg-purple-500/10 text-purple-400',
  email: 'bg-amber-500/10 text-amber-400',
}

interface ContentPreviewCardProps {
  content: ContentDraft
  onRegenerate?: () => void
  onEdit?: () => void
  onSchedule?: () => void
  onApprove?: () => void
}

export function ContentPreviewCard({ content, onRegenerate, onEdit, onSchedule, onApprove }: ContentPreviewCardProps) {
  return (
    <Card className="glass-panel border-0 hover:-translate-y-0.5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className={platformColors[content.platform] || 'bg-secondary'}>{content.platform}</Badge>
          <Badge variant="outline" className="text-[10px] capitalize">{content.status.replace(/_/g, ' ')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">{content.hook}</p>
        <p className="text-xs text-muted-foreground line-clamp-4">{content.mainCopy}</p>
        <p className="text-xs text-primary">{content.cta}</p>
        {content.hashtags.length > 0 && (
          <p className="text-[10px] text-muted-foreground">{content.hashtags.join(' ')}</p>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-secondary/50 p-1.5">
            <p className="text-[10px] text-muted-foreground">Audience</p>
            <p className="text-xs font-medium">{content.audienceFitScore}</p>
          </div>
          <div className="rounded-md bg-secondary/50 p-1.5">
            <p className="text-[10px] text-muted-foreground">Safety</p>
            <p className="text-xs font-medium text-emerald-400">{content.brandSafetyScore}</p>
          </div>
          <div className="rounded-md bg-secondary/50 p-1.5">
            <p className="text-[10px] text-muted-foreground">Lead</p>
            <p className="text-xs font-medium">{content.leadPotentialScore}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-1.5 pt-0">
        <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={onRegenerate}>
          <RefreshCw data-icon="inline-start" />Regen
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={onEdit}>
          <Edit data-icon="inline-start" />Edit
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={onApprove}>
          <Shield data-icon="inline-start" />Approve
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={onSchedule}>
          <Calendar data-icon="inline-start" />Schedule
        </Button>
      </CardFooter>
    </Card>
  )
}
