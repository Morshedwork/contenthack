'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WorkflowPipeline } from '@/components/agents/workflow-pipeline'
import { workflowSteps, demoROI } from '@/lib/demo/data'

const sections = [
  {
    title: 'Problem',
    content: 'Marketing teams spend 6+ hours weekly on research and content planning, use scattered tools for creation, face slow approval cycles, and have lead generation disconnected from content performance.',
  },
  {
    title: 'Solution',
    content: 'ContentOps AI is an AI content operations command center that connects campaign goals to market research, multi-agent content generation, approval workflows, publishing, lead discovery, outreach, and ROI analytics — all from one dashboard.',
  },
  {
    title: 'Workflow',
    content: 'Campaign Goal → Market Research → Topic Strategy → Content Studio → Video Studio → Approval Board → Calendar → Publishing → Lead Finder → Outreach → ROI Analytics',
  },
  {
    title: 'Productivity Improvement',
    content: `Research: 6 hrs → 45 min. Lead research: 2 hrs → 25 min. Manual posting reduced 80%. Content planning speed +70%. Weekly hours saved: ${demoROI.weeklyHoursSaved}h. Monthly cost saved: $${demoROI.monthlyCostSaved}.`,
  },
  {
    title: 'TRAE Integration',
    content: 'Multi-agent architecture with 10 specialized agents. Model routing across OpenAI models (GPT-4o, GPT-4.1, GPT-4o mini, o4-mini). Modular publisher adapters (LinkedIn, Instagram, Facebook, X, TikTok, YouTube). MCP-ready integration structure for extensibility.',
  },
  {
    title: 'Business Feasibility',
    content: 'SaaS pricing from $49/mo (Starter) to Enterprise. Clear ROI metrics for buyer justification. Official API architecture (no browser automation). Approval gates for brand safety and outreach compliance.',
  },
  {
    title: 'Future Roadmap',
    content: 'Live OAuth integrations, real-time collaboration, A/B testing for content, CRM sync (HubSpot/Salesforce), white-label for agencies, custom agent training, and advanced attribution analytics.',
  },
]

export default function ImpactReportPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Hackathon Impact Report</h1>
        <p className="text-muted-foreground text-sm">ContentOps AI — Judging criteria alignment</p>
      </div>

      <Card className="mb-6 bg-violet-500/5 border-violet-500/20">
        <CardContent className="p-6">
          <WorkflowPipeline steps={workflowSteps} activeIndex={8} compact />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { criteria: 'Innovation & Originality', desc: 'Connects AI content creation with lead generation, model routing, and productivity ROI' },
          { criteria: 'TRAE Platform Integration', desc: 'Multi-agent architecture, model management, modular adapters, MCP-ready structure' },
          { criteria: 'Usability & Design', desc: 'Dashboard, calendar, Kanban approval, lead table, analytics — familiar daily workflows' },
          { criteria: 'Business Impact', desc: 'Measures time saved, reduced manual work, faster campaigns, lead gen improvement' },
        ].map((c) => (
          <Card key={c.criteria} className="bg-card/60">
            <CardContent className="p-5">
              <Badge className="mb-2">{c.criteria}</Badge>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader><CardTitle className="text-base">{s.title}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{s.content}</p></CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
