import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bot,
  Cpu,
  Globe,
  Plus,
  Settings,
  BarChart3,
  Server,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { stats, agents, recentActivity } from '@/lib/dashboard-data'

const quickActions = [
  { icon: Cpu, label: 'New Agent', href: '/dashboard/agents' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Server, label: 'Infra', href: '/dashboard/analytics' },
  { icon: Shield, label: 'Security', href: '/dashboard/settings' },
  { icon: Globe, label: 'Regions', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function OverviewPage() {
  return (
    <>
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display tracking-tight text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground">
            Your agents processed 1,847 tasks in the last 24 hours
          </p>
        </div>
        <Button asChild className="bg-foreground text-background hover:bg-foreground/90 rounded-full">
          <Link href="/dashboard/agents">
            <Plus className="w-4 h-4 mr-2" />
            Deploy New Agent
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-display tracking-tight text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className="w-10 h-10 bg-foreground/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display">Active Agents</CardTitle>
                <CardDescription>Manage your deployed agents</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/dashboard/agents">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.slice(0, 4).map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-foreground/10 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-foreground">{agent.tasks} tasks</p>
                        <p className="text-xs text-muted-foreground">{agent.region}</p>
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Recent Activity</CardTitle>
              <CardDescription>Latest events from your agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-foreground/40 rounded-full mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.agent} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <action.icon className="w-5 h-5 text-foreground" />
                    <span className="text-xs text-muted-foreground">{action.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
