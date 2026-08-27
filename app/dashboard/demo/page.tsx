'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QuickDemoStart } from '@/components/demo/quick-demo-start'
import { useWorkspace } from '@/hooks/use-workspace'
import { ArrowUpRight, CheckCircle2, FileText, ImageIcon, Loader2, Sparkles, Target, Video } from 'lucide-react'

export default function DemoDashboardPage() {
  const { data, loading } = useWorkspace()

  if (loading || !data) {
    return <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" /> Loading demo workspace…</div>
  }

  const posts = data.contentDrafts
  const images = data.generatedImages ?? []
  const videos = data.generatedVideos ?? []
  const completedAgents = data.agents.filter((agent) => agent.status === 'completed').length
  const steps = [
    { label: 'Set the campaign', detail: 'Define the offer, audience, and goal.', done: Boolean(data.campaign.campaignGoal), href: '/dashboard/campaign-builder' },
    { label: 'Generate content', detail: `${data.contentDrafts.length} social drafts ready to review.`, done: posts.length > 0, href: '/dashboard/content' },
    { label: 'Create visuals', detail: `${images.length} poster previews available.`, done: images.length > 0, href: '/dashboard/image' },
    { label: 'Prepare video', detail: `${data.videoScripts.length} scripts ready for production.`, done: data.videoScripts.length > 0 || videos.length > 0, href: '/dashboard/video' },
    { label: 'Review and publish', detail: `${data.approvalItems.filter((item) => item.status === 'needs_review').length} items need approval.`, done: data.approvalItems.length > 0, href: '/dashboard/approval' },
  ]

  return (
    <div className="flex flex-col gap-6 content-enter">
      <section className="relative overflow-hidden rounded-2xl dash-card p-6 md:p-8">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4 border-violet-500/30 bg-violet-500/15 text-violet-200"><Sparkles data-icon="inline-start" className="size-3" /> Guided demo workspace</Badge>
            <h1 className="text-3xl font-display tracking-tight md:text-5xl">Show the whole campaign story.</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">A dedicated demo dashboard for walking through research, content, posters, video, approvals, and measurable impact in one clean presentation.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <QuickDemoStart size="default" label="Load demo data" className="rounded-xl" />
              <Button asChild variant="outline" className="rounded-xl"><Link href="/dashboard"><Target data-icon="inline-start" /> Workspace overview</Link></Button>
            </div>
          </div>
          <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:w-auto sm:min-w-[280px]">
            <div className="rounded-xl border border-border/40 bg-background/35 p-4"><p className="text-xs text-muted-foreground">Agents complete</p><p className="mt-2 text-3xl font-display">{completedAgents}/{data.agents.length}</p></div>
            <div className="rounded-xl border border-border/40 bg-background/35 p-4"><p className="text-xs text-muted-foreground">Assets ready</p><p className="mt-2 text-3xl font-display">{data.contentDrafts.length + images.length + videos.length}</p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="dash-card p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="label-caps">Presentation flow</p><h2 className="section-title mt-1">From brief to proof</h2></div><Badge variant="outline" className="text-xs">{steps.filter((step) => step.done).length}/{steps.length}</Badge></div>
          <div className="flex flex-col gap-2">
            {steps.map((step, index) => (
              <Link key={step.label} href={step.href} className="group flex items-center gap-3 rounded-xl border border-border/30 bg-background/25 p-3 transition-colors hover:border-violet-400/35 hover:bg-background/45">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${step.done ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : 'border-border/60 text-muted-foreground'}`}>{step.done ? <CheckCircle2 className="size-4" /> : <span className="font-mono text-xs">{index + 1}</span>}</div>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{step.label}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{step.detail}</p></div>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground group-hover:text-violet-300" />
              </Link>
            ))}
          </div>
        </div>

        <div className="dash-card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between"><div><p className="label-caps">Campaign brief</p><h2 className="section-title mt-1">{data.campaign.companyName || 'ContentOps campaign'}</h2></div><Badge className="bg-emerald-500/15 text-emerald-300">{data.campaign.status}</Badge></div>
          <p className="text-sm leading-relaxed text-muted-foreground">{data.campaign.campaignGoal || 'Configure a campaign goal to start the guided demo.'}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-background/30 p-3"><p className="text-xs text-muted-foreground">Audience</p><p className="mt-1 line-clamp-2 text-sm">{data.campaign.targetAudience || 'Not set'}</p></div><div className="rounded-xl bg-background/30 p-3"><p className="text-xs text-muted-foreground">Posts</p><p className="mt-1 text-lg font-display">{data.contentDrafts.length}</p></div><div className="rounded-xl bg-background/30 p-3"><p className="text-xs text-muted-foreground">Saved / week</p><p className="mt-1 text-lg font-display">{data.roi.weeklyHoursSaved}h</p></div></div>
        </div>
      </section>

      <section className="dash-card overflow-hidden p-5 md:p-6">
        <div className="mb-5 flex items-end justify-between gap-4"><div><Badge variant="outline" className="mb-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-300"><Sparkles data-icon="inline-start" className="size-3" /> Live asset board</Badge><h2 className="section-title">Preview the work</h2><p className="section-subtitle mt-1">The demo stays on this page while each Studio remains available for deeper editing.</p></div><Button asChild size="sm" variant="outline" className="hidden rounded-xl sm:flex"><Link href="/dashboard/library">Open library <ArrowUpRight className="size-3.5" /></Link></Button></div>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="min-w-0 rounded-xl border border-border/40 bg-background/25 p-4 xl:col-span-1"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><FileText className="size-4 text-emerald-300" /><h3 className="text-sm font-semibold">Posts</h3></div><Badge variant="secondary" className="text-[11px]">{posts.length}</Badge></div><div className="flex max-h-[58rem] flex-col gap-3 overflow-y-auto pr-1">{posts.map((post) => <article key={post.id} className="rounded-lg border border-border/30 bg-background/40 p-4"><div className="flex items-center justify-between gap-2"><Badge variant="outline" className="capitalize text-[10px]">{post.platform}</Badge><span className="text-[10px] capitalize text-muted-foreground">{post.status.replace(/_/g, ' ')}</span></div><p className="mt-3 text-sm font-semibold leading-snug">{post.hook}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{post.mainCopy}</p><p className="mt-3 text-xs font-medium text-emerald-300">{post.cta}</p>{post.hashtags.length > 0 && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{post.hashtags.join(' ')}</p>}<div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/30 pt-3 text-center"><div><p className="text-[10px] text-muted-foreground">Audience</p><p className="text-xs font-medium">{post.audienceFitScore}</p></div><div><p className="text-[10px] text-muted-foreground">Safety</p><p className="text-xs font-medium text-emerald-300">{post.brandSafetyScore}</p></div><div><p className="text-[10px] text-muted-foreground">Lead</p><p className="text-xs font-medium">{post.leadPotentialScore}</p></div></div></article>)}{posts.length === 0 && <EmptyPreview href="/dashboard/content" label="Generate social posts" />}</div></div>
          <div className="min-w-0 rounded-xl border border-border/40 bg-background/25 p-4 xl:col-span-1"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><ImageIcon className="size-4 text-sky-300" /><h3 className="text-sm font-semibold">Posters</h3></div><Badge variant="secondary" className="text-[11px]">{images.length}</Badge></div>{images.length ? <div className="grid max-h-[58rem] grid-cols-2 gap-3 overflow-y-auto pr-1">{images.map((image) => <Link key={image.id} href="/dashboard/image" className="group overflow-hidden rounded-lg border border-border/30 bg-background/40"><div className="flex min-h-48 items-center justify-center overflow-hidden bg-black/30"><img src={image.imageUrl} alt={image.prompt} className="h-auto max-h-[28rem] w-full object-contain transition-transform duration-500 group-hover:scale-105" /></div><div className="p-3"><p className="text-xs font-medium">{image.model}</p><p className="mt-1 text-[11px] text-muted-foreground">{image.aspectRatio} · {image.provider}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{image.prompt}</p></div></Link>)}</div> : <EmptyPreview href="/dashboard/image" label="Generate poster set" />}</div>
          <div className="min-w-0 rounded-xl border border-border/40 bg-background/25 p-4 xl:col-span-1"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Video className="size-4 text-rose-300" /><h3 className="text-sm font-semibold">Videos</h3></div><Badge variant="secondary" className="text-[11px]">{videos.length}</Badge></div><div className="flex max-h-[58rem] flex-col gap-3 overflow-y-auto pr-1">{videos.map((video) => <div key={video.id} className="overflow-hidden rounded-lg border border-border/30 bg-background/40">{video.videoUrl ? <video src={video.videoUrl} controls muted className="aspect-video w-full bg-black object-contain" aria-label={`Preview of ${video.prompt}`} /> : <div className="flex aspect-video items-center justify-center bg-rose-500/10 text-xs text-muted-foreground">Video processing</div>}<div className="p-3"><p className="text-xs leading-relaxed text-foreground">{video.prompt}</p><p className="mt-2 text-[11px] text-muted-foreground">{video.model} · {video.duration}s · {video.aspectRatio}</p></div></div>)}{videos.length === 0 && <EmptyPreview href="/dashboard/video" label="Prepare video assets" />}</div></div>
        </div>
      </section>
    </div>
  )
}

function EmptyPreview({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border/50 p-5 text-center text-xs text-muted-foreground transition-colors hover:border-violet-400/40 hover:bg-violet-500/5"><Sparkles className="mb-2 size-5 text-violet-300/70" /><span className="font-medium text-foreground">{label}</span><span className="mt-1">Open the Studio to continue.</span></Link>
}
