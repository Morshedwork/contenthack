'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { LibraryItem } from '@/types'
import { Copy, Download, ExternalLink, FileText, Film, ImageIcon, Lightbulb, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const typeConfig = {
  post: { icon: FileText, color: 'text-blue-300', bg: 'bg-blue-500/10' },
  image: { icon: ImageIcon, color: 'text-fuchsia-300', bg: 'bg-fuchsia-500/10' },
  video: { icon: Film, color: 'text-violet-300', bg: 'bg-violet-500/10' },
  script: { icon: ScrollText, color: 'text-amber-300', bg: 'bg-amber-500/10' },
  topic: { icon: Lightbulb, color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
} as const

interface LibraryItemCardProps {
  item: LibraryItem
  onSelect?: (item: LibraryItem) => void
  selected?: boolean
}

export function LibraryItemCard({ item, onSelect, selected }: LibraryItemCardProps) {
  const config = typeConfig[item.type]
  const Icon = config.icon

  const copyPreview = () => {
    void navigator.clipboard.writeText(item.preview || item.title)
    toast.success('Copied to clipboard')
  }

  const downloadMedia = () => {
    if (!item.mediaUrl) return
    const link = document.createElement('a')
    link.href = item.mediaUrl
    link.download = `contentops-${item.id}`
    link.click()
    toast.success('Download started')
  }

  return (
    <Card
      className={cn(
        'overflow-hidden bg-card/60 border-border/60 hover:border-violet-500/30 transition-all cursor-pointer',
        selected && 'ring-2 ring-violet-500/50 border-violet-500/40',
      )}
      onClick={() => onSelect?.(item)}
    >
      {(item.type === 'image' && item.thumbnailUrl) || (item.type === 'video' && item.mediaUrl) ? (
        <div className="aspect-video bg-secondary/30 relative overflow-hidden">
          {item.type === 'image' && item.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
          )}
          {item.type === 'video' && item.mediaUrl && (
            <video src={item.mediaUrl} className="w-full h-full object-cover" muted />
          )}
          <div className={cn('absolute top-2 left-2 rounded-md px-2 py-1 flex items-center gap-1', config.bg)}>
            <Icon className={cn('size-3', config.color)} />
            <span className="text-[10px] capitalize font-medium">{item.type}</span>
          </div>
        </div>
      ) : (
        <div className={cn('px-4 pt-4 pb-2 flex items-center gap-2', config.bg, 'mx-4 mt-4 rounded-lg py-3')}>
          <Icon className={cn('size-4 shrink-0', config.color)} />
          <span className="text-xs capitalize font-medium">{item.type}</span>
          {item.platform && (
            <Badge variant="outline" className="text-[10px] ml-auto capitalize">{item.platform}</Badge>
          )}
        </div>
      )}

      <CardContent className="p-4 pt-3 flex flex-col gap-2">
        <p className="text-sm font-medium line-clamp-2 leading-snug">{item.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{item.preview}</p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground">
            {item.meta || item.model || new Date(item.createdAt).toLocaleDateString()}
          </span>
          {item.status && (
            <Badge variant="secondary" className="text-[10px] capitalize">{item.status.replace(/_/g, ' ')}</Badge>
          )}
        </div>
        <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={copyPreview}>
            <Copy data-icon="inline-start" />
            Copy
          </Button>
          {item.mediaUrl && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={downloadMedia}>
              <Download data-icon="inline-start" />
            </Button>
          )}
          {item.href && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
              <Link href={item.href}>
                <ExternalLink data-icon="inline-start" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
