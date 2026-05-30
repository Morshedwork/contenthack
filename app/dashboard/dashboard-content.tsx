'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Activity, 
  Bot, 
  Clock, 
  Cpu, 
  Globe, 
  LogOut, 
  Plus, 
  Settings, 
  Zap,
  BarChart3,
  Server,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface DashboardContentProps {
  user: User
}

const stats = [
  { 
    label: 'Active Agents', 
    value: '12', 
    change: '+2 this week',
    icon: Bot,
    trend: 'up'
  },
  { 
    label: 'Tasks Completed', 
    value: '1,847', 
    change: '+156 today',
    icon: Zap,
    trend: 'up'
  },
  { 
    label: 'Compute Hours', 
    value: '342', 
    change: 'This month',
    icon: Clock,
    trend: 'neutral'
  },
  { 
    label: 'Uptime', 
    value: '99.9%', 
    change: 'Last 30 days',
    icon: Activity,
    trend: 'up'
  },
]

const agents = [
  {
    name: 'Data Processor Alpha',
    status: 'running',
    type: 'Data Pipeline',
    tasks: 234,
    region: 'us-east-1',
  },
  {
    name: 'ML Inference Bot',
    status: 'running',
    type: 'Machine Learning',
    tasks: 1203,
    region: 'eu-west-1',
  },
  {
    name: 'Web Scraper v2',
    status: 'idle',
    type: 'Data Collection',
    tasks: 89,
    region: 'ap-south-1',
  },
  {
    name: 'Report Generator',
    status: 'running',
    type: 'Analytics',
    tasks: 321,
    region: 'us-west-2',
  },
]

const recentActivity = [
  { action: 'Agent deployed', agent: 'ML Inference Bot', time: '2 minutes ago' },
  { action: 'Task completed', agent: 'Data Processor Alpha', time: '5 minutes ago' },
  { action: 'Scaling event', agent: 'Web Scraper v2', time: '12 minutes ago' },
  { action: 'Alert resolved', agent: 'Report Generator', time: '1 hour ago' },
  { action: 'New region added', agent: 'Data Processor Alpha', time: '3 hours ago' },
]

export function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-display tracking-tight text-foreground">COMPUTE</span>
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5">TM</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm text-foreground font-medium">
                  Overview
                </Link>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Agents
                </Link>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </Link>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display tracking-tight text-foreground mb-1">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Your agents processed 1,847 tasks in the last 24 hours
            </p>
          </div>
          <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Deploy New Agent
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
                    <p className="text-3xl font-display tracking-tight text-foreground">
                      {stat.value}
                    </p>
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
                <Button variant="outline" size="sm" className="rounded-full">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
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
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          agent.status === 'running' 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
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
                  {[
                    { icon: Cpu, label: 'New Agent' },
                    { icon: BarChart3, label: 'Analytics' },
                    { icon: Server, label: 'Infra' },
                    { icon: Shield, label: 'Security' },
                    { icon: Globe, label: 'Regions' },
                    { icon: Settings, label: 'Settings' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="flex flex-col items-center gap-2 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <action.icon className="w-5 h-5 text-foreground" />
                      <span className="text-xs text-muted-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
