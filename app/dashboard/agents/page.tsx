import { CommandCenter } from '@/components/agents/command-center'

export default function AgentsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Agent Command Center</h1>
        <p className="text-muted-foreground text-sm">
          Multi-task AI agent dashboard — run, pause, and monitor your content operations workflow
        </p>
      </div>
      <CommandCenter />
    </>
  )
}
