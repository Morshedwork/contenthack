'use client'

import { Badge } from '@/components/ui/badge'
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
    <Card className="glass-panel border-0 hover:-translate-y-0.5 min-w-0 overflow-hidden">
      <CardContent className="p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/25 to-blue-500/20 ring-1 ring-violet-500/20">
              <User className="text-violet-200" />
            </div>
            <div className="min-w-0">
              {lead.profileUrl ? (
                <a
                  href={lead.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:text-violet-300 inline-flex max-w-full items-center gap-1"
                >
                  <span className="truncate">{lead.name}</span>
                  <ExternalLink className="size-3 shrink-0 opacity-70" />
                </a>
              ) : (
                <p className="text-sm font-medium truncate">{lead.name}</p>
              )}
              <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="size-3 shrink-0" />
                <span className="truncate">{lead.company} · {lead.role}</span>
              </p>
            </div>
          </div>
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold', scoreColor(lead.score))}>
            {lead.score}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{lead.matchReason}</p>
        <div className="flex flex-col gap-2 border-t border-border/20 pt-2.5">
          <Badge variant="outline" className="w-fit text-[10px] capitalize">{lead.status.replace(/_/g, ' ')}</Badge>
          <button
            type="button"
            onClick={onAction}
            className="group flex min-w-0 items-center gap-1.5 text-left text-xs text-violet-300/90 transition-colors hover:text-violet-200"
          >
            <span className="truncate">{lead.suggestedAction}</span>
            <ArrowRight className="size-3 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
