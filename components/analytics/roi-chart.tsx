'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { ROIReport } from '@/types'

const chartConfig = {
  before: { label: 'Before (min)', color: 'var(--chart-3)' },
  after: { label: 'After (min)', color: 'var(--chart-1)' },
} satisfies ChartConfig

interface ROIChartProps {
  data: ROIReport
}

export function ROIChart({ data }: ROIChartProps) {
  const chartData = data.beforeAfter.map((item) => ({
    task: item.task.split(' ').slice(0, 2).join(' '),
    before: parseInt(item.before) || parseFloat(item.before) * 60,
    after: parseInt(item.after) || parseFloat(item.after) * 60,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Before vs After Time</CardTitle>
        <CardDescription>Minutes per week per task category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="task" tickLine={false} axisLine={false} tickMargin={8} className="text-[10px]" />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="before" fill="var(--color-before)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="after" fill="var(--color-after)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
