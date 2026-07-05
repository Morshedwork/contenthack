'use client'

import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { WorkflowPipeline } from '@/components/agents/workflow-pipeline'
import { CalendarPostCard } from '@/components/calendar/calendar-post-card'
import { LeadScoreCard } from '@/components/leads/lead-score-card'
import { PublishLogTable } from '@/components/dashboard/publish-log-table'
import { OverviewSkeleton } from '@/components/dashboard/overview-skeleton'
import { QuickDemoStart } from '@/components/demo/quick-demo-start'
import { isInvestorPitchCampaign } from '@/lib/demo/investor-pitch'
import { workflowSteps } from '@/lib/demo/data'
import { useWorkspace } from '@/hooks/use-workspace'
import {
  ArrowUpRight,
  Bot,
  CheckSquare,
  Clock,
  FileText,
  MessageSquare,
  Mic,
  Megaphone,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const perfConfig = {
  count: { label: 'Posts', color: 'var(--chart-1)' },
} satisfies ChartConfig

const heroStats = [
  { key: 'hours', label: 'Hours saved', icon: Clock, tint: 'text-emerald-300' },
  { key: 'posts', label: 'Posts generated', icon: FileText, tint: 'text-violet-300' },
  { key: 'leads', label: 'Leads found', icon: Users, tint: 'text-blue-300' },
  { key: 'agents', label: 'Agents active', icon: Bot, tint: 'text-amber-300' },
] as const

const quickLinks = [
  { label: 'Text Chat', href: '/dashboard/chat', icon: MessageSquare, desc: 'Type prompts & run agents', tint: 'from-violet-500/20 to-violet-500/5 border-violet-500/25' },
  { label: 'Live Voice', href: '/dashboard/voice', icon: Mic, desc: 'Speak to your AI agent', tint: 'from-rose-500/20 to-rose-500/5 border-rose-500/25' },
  { label: 'Content Studio', href: '/dashboard/content', icon: FileText, desc: 'Generate posts', tint: 'from-blue-500/20 to-blue-500/5 border-blue-500/25' },
  { label: 'Lead Finder', href: '/dashboard/leads', icon: Users, desc: 'Discover prospects', tint: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/25' },
  { label: 'Approve & Publish', href: '/dashboard/approval', icon: CheckSquare, desc: 'Review & publish', tint: 'from-amber-500/20 to-amber-500/5 border-amber-500/25' },
]

function getWorkflowActiveIndex(agents: { status: string }[]): number {
  const running = agents.findIndex((a) => a.status === 'running')
  if (running >= 0) return running
  const completed = agents.filter((a) => a.status === 'completed').length
  return Math.min(completed, workflowSteps.length - 1)
}

function agentStatusColor(status: string) {
  switch (status) {
    case 'running': return 'bg-violet-500/20 text-violet-300 border-violet-500/30'
    case 'completed': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
    case 'waiting_for_approval': return 'bg-amber-500/15 text-amber-300 border-amber-500/25'
    case 'failed': return 'bg-red-500/15 text-red-300 border-red-500/25'
    default: return 'bg-secondary/50 text-muted-foreground border-border/50'
  }
}

export default function OverviewPage() {
  const { data, loading } = useWorkspace()

  if (loading || !data) {
    return <OverviewSkeleton />
  }

  const { overviewKPIs, roi, agents, calendarPosts, topics, leads, publishLogs, campaign, approvalItems, tasks } = data
  const topicTitles = topics.length ? topics.map((t) => t.title) : []
  const activeAgents = agents.filter((a) => a.status === 'running' || a.status === 'waiting_for_approval')
  const pendingApprovals = approvalItems.filter((a) => a.status === 'needs_review').length
  const pipelineIndex = getWorkflowActiveIndex(agents)
  const showQuickDemo = !isInvestorPitchCampaign(campaign.id)

  const heroValues = {
    hours: `${roi.weeklyHoursSaved}h`,
    posts: String(data.contentDrafts.length),
    leads: String(leads.length),
    agents: String(activeAgents.length),
  }

  const primaryKPIs = overviewKPIs.slice(0, 4)
  const secondaryKPIs = overviewKPIs.slice(4)

  return (
    <div className="flex flex-col gap-6 content-enter">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl dash-card p-6 md:p-8">
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 size-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className="bg-violet-500/20 text-violet-200 border-violet-500/30 hover:bg-violet-500/25">
                <Sparkles data-icon="inline-start" className="size-3" />
                {campaign.status === 'active' ? 'Active Campaign' : 'Draft Campaign'}
              </Badge>
              {activeAgents.length > 0 && (
                <Badge variant="outline" className="status-live border-emerald-500/40 text-emerald-300 text-xs">
                  {activeAgents.length} agent{activeAgents.length !== 1 ? 's' : ''} live
                </Badge>
              )}
              {pendingApprovals > 0 && (
                <Badge asChild variant="outline" className="border-amber-500/40 text-amber-300 text-xs cursor-pointer hover:bg-amber-500/10">
                  <Link href="/dashboard/approval">
                    <AlertCircle data-icon="inline-start" className="size-3" />
                    {pendingApprovals} need review
                  </Link>
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-display tracking-tight leading-tight">
              {campaign.companyName ? (
                <>
                  <span className="text-gradient-brand">{campaign.companyName}</span>
                  <span className="text-muted-foreground font-sans text-xl md:text-2xl font-normal ml-2">Command Center</span>
                </>
              ) : (
                'Welcome to ContentOps'
              )}
            </h1>
            <p className="text-base text-muted-foreground mt-3 max-w-xl leading-relaxed">
              {isInvestorPitchCampaign(campaign.id) ? (
                <>
                  AI agents for content, social media, and sales — research, create, publish, and convert from one dashboard.
                  {' '}Agents saved <span className="text-emerald-300 font-medium">{roi.weeklyHoursSaved} hours</span> this week.
                </>
              ) : (
                <>
                  {campaign.campaignGoal || 'Configure your campaign to get started.'}
                  {' '}Agents saved <span className="text-emerald-300 font-medium">{roi.weeklyHoursSaved} hours</span> this week.
                </>
              )}
            </p>

            <div className="flex flex-wrap gap-3 mt-5">
              {showQuickDemo && (
                <QuickDemoStart size="default" className="rounded-xl" />
              )}
              <Button asChild className="rounded-xl" variant={showQuickDemo ? 'outline' : 'default'}>
                <Link href="/dashboard/chat">
                  <MessageSquare data-icon="inline-start" />
                  Ask AI to run agents
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-violet-500/30">
                <Link href="/dashboard/agents">
                  <Zap data-icon="inline-start" />
                  Run Workflow
                </Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-xl">
                <Link href="/dashboard/campaign-builder">
                  <Target data-icon="inline-start" />
                  Edit Campaign
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero stat pills */}
          <div className="grid grid-cols-2 gap-3 shrink-0 w-full lg:w-auto lg:min-w-[300px]">
            {heroStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.key}
                  className="rounded-xl border border-border/40 bg-background/30 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={cn('size-4', stat.tint)} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-display leading-none">{heroValues[stat.key]}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative mt-6 pt-5 border-t border-border/30">
          <div className="flex items-center justify-between mb-3">
            <p className="label-caps">Pipeline Progress</p>
            <Link href="/dashboard/agents" className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1">
              View all agents <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <WorkflowPipeline steps={workflowSteps} activeIndex={pipelineIndex} compact />
        </div>
      </section>

      {/* Quick nav bento */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'group dash-card dash-card-interactive p-5 bg-gradient-to-br border',
              link.tint,
            )}
          >
            <link.icon className="size-6 text-foreground/80 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-base font-medium">{link.label}</p>
            <p className="text-sm text-muted-foreground mt-1">{link.desc}</p>
          </Link>
        ))}
      </section>

      {/* Primary KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryKPIs.map((kpi, i) => (
          <div key={kpi.label} className="dash-card dash-card-interactive p-5 accent-top" style={{ ['--accent-color' as string]: i === 0 ? 'oklch(0.66 0.21 292)' : i === 1 ? 'oklch(0.72 0.16 162)' : i === 2 ? 'oklch(0.66 0.16 240)' : 'oklch(0.79 0.15 75)' }}>
            <p className="text-3xl md:text-4xl font-display leading-none">{kpi.value}</p>
            <p className="text-sm font-medium mt-2.5">{kpi.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
          </div>
        ))}
      </section>

      {/* Chart + ROI bento row */}
      <section className="bento-grid">
        <div className="bento-span-8 dash-card p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="section-title">Campaign Performance</h2>
              <p className="section-subtitle">Posts generated per week</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-sm text-muted-foreground">
              <Link href="/dashboard/analytics">
                Analytics <ArrowUpRight className="size-3 ml-0.5" />
              </Link>
            </Button>
          </div>
          <ChartContainer config={perfConfig} className="h-[260px] w-full">
            <AreaChart data={roi.postsGenerated} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="fillPostsOverview" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} fontSize={13} />
              <YAxis tickLine={false} axisLine={false} width={32} fontSize={13} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} fill="url(#fillPostsOverview)" />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="bento-span-4 dash-card p-6 flex flex-col">
          <div className="flex items-center gap-2.5 mb-5">
            <TrendingUp className="size-5 text-emerald-300" />
            <div>
              <h2 className="section-title">ROI Impact</h2>
              <p className="section-subtitle">This period</p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 flex-1">
            {[
              { label: 'Hours saved / week', value: `${roi.weeklyHoursSaved} hrs`, highlight: true },
              { label: 'Est. cost saved', value: `$${roi.monthlyCostSaved}/mo`, highlight: true },
              { label: 'Content output', value: `+${roi.contentOutputIncrease}%`, highlight: false },
              { label: 'Campaign speed', value: `+${roi.campaignSpeedImprovement}%`, highlight: false },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-background/30 px-4 py-3 border border-border/30">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={cn('text-base font-medium', row.highlight ? 'text-emerald-300' : '')}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operations bento */}
      <section className="bento-grid">
        <div className="bento-span-4 dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Bot className="size-5 text-violet-300" />
              Agent Activity
            </h2>
            <Badge variant="outline" className="text-xs">{agents.filter((a) => a.status !== 'idle').length} active</Badge>
          </div>
          <div className="flex flex-col gap-2.5">
            {(activeAgents.length ? activeAgents : agents.filter((a) => a.lastOutput).slice(0, 4)).slice(0, 5).map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 rounded-xl bg-background/25 border border-border/25 p-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                  <Bot className="size-4 text-violet-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.lastOutput || agent.currentTask}</p>
                </div>
                <Badge variant="outline" className={cn('text-xs capitalize shrink-0 border', agentStatusColor(agent.status))}>
                  {agent.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-span-4 dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Megaphone className="size-5 text-blue-300" />
              Upcoming Posts
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs px-3">
              <Link href="/dashboard/calendar">Calendar</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-2.5">
            {calendarPosts.slice(0, 4).map((post) => (
              <CalendarPostCard key={post.id} post={post} compact />
            ))}
            {calendarPosts.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No posts scheduled yet</p>
            )}
          </div>
        </div>

        <div className="bento-span-4 dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <FileText className="size-5 text-emerald-300" />
              Top Topics
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs px-3">
              <Link href="/dashboard/content">Studio</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {topicTitles.slice(0, 5).map((topic, i) => (
              <div key={topic} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-background/30 transition-colors group">
                <span className="flex size-6 items-center justify-center rounded-md bg-violet-500/10 text-xs font-mono text-violet-300">
                  {i + 1}
                </span>
                <span className="text-sm truncate group-hover:text-foreground transition-colors">{topic}</span>
              </div>
            ))}
            {topicTitles.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Run Strategy agent to generate topics</p>
            )}
          </div>
        </div>
      </section>

      {/* Secondary KPIs strip */}
      <section className="dash-card p-5">
        <p className="label-caps mb-4 px-1">All Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-x-5 gap-y-4">
          {secondaryKPIs.map((kpi) => (
            <div key={kpi.label} className="px-1">
              <p className="text-xl font-display leading-none">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5 truncate">{kpi.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom row: leads + logs + recent tasks */}
      <section className="bento-grid">
        <div className="bento-span-6 dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Users className="size-5 text-violet-300" />
              Top Leads
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs px-3">
              <Link href="/dashboard/leads">View all</Link>
            </Button>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {leads.filter((l) => l.score >= 85).slice(0, 4).map((lead) => (
              <LeadScoreCard key={lead.id} lead={lead} />
            ))}
            {leads.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2 py-6 text-center">Run Lead Finder to discover prospects</p>
            )}
          </div>
        </div>

        <div className="bento-span-6 dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Send className="size-5 text-blue-300" />
              Recent Activity
            </h2>
          </div>
          <div className="flex min-w-0 flex-col gap-0 divide-y divide-border/30">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className={cn(
                  'size-2 shrink-0 rounded-full',
                  task.status === 'completed' ? 'bg-emerald-400' :
                  task.status === 'running' ? 'bg-violet-400 animate-pulse' :
                  task.status === 'waiting_for_approval' ? 'bg-amber-400' : 'bg-muted-foreground/40',
                )} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.assignedAgent}</p>
                </div>
                <span className="hidden shrink-0 text-xs text-emerald-400/80 sm:inline">{task.estimatedTimeSaved}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Publish logs */}
      {publishLogs.length > 0 && (
        <section className="dash-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <Video className="size-5 text-blue-300" />
              Publish Logs
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-sm">
              <Link href="/dashboard/approval?tab=publishing">Approve & Publish</Link>
            </Button>
          </div>
          <PublishLogTable logs={publishLogs.slice(0, 5)} />
        </section>
      )}
    </div>
  )
}
