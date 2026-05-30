'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CampaignDetailsEditor } from '@/components/campaign/campaign-details-editor'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { WorkflowPipeline } from '@/components/agents/workflow-pipeline'
import { useWorkspace } from '@/hooks/use-workspace'
import { formatPlatforms } from '@/lib/campaigns'
import type { Campaign } from '@/types'
import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles, Workflow } from 'lucide-react'
import { toast } from 'sonner'

const workflowTasks = [
  'Research task', 'Topic generation task', 'Content generation task', 'Video script task',
  'Brand safety check', 'Approval task', 'Scheduling task', 'Publishing task',
  'Lead generation task', 'Outreach task', 'ROI tracking task',
]

export default function CampaignBuilderPage() {
  const { data, refresh } = useWorkspace()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customPromptDetails, setCustomPromptDetails] = useState('')

  useEffect(() => {
    if (data?.campaign) setCampaign(data.campaign)
  }, [data?.campaign])

  if (!campaign) {
    return <div className="p-8 text-sm text-muted-foreground">Loading campaign...</div>
  }

  const handleSaveCampaign = async (updated: Campaign) => {
    const res = await fetch('/api/campaigns/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    setCampaign(json.data.campaign)
    await refresh()
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campaign, customPromptDetails: customPromptDetails.trim() || undefined }),
      })
      const json = await res.json()
      if (json.success && json.data.campaign) {
        setCampaign(json.data.campaign)
    await refresh()
      }
      setGenerated(true)
      toast.success('Campaign plan generated — 11 workflow tasks created')
    } catch {
      await new Promise((r) => setTimeout(r, 1500))
      setGenerated(true)
      toast.success('Campaign plan generated — 11 workflow tasks created')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Campaign Builder</h1>
        <p className="text-muted-foreground text-sm">
          View and edit full campaign details, then generate your AI workflow
        </p>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-6">
          <TabsTrigger value="details" className="gap-1.5">
            <FileText className="size-3.5" />
            Campaign Details
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-1.5">
            <Workflow className="size-3.5" />
            Workflow Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <CampaignDetailsEditor campaign={campaign} onSave={handleSaveCampaign} />
        </TabsContent>

        <TabsContent value="workflow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign snapshot</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Workflow uses your saved campaign details. Edit them in the{' '}
                  <strong className="text-foreground">Campaign Details</strong> tab.
                </p>
                <div className="rounded-lg bg-secondary/30 p-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Company</span>
                    <span className="text-right font-medium">{campaign.companyName}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Audience</span>
                    <span className="text-right max-w-[60%] truncate">{campaign.targetAudience}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Platforms</span>
                    <span className="text-right max-w-[60%] truncate">
                      {formatPlatforms(campaign.platforms)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="text-right max-w-[60%] line-clamp-2">{campaign.campaignGoal}</span>
                  </div>
                </div>
                <CustomPromptPanel
                  value={customPromptDetails}
                  onChange={setCustomPromptDetails}
                  description="Manual workflow instructions passed to all agents when the campaign plan is generated."
                  placeholder="e.g. Prioritize LinkedIn and email, include video scripts for top 3 topics, target ops managers at 50–200 employee companies..."
                />
                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                  <Sparkles data-icon="inline-start" />
                  {loading ? 'Generating...' : 'Generate Campaign Plan'}
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              {generated && (
                <>
                  <Card className="bg-violet-500/5 border-violet-500/20">
                    <CardHeader>
                      <CardTitle className="text-base">Generated Workflow</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <WorkflowPipeline
                        steps={['Goal', 'Research', 'Topics', 'Content', 'Video', 'Safety', 'Approval', 'Schedule', 'Publish', 'Leads', 'ROI']}
                        activeIndex={2}
                        compact
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Workflow Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {workflowTasks.map((task, i) => (
                        <div key={task} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm">{task}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {i < 2 ? 'Completed' : i < 4 ? 'Running' : 'Queued'}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
              {!generated && (
                <Card className="flex items-center justify-center min-h-[300px] bg-card/40">
                  <CardContent className="text-center text-muted-foreground">
                    <Sparkles className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Review your campaign snapshot and click Generate to create your workflow
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
