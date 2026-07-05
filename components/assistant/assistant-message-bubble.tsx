'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AgentExecutionTimeline } from '@/components/agents/agent-execution-timeline'
import { ChatArtifactsPanel } from '@/components/agents/chat-artifacts-panel'
import { ChatMessageContent } from '@/components/agents/chat-message-content'
import { ChatSuggestedActions } from '@/components/agents/chat-suggested-actions'
import { ViewGenerationButtons } from '@/components/agents/view-generation-buttons'
import type {
  ChatActionExecuted,
  ChatAgentPlan,
  ChatArtifact,
  ChatMessage,
  ChatReference,
  ChatSuggestedAction,
} from '@/lib/agents/types'
import { cn } from '@/lib/utils'
import { Bot, User, Zap } from 'lucide-react'

export type AssistantMessage = ChatMessage & {
  actionsExecuted?: ChatActionExecuted[]
  artifacts?: ChatArtifact[]
  references?: ChatReference[]
  suggestedActions?: ChatSuggestedAction[]
  plan?: ChatAgentPlan
  source?: 'chat' | 'voice' | 'agent'
}

function ActionBadge({ action }: { action: ChatActionExecuted }) {
  if (action.type === 'run_workflow') {
    return (
      <Badge variant="secondary" className="text-[10px] gap-1">
        <Zap className="size-3" />
        Workflow {action.estimatedTimeSaved ? `· ~${action.estimatedTimeSaved}` : ''}
      </Badge>
    )
  }
  if (action.type === 'run_agent' && action.results?.length) {
    return (
      <div className="flex flex-wrap gap-1">
        {action.results.map((r) => (
          <Badge
            key={r.agentId}
            variant={r.status === 'failed' ? 'destructive' : 'secondary'}
            className="text-[10px]"
          >
            {r.agentName}
          </Badge>
        ))}
      </div>
    )
  }
  if (action.type === 'status') {
    return (
      <Badge variant="outline" className="text-[10px]">
        Status
      </Badge>
    )
  }
  return null
}

interface AssistantMessageBubbleProps {
  message: AssistantMessage
  compact?: boolean
  showSuggestedActions?: boolean
  onSuggestedAction?: (prompt: string) => void
  actionsDisabled?: boolean
}

export const AssistantMessageBubble = memo(function AssistantMessageBubble({
  message,
  compact,
  showSuggestedActions,
  onSuggestedAction,
  actionsDisabled,
}: AssistantMessageBubbleProps) {
  const isUser = message.role === 'user'
  const hasRichContent =
    Boolean(message.artifacts?.length) ||
    Boolean(message.references?.length) ||
    Boolean(message.plan?.steps.length) ||
    Boolean(message.actionsExecuted?.length)

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          isUser
            ? 'bg-gradient-to-br from-violet-500 to-blue-500'
            : 'bg-violet-500/15 border border-violet-500/20',
        )}
      >
        {isUser ? <User className="size-4 text-white" /> : <Bot className="size-4 text-violet-300" />}
      </div>
      <div
        className={cn(
          'rounded-xl px-4 py-3 text-sm min-w-0 break-words',
          isUser
            ? 'w-fit max-w-[min(85%,28rem)] bg-gradient-to-br from-violet-500/20 to-blue-500/10 border border-violet-500/20'
            : cn(
                'bg-secondary/40 border border-border/40',
                hasRichContent
                  ? 'w-full max-w-[min(100%,560px)]'
                  : 'w-fit max-w-[min(85%,28rem)]',
              ),
        )}
      >
        {!isUser && message.source && message.source !== 'chat' && (
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
            {message.source === 'voice' ? 'Voice command' : 'Live agent'}
          </p>
        )}
        <ChatMessageContent content={message.content} />
        {!isUser && message.plan?.steps.length ? (
          <div className="mt-3 pt-3 border-t border-border/40">
            <AgentExecutionTimeline plan={message.plan} phase="done" compact={compact} />
          </div>
        ) : null}
        {!isUser && (message.artifacts?.length || message.references?.length) ? (
          <div className="mt-3 pt-3 border-t border-border/40">
            <ChatArtifactsPanel
              artifacts={message.artifacts}
              references={message.references}
              compact={compact}
              inlineMedia
            />
          </div>
        ) : null}
        {!isUser && message.actionsExecuted?.length ? (
          <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {message.actionsExecuted.map((action, j) => (
                <ActionBadge key={j} action={action} />
              ))}
            </div>
            <ViewGenerationButtons actions={message.actionsExecuted} compact={compact} />
          </div>
        ) : null}
        {showSuggestedActions && message.suggestedActions?.length && onSuggestedAction ? (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground mb-2">Next steps</p>
            <ChatSuggestedActions
              actions={message.suggestedActions}
              onSelect={onSuggestedAction}
              disabled={actionsDisabled}
              compact={compact}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
})

/** Compact jump link row under assistant text when media was created. */
export function AssistantMediaJumpLinks({ artifacts }: { artifacts?: ChatArtifact[] }) {
  if (!artifacts?.length) return null
  const media = artifacts.filter((a) => a.type === 'image' || a.type === 'video')
  if (!media.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {media.map((a) => (
        <Link
          key={a.id}
          href={a.href}
          className="text-xs text-violet-300 hover:text-violet-200 underline underline-offset-2"
        >
          {a.type === 'image' ? 'View generated image' : 'Play generated video'} →
        </Link>
      ))}
    </div>
  )
}
