'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Lead } from '@/types'
import { ArrowRight, Building2, ExternalLink, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadScoreCardProps {
  lead: Lead
  onAction?: () => void
}

function scoreColor(score: number) {
  if (score >= 90) return 'text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-500/30'
  if (score >= 80) return 'text-blue-300 bg-blue-500/15 ring-1 ring-blue-500/30'
  if (score >= 70) return 'text-amber-300 bg-amber-500/15 ring-1 ring-amber-500/30'
  return 'text-muted-foreground bg-secondary'
}

export function LeadScoreCard({ lead, onAction }: LeadScoreCardProps) {
  return (
    <Card className="glass-panel border-0 hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/25 to-blue-500/20 ring-1 ring-violet-500/20">
              <User className="text-violet-200" />
            </div>
            <div>
              {lead.profileUrl ? (
                <a
                  href={lead.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:text-violet-300 inline-flex items-center gap-1"
                >
                  {lead.name}
                  <ExternalLink className="size-3 opacity-70" />
                </a>
              ) : (
                <p className="text-sm font-medium">{lead.name}</p>
              )}
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 />
                {lead.company} · {lead.role}
              </p>
            </div>
          </div>
          <div className={cn('flex size-10 items-center justify-center rounded-lg text-sm font-bold', scoreColor(lead.score))}>
            {lead.score}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{lead.matchReason}</p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] capitalize">{lead.status.replace(/_/g, ' ')}</Badge>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onAction}>
            {lead.suggestedAction}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
