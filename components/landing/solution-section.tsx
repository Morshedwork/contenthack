'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { GlassCard, SectionHeader, SectionShell } from './landing-ui'
import { WorkflowShowcase } from './workflow-showcase'

export function SolutionSection() {
  return (
    <SectionShell id="workflow" variant="elevated">
      <SectionHeader
        eyebrow="The workflow"
        title="From campaign goal to ROI analytics"
        description="One pipeline connects research, content, video, approval, publishing, leads, and analytics — orchestrated by AI agents across four phases."
      />
      <GlassCard className="overflow-hidden p-6 md:p-10">
        <WorkflowShowcase activeIndex={5} />
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-center text-sm text-white/45 sm:text-left">
            Each step is owned by a specialized agent with model routing and approval gates.
          </p>
          <Button asChild variant="outline" className="shrink-0 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href="/dashboard/campaign-builder">
              Try the campaign builder
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </GlassCard>
    </SectionShell>
  )
}
