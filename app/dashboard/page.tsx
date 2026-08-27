'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
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
  ImageIcon,
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
  const previewDrafts = data.contentDrafts.slice(0, 3)
  const previewImages = (data.generatedImages ?? []).slice(0, 4)
  const previewVideos = (data.generatedVideos ?? []).slice(0, 2)
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

  const completedAgents = agents.filter((a) => a.status === 'completed').length
  const successfulPublishes = publishLogs.filter((log) => log.status === 'success').length
  const demoFlow = [
    {
      label: 'Campaign setup',
      href: '/dashboard/campaign-builder',
      icon: Target,
      metric: campaign.status === 'active' ? 'Active' : 'Draft',
      detail: 'Offer, audience, ICP, channels, and campaign goal are ready for the agent run.',
      status: 'Start here',
      tone: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
    },
    {
      label: 'Research scan',
      href: '/dashboard/research',
      icon: Sparkles,
      metric: data.research ? `${data.research.opportunityScore} score` : 'Ready',
      detail: 'Market signals and competitor gaps become angles the strategy agent can use.',
      status: 'Insight',
      tone: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    },
    {
      label: 'Agent workflow',
      href: '/dashboard/agents',
      icon: Bot,
      metric: `${completedAgents}/${agents.length || workflowSteps.length} done`,
      detail: 'The full agent chain moves work from plan to content, video, outreach, and analytics.',
      status: activeAgents.length ? 'Live now' : 'Standby',
      tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    },
    {
      label: 'Content studio',
      href: '/dashboard/content',
      icon: FileText,
      metric: `${data.contentDrafts.length} drafts`,
      detail: 'Generated posts, hooks, captions, and channel variants are ready to review.',
      status: 'Create',
      tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
    },
    {
      label: 'Image generation',
      href: '/dashboard/image',
      icon: ImageIcon,
      metric: `${data.generatedImages?.length ?? 0} images`,
      detail: 'Poster, ad, and social creative generation proves the visual part of the demo.',
      status: 'Visuals',
      tone: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
    },
    {
      label: 'Video assets',
      href: '/dashboard/video',
      icon: Video,
      metric: `${data.videoScripts.length} scripts`,
      detail: 'Video briefs and scripts convert campaign angles into demo-ready creative.',
      status: 'Media',
      tone: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    },
    {
      label: 'Approve queue',
      href: '/dashboard/approval',
      icon: CheckSquare,
      metric: `${pendingApprovals} reviews`,
      detail: 'Human review keeps the demo safe before posts move into publishing.',
      status: pendingApprovals ? 'Review' : 'Clear',
      tone: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    },
    {
      label: 'Leads and outreach',
      href: '/dashboard/leads',
      icon: Users,
      metric: `${leads.length} leads`,
      detail: 'Prospects, scores, and outbound actions show how content turns into pipeline.',
      status: 'Convert',
      tone: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200',
    },
    {
      label: 'Proof and ROI',
      href: '/dashboard/analytics',
      icon: TrendingUp,
      metric: `${roi.weeklyHoursSaved}h saved`,
      detail: `${successfulPublishes} publish logs and performance metrics close the demo story.`,
      status: 'Measure',
      tone: 'border-lime-500/30 bg-lime-500/10 text-lime-200',
    },
  ]

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

      {/* Demo working flow */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl dash-card p-5 md:p-6"
      >
        <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/35 bg-emerald-500/10 text-emerald-300">
                  <Sparkles data-icon="inline-start" className="size-3" />
                  Full demo flow
                </Badge>
                <Badge variant="outline" className="border-violet-500/35 text-violet-300">
                  {completedAgents}/{agents.length || workflowSteps.length} agents updated
                </Badge>
                <Badge variant="outline" className="border-blue-500/35 text-blue-300">
                  {data.contentDrafts.length + data.videoScripts.length + (data.generatedImages?.length ?? 0)} assets generated
                </Badge>
              </div>
              <h2 className="section-title">Demo Working Flow</h2>
              <p className="section-subtitle mt-1 max-w-2xl">
                A single walkthrough for demos: setup the campaign, run agents, review creative, publish, then prove the ROI.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {showQuickDemo && (
                <QuickDemoStart size="sm" label="Load Demo" className="rounded-xl" />
              )}
              <Button asChild size="sm" variant="outline" className="rounded-xl border-violet-500/30">
                <Link href="/dashboard/agents">
                  <Zap data-icon="inline-start" />
                  Run Full Workflow
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative h-2 overflow-hidden rounded-full bg-secondary/60">
            <motion.div
              initial={{ width: '12%' }}
              animate={{ width: `${Math.min(100, Math.max(24, (completedAgents / Math.max(agents.length, 1)) * 100))}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400"
            />
            <motion.div
              aria-hidden="true"
              animate={{ x: ['-20%', '120%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-y-0 left-0 w-1/3 bg-white/25 blur-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/40 bg-border/30 sm:grid-cols-2 xl:grid-cols-3">
            {demoFlow.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.06 * index, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={step.href}
                    className="group relative flex min-h-[11rem] flex-col bg-background/60 p-4 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl border', step.tone)}>
                        <Icon className="size-5" />
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[11px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                        <p className="mt-1 rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                          {step.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-base font-semibold leading-tight">{step.label}</p>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <span className="min-w-0 truncate rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground/90 ring-1 ring-border/40">
                        {step.metric}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-violet-300 group-hover:text-violet-200">
                        Open <ArrowUpRight className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* Content previews */}
      <section className="dash-card overflow-hidden p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/35 bg-cyan-500/10 text-cyan-300">
                <Sparkles data-icon="inline-start" className="size-3" />
                Review before you open a Studio
              </Badge>
            </div>
            <h2 className="section-title">Content Preview</h2>
            <p className="section-subtitle mt-1">Posts, posters, and video assets from this campaign in one review surface.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href="/dashboard/content">Open Content Studio <ArrowUpRight className="size-3.5" /></Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="rounded-xl">
              <Link href="/dashboard/library">View Library <ArrowUpRight className="size-3.5" /></Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-emerald-300" />
                <h3 className="text-sm font-semibold">Social posts</h3>
              </div>
              <Badge variant="secondary" className="text-[11px]">{data.contentDrafts.length} drafts</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {previewDrafts.map((draft) => (
                <article key={draft.id} className="rounded-xl border border-border/40 bg-background/45 p-4 transition-colors hover:border-emerald-400/30 hover:bg-background/65">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Badge variant="outline" className="capitalize text-[11px]">{draft.platform}</Badge>
                    <span className="text-[11px] capitalize text-muted-foreground">{draft.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm font-semibold leading-snug">{draft.hook}</p>
                  <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">{draft.mainCopy}</p>
                  <p className="mt-3 text-xs font-medium text-emerald-300">{draft.cta}</p>
                  {draft.hashtags.length > 0 && <p className="mt-2 line-clamp-1 text-[11px] text-muted-foreground">{draft.hashtags.join(' ')}</p>}
                </article>
              ))}
              {previewDrafts.length === 0 && <p className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">Run the Content Agent to preview posts here.</p>}
            </div>
          </div>

          <div className="min-w-0 xl:col-span-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-sky-300" />
                <h3 className="text-sm font-semibold">Poster previews</h3>
              </div>
              <Badge variant="secondary" className="text-[11px]">{previewImages.length} shown</Badge>
            </div>
            {previewImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {previewImages.map((image) => (
                  <Link key={image.id} href="/dashboard/image" className="group overflow-hidden rounded-xl border border-border/40 bg-background/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70">
                    <div className="aspect-square overflow-hidden bg-secondary/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.imageUrl} alt={image.prompt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs font-medium">{image.prompt}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{image.model} · {image.aspectRatio}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Link href="/dashboard/image" className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-background/25 p-6 text-center transition-colors hover:border-sky-400/40 hover:bg-sky-500/5">
                <ImageIcon className="mb-3 size-7 text-sky-300/70" />
                <p className="text-sm font-medium">No posters yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Generate a 4–5 poster set in Image Studio.</p>
              </Link>
            )}
          </div>

          <div className="min-w-0 xl:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-rose-300" />
                <h3 className="text-sm font-semibold">Video previews</h3>
              </div>
              <Badge variant="secondary" className="text-[11px]">{data.generatedVideos?.length ?? 0} assets</Badge>
            </div>
            <div className="flex flex-col gap-3">
              {previewVideos.map((video) => (
                <Link key={video.id} href="/dashboard/video" className="group overflow-hidden rounded-xl border border-border/40 bg-background/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70">
                  {video.videoUrl ? (
                    <video src={video.videoUrl} muted controls className="aspect-video w-full bg-black object-cover" aria-label={`Preview of ${video.prompt}`} />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-rose-500/15 via-violet-500/10 to-background text-xs text-muted-foreground">Video processing</div>
                  )}
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-medium">{video.prompt}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{video.model} · {video.duration}s</p>
                  </div>
                </Link>
              ))}
              {previewVideos.length === 0 && <Link href="/dashboard/video" className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-background/25 p-6 text-center transition-colors hover:border-rose-400/40 hover:bg-rose-500/5"><Video className="mb-3 size-7 text-rose-300/70" /><p className="text-sm font-medium">No videos yet</p><p className="mt-1 text-xs text-muted-foreground">Generate scripts or a campaign video.</p></Link>}
            </div>
          </div>
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
