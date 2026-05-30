'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getAgentViewLink } from '@/lib/agents/view-links'
import type { AgentDefinition } from '@/types'
import { ArrowRight, Bot, FileText, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  idle: 'bg-muted text-muted-foreground',
  running: 'bg-blue-500/15 text-blue-300',
  waiting_for_approval: 'bg-amber-500/15 text-amber-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  failed: 'bg-destructive/15 text-destructive',
}

const statusDot: Record<string, string> = {
  idle: 'bg-muted-foreground',
  running: 'bg-blue-400 animate-pulse',
  waiting_for_approval: 'bg-amber-400',
  completed: 'bg-emerald-400',
  failed: 'bg-red-400',
}

interface AgentCardProps {
  agent: AgentDefinition
  disabled?: boolean
  onRun?: (id: string) => void
  onPause?: (id: string) => void
  onViewLogs?: (id: string) => void
}

export function AgentCard({ agent, disabled, onRun, onPause, onViewLogs }: AgentCardProps) {
  const viewLink = agent.status === 'completed' ? getAgentViewLink(agent.id) : undefined

  return (
    <Card className="glass-panel border-0 hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-blue-500/20 ring-1 ring-violet-500/20">
              <Bot className="text-violet-200" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>
          </div>
          <Badge variant="secondary" className={cn('text-[10px] capitalize gap-1', statusColors[agent.status])}>
            <span className={cn('size-1.5 rounded-full', statusDot[agent.status])} />
            {agent.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Model</span>
          <span className="font-mono text-foreground">{agent.assignedModel}</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Current task</p>
          <p className="text-xs text-foreground line-clamp-2">{agent.currentTask}</p>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span>{agent.progress}%</span>
          </div>
          <Progress value={agent.progress} className="h-1.5" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className={cn(agent.confidence >= 90 ? 'text-emerald-400' : 'text-foreground')}>
            {agent.confidence > 0 ? `${agent.confidence}%` : '—'}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2 border-t border-border pt-2">
          {agent.lastOutput}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 min-w-[4.5rem] h-7 text-xs"
            disabled={disabled || agent.status === 'running'}
            onClick={() => onRun?.(agent.id)}
          >
            <Play data-icon="inline-start" />
            Run
          </Button>
          {viewLink ? (
            <Button size="sm" variant="default" className="flex-1 min-w-[4.5rem] h-7 text-xs" asChild>
              <Link href={viewLink.href}>
                <ArrowRight data-icon="inline-start" />
                View
              </Link>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={disabled || agent.status === 'completed'}
            onClick={() => onPause?.(agent.id)}
          >
            <Pause />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onViewLogs?.(agent.id)}>
            <FileText />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
