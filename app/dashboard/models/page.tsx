'use client'

import { useEffect, useState } from 'react'
import { ModelCard } from '@/components/models/model-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getModelPerformance } from '@/lib/models'
import { useWorkspace } from '@/hooks/use-workspace'
import type { ModelRouting } from '@/types'
import { toast } from 'sonner'

export default function ModelsPage() {
  const { data, loading, patch } = useWorkspace()
  const [routing, setRouting] = useState<ModelRouting[]>([])
  const perf = getModelPerformance()

  useEffect(() => {
    if (data?.modelRouting) setRouting(data.modelRouting)
  }, [data?.modelRouting])

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch('/api/models/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultModelId: id }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      await patch({ models: json.data.models })
      toast.success('Default model updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update model')
    }
  }

  if (loading || !data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading models...</div>
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Model Hub</h1>
        <p className="text-muted-foreground text-sm">
          AI model management and task routing — assignments drive every agent and generation task
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Avg Response', value: perf.avgResponseTime },
          { label: 'Est. Cost', value: perf.estimatedCost },
          { label: 'Success Rate', value: `${perf.successRate}%` },
          { label: 'Content Quality', value: `${perf.contentQualityScore}/100` },
          { label: 'Lead Quality', value: `${perf.leadQualityScore}/100` },
        ].map((m) => (
          <Card key={m.label} className="bg-card/60">
            <CardContent className="p-4 text-center">
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
              <p className="text-lg font-display mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {data.models.map((model) => (
          <ModelCard key={model.id} model={model} onSetDefault={(id) => void handleSetDefault(id)} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Routing Table</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Task Type</th>
                <th className="pb-2 pr-4 font-medium">Assigned Model</th>
                <th className="pb-2 pr-4 font-medium">Fallback</th>
                <th className="pb-2 pr-4 font-medium">Temp</th>
                <th className="pb-2 pr-4 font-medium">Max Tokens</th>
                <th className="pb-2 pr-4 font-medium">Cost Est.</th>
                <th className="pb-2 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {routing.map((r) => (
                <tr key={r.taskType} className="border-b border-border/50">
                  <td className="py-2.5 pr-4">{r.taskType}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{r.assignedModel}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{r.fallbackModel}</td>
                  <td className="py-2.5 pr-4">{r.temperature}</td>
                  <td className="py-2.5 pr-4">{r.maxTokens}</td>
                  <td className="py-2.5 pr-4 text-xs">{r.costEstimate}</td>
                  <td className="py-2.5">
                    <Badge variant="outline" className="text-[10px] capitalize">{r.qualityPriority}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-4">
            Live fallback: if the assigned model fails, agents automatically try the fallback, then the
            OpenRouter open-source layer stack, then Kimi. Video uses OpenRouter budget models → PixVerse.
            Images use OpenRouter budget chain → Pollinations Flux (true free). OpenRouter has no $0
            dedicated image/video models — budget = cheapest paid.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
