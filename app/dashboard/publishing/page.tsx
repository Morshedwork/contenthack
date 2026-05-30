'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PublishLogTable } from '@/components/dashboard/publish-log-table'
import { useWorkspace } from '@/hooks/use-workspace'
import { toast } from 'sonner'

export default function PublishingPage() {
  const { data, loading, refresh } = useWorkspace()

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
    return <div className="p-8 text-sm text-muted-foreground">Loading publishing center...</div>
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Publishing Center</h1>
        <p className="text-muted-foreground text-sm">Platform adapters for multi-channel publishing</p>
      </div>

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
    </>
  )
}
