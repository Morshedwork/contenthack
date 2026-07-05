'use client'

import { motion } from 'framer-motion'
import type { WorkspacePayload } from '@/lib/workspace/client'
import { cn } from '@/lib/utils'

interface LiveWorkspaceRailProps {
  data: WorkspacePayload | null
  loading?: boolean
  className?: string
}

const STAT_KEYS = [
  { key: 'drafts' as const, label: 'Drafts' },
  { key: 'leads' as const, label: 'Leads' },
  { key: 'saved' as const, label: 'Hrs saved' },
  { key: 'agents' as const, label: 'Agents done' },
]

export function LiveWorkspaceRail({ data, loading, className }: LiveWorkspaceRailProps) {
  const values = {
    drafts: data?.contentDrafts.length ?? 0,
    leads: data?.leads.length ?? 0,
    saved: data?.roi.weeklyHoursSaved ?? 0,
    agents: data ? `${data.agents.filter((a) => a.status === 'completed').length}/${data.agents.length}` : '0/0',
  }

  return (
    <div className={cn('grid grid-cols-4 gap-2 sm:gap-3', className)}>
      {STAT_KEYS.map(({ key, label }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-2xl border border-border/50 bg-secondary/25 px-2 py-4 sm:py-5 text-center"
        >
          <p className="text-2xl sm:text-3xl font-semibold tabular-nums leading-none font-display">
            {loading ? '—' : values[key]}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">{label}</p>
        </motion.div>
      ))}
    </div>
  )
}
