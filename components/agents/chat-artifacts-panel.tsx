'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ChatArtifact, ChatReference } from '@/lib/agents/types'
import {
  ExternalLink,
  FileText,
  Film,
  ImageIcon,
  Lightbulb,
  Mail,
  Play,
  ScrollText,
  Search,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const typeConfig = {
  post: { icon: FileText, label: 'Post', color: 'text-blue-300', bg: 'bg-blue-500/10' },
  image: { icon: ImageIcon, label: 'Image', color: 'text-fuchsia-300', bg: 'bg-fuchsia-500/10' },
  video: { icon: Film, label: 'Video', color: 'text-violet-300', bg: 'bg-violet-500/10' },
  script: { icon: ScrollText, label: 'Script', color: 'text-amber-300', bg: 'bg-amber-500/10' },
  topic: { icon: Lightbulb, label: 'Topic', color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  research: { icon: Search, label: 'Research', color: 'text-cyan-300', bg: 'bg-cyan-500/10' },
  lead: { icon: Users, label: 'Lead', color: 'text-orange-300', bg: 'bg-orange-500/10' },
  outreach: { icon: Mail, label: 'Outreach', color: 'text-pink-300', bg: 'bg-pink-500/10' },
} as const

function InlineMediaBlock({ artifact }: { artifact: ChatArtifact }) {
  const config = typeConfig[artifact.type]
  const Icon = config.icon

  if (artifact.type === 'image' && artifact.thumbnailUrl) {
    return (
      <Link
        href={artifact.href}
        className="group block rounded-lg overflow-hidden border border-border/50 hover:border-violet-500/40 transition-colors"
      >
        <div className="relative aspect-video max-h-64 bg-secondary/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artifact.thumbnailUrl}
            alt={artifact.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className={cn('absolute top-2 left-2 rounded-md px-2 py-0.5 flex items-center gap-1', config.bg)}>
            <Icon className={cn('size-3', config.color)} />
            <span className="text-[10px] font-medium">Generated image · tap to open</span>
          </div>
        </div>
        <div className="px-3 py-2 bg-background/60">
          <p className="text-xs font-medium line-clamp-1">{artifact.title}</p>
          {artifact.meta && <p className="text-[10px] text-muted-foreground">{artifact.meta}</p>}
        </div>
      </Link>
    )
  }

  if (artifact.type === 'video' && artifact.mediaUrl) {
    return (
      <div className="rounded-lg overflow-hidden border border-border/50 bg-black/40">
        <div className="relative">
          <video
            src={artifact.mediaUrl}
            className="w-full max-h-64 object-contain bg-black"
            controls
            playsInline
            preload="metadata"
          />
          <div className={cn('absolute top-2 left-2 rounded-md px-2 py-0.5 flex items-center gap-1', config.bg)}>
            <Play className={cn('size-3', config.color)} />
            <span className="text-[10px] font-medium">Generated video</span>
          </div>
        </div>
        <div className="px-3 py-2 flex items-center justify-between gap-2 bg-background/60">
          <p className="text-xs font-medium line-clamp-1 flex-1">{artifact.title}</p>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] shrink-0" asChild>
            <Link href={artifact.href}>
              Open studio
              <ExternalLink data-icon="inline-end" className="size-3 opacity-70" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return null
}

function ArtifactCard({ artifact, compact }: { artifact: ChatArtifact; compact?: boolean }) {
  const config = typeConfig[artifact.type]
  const Icon = config.icon

  return (
    <Link
      href={artifact.href}
      className="block rounded-lg border border-border/50 bg-background/50 overflow-hidden hover:border-violet-500/35 transition-colors"
    >
      <div className={cn('flex items-center gap-2 px-3 py-2 border-b border-border/40', config.bg)}>
        <Icon className={cn('size-3.5 shrink-0', config.color)} />
        <span className="text-[10px] font-medium uppercase tracking-wide">{config.label}</span>
        <ExternalLink className="size-3 ml-auto opacity-50" />
      </div>
      <div className={cn('p-3 space-y-1', compact && 'p-2.5')}>
        <p className={cn('font-medium leading-snug', compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2')}>
          {artifact.title}
        </p>
        {artifact.preview && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">{artifact.preview}</p>
        )}
        {artifact.meta && <span className="text-[10px] text-muted-foreground">{artifact.meta}</span>}
      </div>
    </Link>
  )
}

interface ChatArtifactsPanelProps {
  artifacts?: ChatArtifact[]
  references?: ChatReference[]
  compact?: boolean
  inlineMedia?: boolean
}

export function ChatArtifactsPanel({
  artifacts,
  references,
  compact,
  inlineMedia,
}: ChatArtifactsPanelProps) {
  if (!artifacts?.length && !references?.length) return null

  const mediaArtifacts = artifacts?.filter((a) => a.type === 'image' || a.type === 'video') ?? []
  const otherArtifacts = artifacts?.filter((a) => a.type !== 'image' && a.type !== 'video') ?? []

  return (
    <div className="space-y-3">
      {inlineMedia && mediaArtifacts.length > 0 && (
        <div className="space-y-2">
          {mediaArtifacts.map((artifact) => (
            <InlineMediaBlock key={artifact.id} artifact={artifact} />
          ))}
        </div>
      )}

      {otherArtifacts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {inlineMedia && mediaArtifacts.length ? 'Also created' : 'Created in this run'}
          </p>
          <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
            {otherArtifacts.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} compact={compact} />
            ))}
          </div>
        </div>
      )}

      {!inlineMedia && mediaArtifacts.length > 0 && (
        <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
          {mediaArtifacts.map((artifact) => (
            <InlineMediaBlock key={artifact.id} artifact={artifact} />
          ))}
        </div>
      )}

      {references && references.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {references.map((ref) => (
            <Badge key={ref.href} variant="outline" className="text-[10px] gap-1 pr-1" asChild>
              <Link href={ref.href} title={ref.description}>
                {ref.label}
                <ExternalLink className="size-2.5 opacity-60" />
              </Link>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
