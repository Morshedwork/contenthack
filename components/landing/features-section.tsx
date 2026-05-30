'use client'

import { motion } from 'framer-motion'
import { Bot, Calendar, Cpu, LineChart, Megaphone, Search, Shield, Users, Video } from 'lucide-react'
import { DashboardPreview } from './dashboard-preview'
import { GlassCard, IconBadge, SectionHeader, SectionShell } from './landing-ui'

const features = [
  { icon: Search, title: 'From campaign goal to content calendar', desc: 'Guided campaign builder generates research, topics, posts, and schedules automatically.' },
  { icon: Bot, title: 'Multi agent workflow automation', desc: '10 specialized agents handle research, content, video, safety, publishing, and outreach.' },
  { icon: Cpu, title: 'Model routing for every task', desc: 'Route the right OpenAI model (GPT-4o, GPT-4.1, o4-mini) to each task with fallback and cost controls.' },
  { icon: Users, title: 'Lead generation from content strategy', desc: 'Find qualified leads based on content topics, engagement signals, and audience fit.' },
  { icon: Megaphone, title: 'Publishing center with approval control', desc: 'Mock or live publishing to LinkedIn, Instagram, Facebook, X, TikTok, and YouTube Shorts.' },
  { icon: LineChart, title: 'ROI analytics for productivity teams', desc: 'Measure hours saved, cost reduction, content output, and campaign execution speed.' },
]

export function FeaturesSection() {
  return (
    <SectionShell id="features" variant="glow">
      <SectionHeader
        eyebrow="Platform"
        title="Everything your content ops team needs"
        description="Not a chatbot — a complete visual command center for marketing and sales teams."
      />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            viewport={{ once: true }}
          >
            <GlassCard hover className="h-full">
              <IconBadge tone="violet">
                <f.icon className="size-5" />
              </IconBadge>
              <h3 className="mb-2 font-medium text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  )
}

export function MultiAgentSection() {
  const agents = [
    'Research Agent', 'Strategy Agent', 'Content Agent', 'Video Agent', 'Brand Safety Agent',
    'Scheduler Agent', 'Publisher Agent', 'Lead Finder Agent', 'Outreach Agent', 'Analytics Agent',
  ]

  return (
    <SectionShell id="agents" variant="elevated">
      <SectionHeader
        eyebrow="Agents"
        title="Multi agent system"
        description="Each agent has a role, assigned model, progress tracking, and confidence scoring."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {agents.map((agent, i) => (
          <motion.div
            key={agent}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            viewport={{ once: true }}
          >
            <GlassCard className="p-4 text-center">
              <Bot className="mx-auto mb-2 size-5 text-violet-300" />
              <p className="text-xs font-medium text-white">{agent}</p>
              <p className="mt-1 text-[10px] text-white/40">
                {['Running', 'Completed', 'Idle', 'Running', 'Waiting'][i % 5]}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  )
}

export function ModelManagementSection() {
  const models = [
    { name: 'GPT-4o', provider: 'OpenAI', score: 92 },
    { name: 'GPT-4.1', provider: 'OpenAI', score: 94 },
    { name: 'GPT-4o mini', provider: 'OpenAI', score: 87 },
    { name: 'GPT-4.1 mini', provider: 'OpenAI', score: 89 },
    { name: 'o4-mini', provider: 'OpenAI', score: 91 },
    { name: 'Mock Model', provider: 'Demo', score: 80 },
  ]

  return (
    <SectionShell>
      <SectionHeader
        eyebrow="Models"
        title="Model management"
        description="Route the right model to each task with cost, speed, and quality controls."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {models.map((m) => (
          <GlassCard key={m.name} className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Cpu className="size-4 text-violet-300" />
              <span className="text-sm font-medium text-white">{m.name}</span>
            </div>
            <p className="mb-2 text-xs text-white/45">{m.provider}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Quality</span>
              <span className="text-sm font-medium text-emerald-400">{m.score}/100</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </SectionShell>
  )
}

export function ROISection() {
  const metrics = [
    { label: 'Research time', before: '6 hrs/wk', after: '45 min/wk' },
    { label: 'Lead research', before: '2 hrs/wk', after: '25 min/wk' },
    { label: 'Manual posting', before: '100%', after: '-80%' },
    { label: 'Planning speed', before: 'Baseline', after: '+70%' },
  ]

  return (
    <SectionShell variant="elevated">
      <SectionHeader
        eyebrow="Impact"
        title="Productivity ROI"
        description="Real impact numbers from teams using ContentOps AI."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <GlassCard key={m.label} className="p-5 text-center">
            <p className="mb-3 text-xs text-white/45">{m.label}</p>
            <p className="mb-1 text-sm text-red-400/70 line-through">{m.before}</p>
            <p className="font-display text-xl text-emerald-400 md:text-2xl">{m.after}</p>
          </GlassCard>
        ))}
      </div>
    </SectionShell>
  )
}

export function SocialAutomationSection() {
  const platforms = ['LinkedIn', 'Instagram', 'Facebook', 'X', 'TikTok', 'YouTube Shorts']
  return (
    <SectionShell>
      <SectionHeader
        eyebrow="Publishing"
        title="Social media automation"
        description="Official API-ready adapters with mock mode for demos. No content publishes without approval."
      />
      <div className="flex flex-wrap justify-center gap-3">
        {platforms.map((p) => (
          <div
            key={p}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/80 backdrop-blur-sm"
          >
            <Megaphone className="size-4 text-violet-300" />
            {p}
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

export function LeadGenSection() {
  return (
    <SectionShell variant="elevated">
      <div className="grid items-start gap-12 md:grid-cols-2">
        <div>
          <SectionHeader
            align="left"
            eyebrow="Leads"
            title="Lead generation center"
            description="Discover qualified leads from content strategy and engagement signals. Personalized outreach with mandatory approval before sending."
            className="mb-8"
          />
          <ul className="flex flex-col gap-3">
            {['Lead scoring & pipeline tracking', 'Personalized outreach drafts', 'Platform-specific match reasons', 'Suggested next actions'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                <Shield className="size-4 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <GlassCard>
          {[
            { name: 'Yuki Tanaka', company: 'TechFlow Tokyo', score: 94 },
            { name: 'James Okonkwo', company: 'AfriTech Solutions', score: 91 },
            { name: 'Kenji Watanabe', company: 'RoboWorks JP', score: 93 },
          ].map((lead) => (
            <div
              key={lead.name}
              className="flex items-center justify-between border-b border-white/10 py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-white">{lead.name}</p>
                <p className="text-xs text-white/45">{lead.company}</p>
              </div>
              <span className="font-display text-lg text-emerald-400">{lead.score}</span>
            </div>
          ))}
        </GlassCard>
      </div>
    </SectionShell>
  )
}

export function DemoPreviewSection() {
  return (
    <SectionShell id="demo" variant="glow">
      <SectionHeader
        eyebrow="Live demo"
        title="See the command center in action"
        description="A fully interactive demo dashboard with realistic Cognisor AI campaign data — agents, workflow, calendar, and leads in one view."
      />
      <DashboardPreview />
    </SectionShell>
  )
}
