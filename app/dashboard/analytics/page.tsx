'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ROIChart } from '@/components/analytics/roi-chart'
import { useWorkspace } from '@/hooks/use-workspace'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Clock, DollarSign, TrendingUp, Zap, Users, Target } from 'lucide-react'

const postsConfig = { count: { label: 'Posts', color: 'var(--chart-1)' } } satisfies ChartConfig
const leadsConfig = { avgScore: { label: 'Avg Score', color: 'var(--chart-2)' } } satisfies ChartConfig
const agentConfig = { tasks: { label: 'Tasks', color: 'var(--chart-3)' } } satisfies ChartConfig
const platformConfig = { engagement: { label: 'Engagement %', color: 'var(--chart-4)' } } satisfies ChartConfig

export default function AnalyticsPage() {
  const { data, loading } = useWorkspace()

  if (loading || !data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading analytics...</div>
  }

  const roi = data.roi

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">ROI Analytics</h1>
        <p className="text-muted-foreground text-sm">Productivity impact and campaign performance metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Weekly Hours Saved', value: `${roi.weeklyHoursSaved}h`, icon: Clock },
          { label: 'Monthly Cost Saved', value: `$${roi.monthlyCostSaved}`, icon: DollarSign },
          { label: 'Manual Tasks Reduced', value: `${roi.manualTasksReduced}%`, icon: Zap },
          { label: 'Content Output', value: `+${roi.contentOutputIncrease}%`, icon: TrendingUp },
          { label: 'Lead Research Speed', value: `+${roi.leadResearchImprovement}%`, icon: Users },
          { label: 'Campaign Speed', value: `+${roi.campaignSpeedImprovement}%`, icon: Target },
        ].map((m) => (
          <Card key={m.label} className="bg-card/60">
            <CardContent className="p-4">
              <m.icon className="text-muted-foreground mb-2" />
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className="text-xl font-display">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ROIChart data={roi} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posts Generated</CardTitle>
            <CardDescription>Weekly content output</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={postsConfig} className="h-[280px] w-full">
              <BarChart data={roi.postsGenerated}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Lead Score Trend</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={leadsConfig} className="h-[220px] w-full">
              <LineChart data={roi.leadScores}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={30} domain={[60, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="avgScore" stroke="var(--color-avgScore)" strokeWidth={2} dot />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Agent Productivity</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={agentConfig} className="h-[220px] w-full">
              <BarChart data={roi.agentProductivity} layout="vertical">
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="agent" tickLine={false} axisLine={false} width={70} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="tasks" fill="var(--color-tasks)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Platform Performance</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={platformConfig} className="h-[220px] w-full">
              <BarChart data={roi.platformPerformance}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="platform" tickLine={false} axisLine={false} className="text-[10px]" />
                <YAxis tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="engagement" fill="var(--color-engagement)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
