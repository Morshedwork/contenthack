import { AgentChat } from '@/components/agents/agent-chat'

export default function ChatPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">AI Chat</h1>
        <p className="text-muted-foreground text-sm">
          Basic chat for ideas and copy help, or agent mode to run your full content operations pipeline
        </p>
      </div>
      <AgentChat variant="page" />
    </>
  )
}
