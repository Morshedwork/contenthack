import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { handleAgentChat, handleBasicChat } from '@/lib/agents/orchestrator'
import type { ChatMessage, ChatMode } from '@/lib/agents/types'
import { resolveAgentWorkspaceOptions } from '@/lib/workspace/api-context'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const messages = body?.messages as ChatMessage[] | undefined
  const mode = (body?.mode === 'basic' ? 'basic' : 'agent') as ChatMode
  const wsOptions = resolveAgentWorkspaceOptions(request)

  if (!messages?.length) return apiError('messages array is required', 400)
  if (!messages.some((m) => m.role === 'user' && m.content?.trim())) {
    return apiError('At least one user message is required', 400)
  }

  try {
    const result =
      mode === 'basic'
        ? await handleBasicChat(messages, wsOptions)
        : await handleAgentChat(messages, wsOptions)
    return apiSuccess(result)
  } catch (err) {
    return apiFromError(err, 'Chat request failed')
  }
}
