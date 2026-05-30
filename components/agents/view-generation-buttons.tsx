'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCompletedAgentViewLinks } from '@/lib/agents/view-links'
import type { ChatActionExecuted } from '@/lib/agents/client'
import { Archive, ArrowRight } from 'lucide-react'

interface ViewGenerationButtonsProps {
  actions: ChatActionExecuted[]
  compact?: boolean
}

export function ViewGenerationButtons({ actions, compact = false }: ViewGenerationButtonsProps) {
  const viewLinks = actions.flatMap((action) => {
    if (action.type !== 'run_agent' && action.type !== 'run_workflow') return []
    return getCompletedAgentViewLinks(action.results)
  })

  if (!viewLinks.length) return null

  const uniqueLinks = [...new Map(viewLinks.map((v) => [v.agentId, v])).values()]

  return (
    <div className="flex flex-wrap gap-2">
      {uniqueLinks.map(({ agentId, link }) => {
        const Icon = link.icon
        return (
          <Button key={agentId} variant="outline" size="sm" className={compact ? 'h-7 text-xs' : 'h-8 text-xs'} asChild>
            <Link href={link.href}>
              <Icon data-icon="inline-start" className="size-3.5" />
              {link.label}
              <ArrowRight data-icon="inline-end" className="size-3 opacity-60" />
            </Link>
          </Button>
        )
      })}
      <Button variant="ghost" size="sm" className={compact ? 'h-7 text-xs' : 'h-8 text-xs'} asChild>
        <Link href="/dashboard/library">
          <Archive data-icon="inline-start" className="size-3.5" />
          Content library
        </Link>
      </Button>
    </div>
  )
}
