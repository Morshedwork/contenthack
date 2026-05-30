'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AgentCard } from './agent-card'
import { WorkflowPipeline } from './workflow-pipeline'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { demoAgents, workflowSteps } from '@/lib/demo/data'
import { fetchAgentStatus, runAgent, runFullWorkflow } from '@/lib/agents/client'
import { getAgentViewLinkByName } from '@/lib/agents/view-links'
import type { AgentDefinition, AgentTask } from '@/types'
import { Download, Loader2, Pause, Play, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export function CommandCenter() {
  const [agents, setAgents] = useState<AgentDefinition[]>(demoAgents)
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null)
  const [customPromptDetails, setCustomPromptDetails] = useState('')

  const loadStatus = useCallback(async () => {
    try {
      const { agents: nextAgents, tasks: nextTasks } = await fetchAgentStatus()
      setAgents(nextAgents)
      setTasks(nextTasks)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const activeIndex = agents.findIndex((a) => a.status === 'running')
  const pipelineActive = activeIndex >= 0 ? activeIndex : agents.filter((a) => a.status === 'completed').length

  const handleRunAll = async () => {
    setRunning(true)
    try {
      const result = await runFullWorkflow(customPromptDetails.trim() || undefined)
      setAgents(result.agents)
      toast.success(`Workflow ${result.workflowId} — saved ~${result.estimatedTimeSaved}${result.live ? ' (OpenAI)' : ''}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Workflow failed')
    } finally {
      setRunning(false)
    }
  }

  const handleRunAgent = async (id: string) => {
    setRunningAgentId(id)
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'running' as const } : a)),
    )
    try {
      const { agent: updated, live } = await runAgent(id, customPromptDetails.trim() || undefined)
      setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)))
      toast.success(`${updated.name} — ${updated.progress}%`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Agent run failed')
      await loadStatus()
    } finally {
      setRunningAgentId(null)
    }
  }

  const handleReset = async () => {
    setRunning(false)
    setLoading(true)
    try {
      await fetch('/api/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset' }) })
      await loadStatus()
      toast('Agents reset to demo defaults')
    } catch {
      toast.error('Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <CustomPromptPanel
        value={customPromptDetails}
        onChange={setCustomPromptDetails}
        description="Global manual instructions applied to every agent run and full workflow execution."
        placeholder="e.g. Focus on Japan SME market, emphasize free audit offer, keep all outputs under 200 words, avoid competitor mentions..."
      />

      <Card className="glass-panel border-0">
        <CardHeader>
          <CardTitle className="text-base">Multi-Agent Workflow Canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowPipeline steps={workflowSteps} activeIndex={pipelineActive} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handleRunAll()} disabled={running || loading}>
          {running ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Play data-icon="inline-start" />}
          Run Full Workflow
        </Button>
        <Button variant="outline" disabled={running || loading}>
          <Play data-icon="inline-start" />
          Run Selected Agents
        </Button>
        <Button variant="outline" disabled={running} onClick={() => toast.info('Workflow paused')}>
          <Pause data-icon="inline-start" />
          Pause Workflow
        </Button>
        <Button variant="outline" onClick={() => void handleReset()} disabled={loading || running}>
          <RotateCcw data-icon="inline-start" />
          Reset Demo
        </Button>
        <Button variant="outline" onClick={() => toast.success('Report exported')}>
          <Download data-icon="inline-start" />
          Export Report
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading agents…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              disabled={running || runningAgentId === agent.id}
              onRun={(id) => void handleRunAgent(id)}
              onPause={(id) => toast.info(`Agent ${id} paused`)}
              onViewLogs={(id) => toast.info(`Opening logs for ${id}`)}
            />
          ))}
        </div>
      )}

      <Card className="glass-panel border-0">
        <CardHeader>
          <CardTitle className="text-base">Task Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Task</th>
                  <th className="pb-2 pr-4 font-medium">Agent</th>
                  <th className="pb-2 pr-4 font-medium">Priority</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Created</th>
                  <th className="pb-2 pr-4 font-medium">Time Saved</th>
                  <th className="pb-2 pr-4 font-medium">Preview</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const viewLink = task.status === 'completed' ? getAgentViewLinkByName(task.assignedAgent) : undefined
                  return (
                  <tr key={task.id} className="border-b border-border/50">
                    <td className="py-2.5 pr-4">{task.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{task.assignedAgent}</td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className="text-[10px] capitalize">{task.priority}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 capitalize text-xs">{task.status.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pr-4 text-emerald-400 text-xs">{task.estimatedTimeSaved}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground max-w-[200px] truncate">{task.outputPreview}</td>
                    <td className="py-2.5">
                      {viewLink ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={viewLink.href}>View</Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
