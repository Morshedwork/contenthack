'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeadScoreCard } from '@/components/leads/lead-score-card'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { useWorkspace } from '@/hooks/use-workspace'
import type { Lead } from '@/types'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Loader2, Sparkles, Users } from 'lucide-react'
import { toast } from 'sonner'

const chartConfig = { count: { label: 'Leads', color: 'var(--chart-1)' } } satisfies ChartConfig

export default function LeadsPage() {
  const { data, refresh } = useWorkspace()
  const [leads, setLeads] = useState<Lead[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [criteria, setCriteria] = useState('')
  const [leadCount, setLeadCount] = useState('10')
  const [customPromptDetails, setCustomPromptDetails] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (data) {
      setLeads(data.leads)
      setCriteria(data.campaign.targetAudience)
    }
  }, [data])

  const filtered = statusFilter === 'all' ? leads : leads.filter((l) => l.status === statusFilter)

  const pipelineData = [
    { stage: 'New', count: leads.filter((l) => l.status === 'new').length },
    { stage: 'Reviewed', count: leads.filter((l) => l.status === 'reviewed').length },
    { stage: 'Contacted', count: leads.filter((l) => l.status === 'contacted').length },
    { stage: 'Replied', count: leads.filter((l) => l.status === 'replied').length },
    { stage: 'Qualified', count: leads.filter((l) => l.status === 'qualified').length },
  ]

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: Number(leadCount) || 10,
          criteria: criteria.trim() || undefined,
          customPromptDetails: customPromptDetails.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Lead generation failed')
      setLeads(json.data.leads)
      await refresh()
      toast.success(`Found ${json.data.leads.length} leads${json.data.live ? ' (OpenAI)' : ' (demo)'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate leads')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Lead Finder</h1>
          <p className="text-muted-foreground text-sm">
            {leads.length} leads discovered · {leads.filter((l) => l.status === 'qualified').length} qualified
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => void handleGenerate()} disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            Find Leads
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lead search settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-count">Number of leads</Label>
              <Input
                id="lead-count"
                type="number"
                min={1}
                max={25}
                value={leadCount}
                onChange={(e) => setLeadCount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="lead-criteria">Targeting criteria</Label>
              <Textarea
                id="lead-criteria"
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                rows={2}
                placeholder="Ideal customer profile, industries, roles, company size..."
              />
            </div>
          </div>
          <CustomPromptPanel
            value={customPromptDetails}
            onChange={setCustomPromptDetails}
            description="Manual lead criteria — roles, company size, industries, platforms, exclusion rules."
            placeholder="e.g. Target ops managers at 10–200 employee SaaS companies in Japan, prioritize LinkedIn, exclude agencies..."
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Lead Pipeline</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={pipelineData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users /> Top Leads</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {leads.filter((l) => l.score >= 90).slice(0, 3).map((lead) => (
              <LeadScoreCard key={lead.id} lead={lead} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Leads</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Profile</th>
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-4 font-medium">Platform</th>
                <th className="pb-2 pr-4 font-medium">Match Reason</th>
                <th className="pb-2 pr-4 font-medium">Score</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-border/50">
                  <td className="py-2.5 pr-4 font-medium">
                    {lead.profileUrl ? (
                      <a
                        href={lead.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-violet-300 inline-flex items-center gap-1"
                      >
                        {lead.name}
                      </a>
                    ) : (
                      lead.name
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    {lead.profileUrl ? (
                      <a
                        href={lead.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-300 hover:underline inline-flex items-center gap-1 max-w-[160px] truncate"
                      >
                        View profile
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">{lead.company}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{lead.role}</td>
                  <td className="py-2.5 pr-4 capitalize">{lead.platform}</td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground max-w-[180px] truncate">{lead.matchReason}</td>
                  <td className="py-2.5 pr-4">
                    <Badge variant="outline" className={lead.score >= 90 ? 'text-emerald-400' : ''}>{lead.score}</Badge>
                  </td>
                  <td className="py-2.5 capitalize text-xs">{lead.status.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  )
}
