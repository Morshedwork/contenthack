import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { handleVoiceCommand } from '@/lib/agents/manager'
import type { ChatMessage } from '@/lib/agents/types'
import { resolveAgentWorkspaceOptions } from '@/lib/workspace/api-context'

export const maxDuration = 300

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const transcript = typeof body?.transcript === 'string' ? body.transcript.trim() : ''
  const history = (Array.isArray(body?.history) ? body.history : []) as ChatMessage[]

  if (!transcript) return apiError('transcript is required', 400)

  try {
    const result = await handleVoiceCommand(transcript, history, resolveAgentWorkspaceOptions(request))
    return apiSuccess(result)
  } catch (err) {
    return apiFromError(err, 'Voice command failed')
  }
}
