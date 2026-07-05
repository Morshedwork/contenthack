import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { hasElevenLabs } from '@/lib/ai/elevenlabs'
import { getConversationToken, getElevenLabsAgentId } from '@/lib/ai/elevenlabs-agents'

export async function GET(request: Request) {
  if (!hasElevenLabs()) {
    return apiError('ELEVENLABS_API_KEY is not configured', 400)
  }

  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId') ?? getElevenLabsAgentId()
  if (!agentId) {
    return apiError('No agent configured — POST /api/voice/agent/provision first', 400)
  }

  try {
    const token = await getConversationToken(agentId)
    return apiSuccess({ token, agentId })
  } catch (err) {
    return apiFromError(err, 'Failed to get ElevenLabs conversation token')
  }
}
