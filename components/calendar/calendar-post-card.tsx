'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CalendarPost } from '@/types'
import { Clock } from 'lucide-react'

const platformColors: Record<string, string> = {
  linkedin: 'border-l-blue-500',
  instagram: 'border-l-pink-500',
  facebook: 'border-l-indigo-500',
  x: 'border-l-sky-500',
}

interface CalendarPostCardProps {
  post: CalendarPost
  compact?: boolean
}

export function CalendarPostCard({ post, compact }: CalendarPostCardProps) {
  return (
    <Card className={`border-l-2 ${platformColors[post.platform] || 'border-l-border'} bg-card/80`}>
      <CardContent className={compact ? 'p-2' : 'p-3'}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <Badge variant="outline" className="text-[9px] capitalize">{post.platform}</Badge>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock />
            {post.time}
          </span>
        </div>
        <p className={`font-medium text-foreground ${compact ? 'text-[11px] line-clamp-1' : 'text-xs line-clamp-2'}`}>
          {post.title}
        </p>
        {!compact && (
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{post.campaign}</span>
            <Badge variant="secondary" className="text-[9px] capitalize">{post.status}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
