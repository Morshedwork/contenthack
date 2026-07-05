'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PublishLogTable } from '@/components/dashboard/publish-log-table'
import { useWorkspace } from '@/hooks/use-workspace'
import type { ContentStatus } from '@/types'
import { Check, CheckSquare, Edit, Megaphone, X } from 'lucide-react'
import { toast } from 'sonner'

const columns: { id: ContentStatus; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'needs_review', label: 'Needs Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
]

export default function ApprovalPageClient() {
  const searchParams = useSearchParams()
  const { data, loading, patch, refresh } = useWorkspace()
  const [activeTab, setActiveTab] = useState('approval')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'publishing') setActiveTab('publishing')
  }, [searchParams])

  const moveItem = async (id: string, status: ContentStatus) => {
    try {
      await patch({ action: 'updateApproval', draftId: id, status })
      toast.success(`Content moved to ${status.replace(/_/g, ' ')}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const publishPlatforms = (data?.integrations ?? []).filter((i) =>
    ['linkedin', 'instagram', 'facebook', 'x', 'tiktok', 'youtube'].includes(i.id),
  )

  const publishPost = async (platform: string) => {
    const draft = data?.contentDrafts.find((d) => d.platform === platform) ?? data?.contentDrafts[0]
    if (!draft) {
      toast.error('No content drafts available — generate content first')
      return
    }
    const integration = publishPlatforms.find((i) => i.id === platform)
    if (!integration?.connected) {
      toast.error(`Connect ${platform} in Integrations before publishing`)
      return
    }
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, title: draft.hook, content: draft.mainCopy }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      await refresh()
      toast.success(`Published to ${platform}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed')
    }
  }

  if (loading || !data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading approve & publish...</div>
  }

  const items = data.approvalItems
  const pendingReview = items.filter((i) => i.status === 'needs_review').length

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Approve & Publish</h1>
        <p className="text-muted-foreground text-sm">
          Review content, approve for publishing, and push to connected platforms
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="approval" className="gap-1.5">
            <CheckSquare className="size-3.5" />
            Approval Board
            {pendingReview > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
                {pendingReview}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="publishing" className="gap-1.5">
            <Megaphone className="size-3.5" />
            Publishing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approval">
          <p className="text-muted-foreground text-sm mb-4">No content can be published unless approved</p>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((col) => (
              <div key={col.id} className="min-w-[280px] flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">{col.label}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {items.filter((i) => i.status === col.id).length}
                  </Badge>
                </div>
                <div className="flex flex-col gap-3">
                  {items.filter((i) => i.status === col.id).map((item) => (
                    <Card key={item.id} className="bg-card/60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-[10px] capitalize">{item.platform}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${item.riskLevel === 'low' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {item.riskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.preview}</p>
                        <div className="flex gap-2 text-[10px] mb-3">
                          <span>Safety: {item.brandSafetyScore}</span>
                          <span>Lead: {item.leadPotentialScore}</span>
                        </div>
                        <div className="flex gap-1">
                          {col.id === 'needs_review' && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => void moveItem(item.id, 'approved')}>
                                <Check data-icon="inline-start" />Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void moveItem(item.id, 'draft')}>
                                <X />
                              </Button>
                            </>
                          )}
                          {col.id === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs flex-1"
                              onClick={() => {
                                setActiveTab('publishing')
                                toast.info(`Ready to publish "${item.title}" — select a platform`)
                              }}
                            >
                              <Megaphone data-icon="inline-start" />
                              Publish
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info('Opening editor')}>
                            <Edit />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="publishing">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {publishPlatforms.map((platform) => (
              <Card key={platform.id} className="bg-card/60">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base">{platform.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">{platform.connected ? 'Connected' : 'Disconnected'}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Status</span>
                    <Badge variant="outline" className={`text-[10px] capitalize ${
                      platform.apiStatus === 'healthy' ? 'text-emerald-400' :
                      platform.apiStatus === 'degraded' ? 'text-amber-400' : 'text-red-400'
                    }`}>{platform.apiStatus}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled</span>
                    <span>{platform.scheduledCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed</span>
                    <span className={platform.failedCount > 0 ? 'text-red-400' : ''}>{platform.failedCount}</span>
                  </div>
                  {platform.lastPublished && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last published</span>
                      <span className="text-xs">{platform.lastPublished}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => void publishPost(platform.id)}>
                      Publish Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publishing Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <PublishLogTable logs={data.publishLogs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
