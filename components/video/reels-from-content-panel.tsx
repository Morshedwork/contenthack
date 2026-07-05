'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VideoAgentPipeline } from '@/components/video/video-agent-pipeline'
import type { ContentDraft, VideoFormat } from '@/types'
import { VIDEO_FORMATS } from '@/lib/models/video-options'
import { FileText } from 'lucide-react'

interface ReelsFromContentPanelProps {
  contentDrafts: ContentDraft[]
  topicCount: number
  onGenerated: () => void
}

export function ReelsFromContentPanel({
  contentDrafts,
  topicCount,
  onGenerated,
}: ReelsFromContentPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [format, setFormat] = useState<VideoFormat>('reel')

  const toggleDraft = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectAll = () => {
    setSelectedIds(contentDrafts.map((d) => d.id))
  }

  if (!contentDrafts.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <FileText className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">No content drafts yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Run the Content Agent in Content Studio first, or use the full reel campaign pipeline.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/content">Go to Content Studio</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const selectedCount = selectedIds.length || contentDrafts.length

  return (
    <div className="flex flex-col gap-4">
      <VideoAgentPipeline
        kind="content_reels"
        title="Reels from Content (Multi-Agent)"
        description="Content Agent ensures posts exist → Video Agent adapts each draft into a reel → Safety Agent reviews → Scheduler Agent queues on calendar."
        draftCount={contentDrafts.length}
        topicCount={topicCount}
        contentDraftIds={selectedIds.length ? selectedIds : undefined}
        format={format}
        accent="violet"
        runLabel={`Run ${selectedCount} Reel Agent${selectedCount === 1 ? '' : 's'}`}
        onComplete={onGenerated}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Video format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as VideoFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_FORMATS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedIds.length
            ? `${selectedIds.length} draft${selectedIds.length === 1 ? '' : 's'} selected`
            : `All ${contentDrafts.length} drafts will be used`}
        </p>
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select all
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contentDrafts.map((draft) => {
          const checked = selectedIds.includes(draft.id)
          return (
            <Card
              key={draft.id}
              className={`cursor-pointer transition-colors ${checked ? 'ring-2 ring-violet-500/40 bg-violet-500/5' : 'hover:bg-secondary/30'}`}
              onClick={() => toggleDraft(draft.id)}
            >
              <CardContent className="p-4 flex gap-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleDraft(draft.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {draft.platform === 'x' ? 'X' : draft.platform}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {draft.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium line-clamp-1">{draft.hook}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{draft.mainCopy}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
