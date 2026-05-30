'use client'

import { Badge } from '@/components/ui/badge'
import type { PublishLog } from '@/types'
import { ExternalLink } from 'lucide-react'

interface PublishLogTableProps {
  logs: PublishLog[]
}

export function PublishLogTable({ logs }: PublishLogTableProps) {
  const statusColors: Record<string, string> = {
    success: 'text-emerald-400',
    failed: 'text-red-400',
    pending: 'text-amber-400',
    scheduled: 'text-blue-400',
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Title</th>
            <th className="pb-2 pr-4 font-medium">Platform</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 pr-4 font-medium">Time</th>
            <th className="pb-2 font-medium">URL / Error</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-border/50">
              <td className="py-2.5 pr-4">{log.title}</td>
              <td className="py-2.5 pr-4 capitalize">{log.platform}</td>
              <td className="py-2.5 pr-4">
                <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[log.status]}`}>
                  {log.status}
                </Badge>
              </td>
              <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                {new Date(log.time).toLocaleString()}
              </td>
              <td className="py-2.5 text-xs">
                {log.url ? (
                  <a href={log.url} className="flex items-center gap-1 text-primary hover:underline" target="_blank" rel="noreferrer">
                    {log.url.slice(0, 40)}...
                    <ExternalLink />
                  </a>
                ) : (
                  <span className="text-red-400">{log.error}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
