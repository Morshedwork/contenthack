'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { WorkflowPipeline } from '@/components/agents/workflow-pipeline'
import { workflowSteps, demoAgents, overviewKPIs, demoCalendarPosts, demoLeads } from '@/lib/demo/data'
import { Bot, TrendingUp } from 'lucide-react'

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8 }}
      className="relative mx-auto w-full max-w-5xl"
    >
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-violet-500/25 via-blue-500/10 to-cyan-500/15 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-500/70" />
            <div className="size-2.5 rounded-full bg-amber-500/70" />
            <div className="size-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="ml-2 font-mono text-[10px] text-white/40">ContentOps AI — Live Demo</span>
        </div>
        <div className="p-4">
          <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[10px] text-white/40">Campaign Goal</p>
            <p className="text-xs text-white/80">
              Generate qualified leads for AI automation services — Cognisor AI
            </p>
          </div>
          <WorkflowPipeline steps={workflowSteps.slice(0, 8)} activeIndex={3} compact />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="col-span-2 grid grid-cols-2 gap-2">
              {overviewKPIs.slice(0, 4).map((kpi) => (
                <div key={kpi.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                  <p className="text-[9px] text-white/40">{kpi.label}</p>
                  <p className="font-display text-sm text-white">{kpi.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="mb-2 flex items-center gap-1 text-[9px] text-white/40">
                <Bot className="size-3" /> Agent Status
              </p>
              {demoAgents.slice(0, 3).map((a) => (
                <div key={a.id} className="mb-1 flex justify-between text-[9px] text-white/70">
                  <span>{a.name.replace(' Agent', '')}</span>
                  <Badge variant="outline" className="h-4 border-white/15 text-[8px] capitalize">
                    {a.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="mb-1 text-[9px] text-white/40">Generated Posts</p>
              <p className="line-clamp-2 text-[10px] text-white/60">
                Your team spends 20 hours/week on tasks AI can handle...
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="mb-1 text-[9px] text-white/40">Content Calendar</p>
              {demoCalendarPosts.slice(0, 2).map((p) => (
                <p key={p.id} className="text-[9px] text-white/50">
                  {p.date} · {p.title.slice(0, 22)}...
                </p>
              ))}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="mb-1 flex items-center gap-1 text-[9px] text-white/40">
                <TrendingUp className="size-3" /> Lead Scores
              </p>
              {demoLeads.slice(0, 3).map((l) => (
                <div key={l.id} className="flex justify-between text-[9px] text-white/60">
                  <span>{l.name}</span>
                  <span className="text-emerald-400">{l.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
