import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { handleAgentChat, handleBasicChat } from '@/lib/agents/orchestrator'
import type { ChatMessage, ChatMode } from '@/lib/agents/types'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const messages = body?.messages as ChatMessage[] | undefined
  const mode = (body?.mode === 'basic' ? 'basic' : 'agent') as ChatMode

  if (!messages?.length) return apiError('messages array is required', 400)
  if (!messages.some((m) => m.role === 'user' && m.content?.trim())) {
    return apiError('At least one user message is required', 400)
  }

  try {
    const result =
      mode === 'basic'
        ? await handleBasicChat(messages, { allowAnonymous: true })
        : await handleAgentChat(messages, { allowAnonymous: true })
    return apiSuccess(result)
  } catch (err) {
    return apiFromError(err, 'Chat request failed')
  }
}
