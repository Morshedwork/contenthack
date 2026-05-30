'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { useWorkspace } from '@/hooks/use-workspace'
import type { MarketResearch } from '@/types'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const chartConfig = { volume: { label: 'Volume', color: 'var(--chart-1)' } } satisfies ChartConfig

export default function ResearchPage() {
  const { data, refresh } = useWorkspace()
  const [mr, setMr] = useState<MarketResearch | null>(null)
  const [industry, setIndustry] = useState('')
  const [targetCustomer, setTargetCustomer] = useState('')
  const [region, setRegion] = useState('')
  const [offer, setOffer] = useState('')
  const [customPromptDetails, setCustomPromptDetails] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (data) {
      if (data.research) setMr(data.research)
      setIndustry(data.campaign.industry)
      setTargetCustomer(data.campaign.targetAudience)
      setRegion(data.campaign.region)
      setOffer(data.campaign.mainOffer)
    }
  }, [data])

  const handleRegenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/research/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          targetCustomer,
          region,
          offer,
          customPromptDetails: customPromptDetails.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Research generation failed')
      setMr(json.data.research)
      await refresh()
      toast.success(`Research report regenerated${json.data.live ? ' (OpenAI)' : ''}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate research')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Market Research</h1>
          <p className="text-muted-foreground text-sm">AI-powered market analysis for your campaign</p>
        </div>
        <Button onClick={() => void handleRegenerate()} disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          Regenerate Research
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Research parameters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="research-industry">Industry</Label>
              <Input id="research-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="research-region">Region</Label>
              <Input id="research-region" value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="research-audience">Target customer</Label>
              <Input
                id="research-audience"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="research-offer">Offer</Label>
              <Input id="research-offer" value={offer} onChange={(e) => setOffer(e.target.value)} />
            </div>
          </div>
          <CustomPromptPanel
            value={customPromptDetails}
            onChange={setCustomPromptDetails}
            description="Manual research focus — competitors to analyze, segments to prioritize, data angles, etc."
            placeholder="e.g. Compare against HubSpot and Jasper, focus on Japan SME SaaS buyers, emphasize workflow automation pain points..."
          />
        </CardContent>
      </Card>

      {!mr ? (
        <Card className="mb-6">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No research yet. Set parameters above and click Regenerate Research.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6 bg-violet-500/5 border-violet-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Market Summary</h3>
            <Badge className="text-emerald-400">Opportunity Score: {mr.opportunityScore}/100</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{mr.marketSummary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Audience Pain Points</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {mr.painPoints.map((p, i) => (
              <div key={p} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-secondary/30">
                <span className="text-violet-400 font-mono text-xs">{i + 1}</span>
                {p}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Trend Cards</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mr.trends.map((t) => (
              <div key={t.title} className="p-3 rounded-lg border border-border/50">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{t.title}</span>
                  <Badge variant="outline">{t.score}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Competitor Content Gaps</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-2 pr-4">Competitor</th>
                  <th className="pb-2 pr-4">Gap</th>
                  <th className="pb-2">Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {mr.competitorGaps.map((c) => (
                  <tr key={c.competitor} className="border-b border-border/50">
                    <td className="py-2 pr-4">{c.competitor}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{c.gap}</td>
                    <td className="py-2 text-emerald-400">{c.opportunity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Keyword Opportunities</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={mr.keywords}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="keyword" tickLine={false} axisLine={false} className="text-[9px]" />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="volume" fill="var(--color-volume)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">High Intent Topics</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {mr.highIntentTopics.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </CardContent>
      </Card>
      </>
      )}
    </>
  )
}
