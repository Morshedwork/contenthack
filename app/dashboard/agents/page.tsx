'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bot, Pause, Play, Plus, Search, Trash2 } from 'lucide-react'
import { agents as seedAgents, type Agent } from '@/lib/dashboard-data'

const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1']
const types = ['Data Pipeline', 'Machine Learning', 'Data Collection', 'Analytics']

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(seedAgents)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: types[0], region: regions[0] })

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.type.toLowerCase().includes(query.toLowerCase()),
  )

  const toggleStatus = (name: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.name === name
          ? { ...a, status: a.status === 'running' ? 'idle' : 'running' }
          : a,
      ),
    )
  }

  const removeAgent = (name: string) => {
    setAgents((prev) => prev.filter((a) => a.name !== name))
  }

  const deployAgent = () => {
    if (!form.name.trim()) return
    setAgents((prev) => [
      { name: form.name.trim(), type: form.type, region: form.region, status: 'running', tasks: 0 },
      ...prev,
    ])
    setForm({ name: '', type: types[0], region: regions[0] })
    setOpen(false)
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display tracking-tight text-foreground mb-1">Agents</h1>
          <p className="text-muted-foreground">
            {agents.length} {agents.length === 1 ? 'agent' : 'agents'} deployed across your regions
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Deploy New Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Deploy New Agent</DialogTitle>
              <DialogDescription>Configure and deploy a new compute agent.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent name</Label>
                <Input
                  id="agent-name"
                  placeholder="e.g. Data Processor Beta"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
                Cancel
              </Button>
              <Button
                onClick={deployAgent}
                disabled={!form.name.trim()}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full"
              >
                Deploy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-foreground/10 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">
              {agents.length === 0 ? 'No agents deployed yet' : 'No agents match your search'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {agents.length === 0
                ? 'Deploy your first agent to get started.'
                : 'Try a different search term.'}
            </p>
            {agents.length === 0 && (
              <Button
                onClick={() => setOpen(true)}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Deploy New Agent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <Card key={agent.name} className="bg-card border-border">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-foreground/10 rounded-lg flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium">{agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{agent.type}</p>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    agent.status === 'running'
                      ? 'bg-green-500/10 text-green-500'
                      : agent.status === 'idle'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {agent.status}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-muted-foreground">{agent.tasks} tasks</span>
                  <span className="text-muted-foreground font-mono text-xs">{agent.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full flex-1"
                    onClick={() => toggleStatus(agent.name)}
                    disabled={agent.status === 'error'}
                  >
                    {agent.status === 'running' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 mr-1.5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => removeAgent(agent.name)}
                    aria-label={`Delete ${agent.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
