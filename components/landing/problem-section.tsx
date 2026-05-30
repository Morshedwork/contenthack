'use client'

import { motion } from 'framer-motion'
import { Clock, Layers, ShieldAlert, Unplug } from 'lucide-react'
import { GlassCard, IconBadge, SectionHeader, SectionShell } from './landing-ui'

const pains = [
  { icon: Clock, title: 'Hours lost researching', desc: 'Teams spend hours researching content ideas instead of executing campaigns.' },
  { icon: Layers, title: 'Scattered creation tools', desc: 'Content creation is scattered across docs, spreadsheets, and disconnected apps.' },
  { icon: ShieldAlert, title: 'Slow approvals', desc: 'Scheduling and approvals slow down campaigns and miss optimal posting windows.' },
  { icon: Unplug, title: 'Disconnected lead gen', desc: 'Lead generation is disconnected from content performance and strategy.' },
]

export function ProblemSection() {
  return (
    <SectionShell id="problem">
      <SectionHeader
        eyebrow="The problem"
        title="Marketing teams are drowning in tools"
        description="Four pain points every growth team faces — and why a unified command center changes everything."
      />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {pains.map((pain, i) => (
          <motion.div
            key={pain.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            viewport={{ once: true }}
          >
            <GlassCard hover className="h-full">
              <IconBadge tone="red">
                <pain.icon className="size-5" />
              </IconBadge>
              <h3 className="mb-2 font-medium text-white">{pain.title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{pain.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  )
}
