'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LibraryItemCard } from '@/components/library/library-item-card'
import { buildLibraryItems, libraryCounts, libraryTypeLabels } from '@/lib/library/items'
import type { WorkspacePayload } from '@/lib/workspace/client'
import type { LibraryContentType, LibraryItem } from '@/types'
import {
  Archive,
  FileText,
  Film,
  ImageIcon,
  Lightbulb,
  ScrollText,
  Search,
  Sparkles,
} from 'lucide-react'

const tabIcons: Record<LibraryContentType | 'all', typeof Archive> = {
  all: Archive,
  post: FileText,
  image: ImageIcon,
  video: Film,
  script: ScrollText,
  topic: Lightbulb,
}

interface ContentLibraryProps {
  data: WorkspacePayload
}

export function ContentLibrary({ data }: ContentLibraryProps) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<LibraryContentType | 'all'>('all')
  const [selected, setSelected] = useState<LibraryItem | null>(null)

  const items = useMemo(
    () =>
      buildLibraryItems({
        contentDrafts: data.contentDrafts,
        generatedImages: data.generatedImages,
        generatedVideos: data.generatedVideos,
        videoScripts: data.videoScripts,
        topics: data.topics,
      }),
    [data],
  )

  const counts = useMemo(() => libraryCounts(items), [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesTab = activeTab === 'all' || item.type === activeTab
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.preview.toLowerCase().includes(q) ||
        item.meta?.toLowerCase().includes(q)
      return matchesTab && matchesQuery
    })
  }, [items, activeTab, query])

  const tabs: (LibraryContentType | 'all')[] = ['all', 'post', 'image', 'video', 'script', 'topic']

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab]
          const label = tab === 'all' ? 'All assets' : libraryTypeLabels[tab]
          return (
            <Card key={tab} className="bg-card/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10">
                  <Icon className="size-4 text-violet-300" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-xl font-display">{counts[tab]}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search library by title, prompt, or platform..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/content">
              <Sparkles data-icon="inline-start" />
              New post
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/image">
              <ImageIcon data-icon="inline-start" />
              New image
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/video">
              <Film data-icon="inline-start" />
              New video
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LibraryContentType | 'all')}>
        <TabsList className="mb-6 flex-wrap h-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="gap-1.5 capitalize">
              {tab === 'all' ? 'All' : libraryTypeLabels[tab]}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{counts[tab]}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
                <Archive className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium mb-1">No content in this library yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Generated posts, images, videos, and scripts appear here automatically.
                </p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/content">Start creating</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                  {filtered.map((item) => (
                    <LibraryItemCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      selected={selected?.id === item.id && selected?.type === item.type}
                      onSelect={setSelected}
                    />
                  ))}
                </div>

                <Card className="h-fit sticky top-24 bg-card/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm">
                    {selected && filtered.some((i) => i.id === selected.id && i.type === selected.type) ? (
                      <>
                        <Badge variant="outline" className="w-fit capitalize">{selected.type}</Badge>
                        <p className="font-medium">{selected.title}</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selected.preview}</p>
                        {selected.type === 'image' && selected.mediaUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selected.mediaUrl}
                            alt={selected.title}
                            className="w-full rounded-lg border border-border/60"
                          />
                        )}
                        {selected.type === 'video' && selected.mediaUrl && (
                          <video
                            src={selected.mediaUrl}
                            controls
                            className="w-full rounded-lg border border-border/60"
                          />
                        )}
                        {selected.meta && (
                          <p className="text-[11px] text-muted-foreground">{selected.meta}</p>
                        )}
                        {selected.href && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={selected.href}>Open in studio</Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground py-8 text-center">
                        Select an item to preview details
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}
