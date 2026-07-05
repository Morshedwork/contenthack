import 'server-only'

import { defaultVoiceId, elevenLabsModel, hasElevenLabs } from '@/lib/ai/elevenlabs'
import { resolveVoiceLanguage, ttsModelForLanguage, voiceLanguageInstruction } from '@/lib/voice/languages'

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'
export const CONTENTOPS_AGENT_NAME = 'ContentOps Voice Manager'

function getApiKey(): string | undefined {
  return process.env.ELEVENLABS_API_KEY?.trim()
}

export function getElevenLabsAgentId(): string | undefined {
  return process.env.ELEVENLABS_AGENT_ID?.trim()
}

export function hasElevenLabsAgent(): boolean {
  return hasElevenLabs() && Boolean(getElevenLabsAgentId())
}

async function elevenFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not configured')

  const res = await fetch(`${ELEVENLABS_BASE}${path}`, {
    ...init,
    headers: {
      'xi-api-key': apiKey,
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = `ElevenLabs API failed (${res.status})`
    try {
      const data = (await res.json()) as { detail?: { message?: string } | string }
      const detail = typeof data.detail === 'string' ? data.detail : data.detail?.message
      if (detail) message = detail
    } catch {
      // keep default
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

const CONTENTOPS_CLIENT_TOOLS = [
  {
    type: 'client' as const,
    name: 'run_contentops_command',
    description:
      'Execute a ContentOps marketing command: market research, content generation, lead finding, outreach, full workflow, or campaign status. Use when the user wants work done.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The full natural-language command to run through ContentOps agents',
        },
      },
      required: ['command'],
    },
    expects_response: true,
    response_timeout_secs: 120,
  },
  {
    type: 'client' as const,
    name: 'get_workspace_status',
    description:
      'Fetch live workspace stats: drafts, leads, agents completed, hours saved. Use for status questions without running agents.',
    parameters: { type: 'object', properties: {} },
    expects_response: true,
    response_timeout_secs: 30,
  },
]

function contentOpsAgentPrompt(languageCode?: string): string {
  const langLine =
    languageCode === 'auto'
      ? 'Detect the user\'s language from their speech and respond in that language (English, Bengali, or Japanese).'
      : voiceLanguageInstruction(languageCode)
  return `You are the ContentOps Voice Manager — a warm, sharp marketing operations lead.

You run a team of 11 AI agents for research, strategy, content, video, safety, scheduling, publishing, leads, outreach, and analytics.

Language:
- ${langLine}
- Mirror the user's language when they switch mid-conversation.

Conversation rules:
- Greetings and small talk: reply naturally and briefly. Do not dump metrics unless asked.
- When the user wants work done, call run_contentops_command with their exact request.
- For quick status ("how are we doing", "pipeline status"), call get_workspace_status or run_contentops_command with a status request.
- After a tool returns, summarize results conversationally in 2-4 sentences.
- Never invent numbers — only use data from tools.
- Keep spoken replies concise and easy to listen to.`
}

function agentTtsModel(): string {
  return process.env.ELEVENLABS_AGENT_MODEL?.trim() || 'eleven_turbo_v2'
}

function buildAgentConfig(languageCode?: string) {
  const language = resolveVoiceLanguage(languageCode === 'auto' ? undefined : languageCode)
  return {
    name: CONTENTOPS_AGENT_NAME,
    conversation_config: {
      agent: {
        first_message: language.agentFirstMessage,
        language: language.elevenLabsLang,
        prompt: {
          prompt: contentOpsAgentPrompt(languageCode),
          llm: 'gpt-4o-mini',
          temperature: 0.6,
          tools: CONTENTOPS_CLIENT_TOOLS,
        },
      },
      tts: {
        model_id: language.code === 'en' ? agentTtsModel() : ttsModelForLanguage(language.code),
        voice_id: defaultVoiceId(),
      },
      conversation: {
        max_duration_seconds: 1800,
      },
    },
  }
}

async function findAgentByName(name: string): Promise<string | undefined> {
  try {
    const data = await elevenFetch<{ agents?: Array<{ agent_id?: string; name?: string }> }>(
      '/convai/agents?page_size=100',
    )
    return data.agents?.find((a) => a.name === name && a.agent_id)?.agent_id
  } catch {
    return undefined
  }
}

/** Create or update the ContentOps ElevenLabs conversational agent. */
export async function provisionContentOpsAgent(languageCode?: string): Promise<{
  agentId: string
  created: boolean
  message: string
}> {
  if (!hasElevenLabs()) {
    throw new Error('ELEVENLABS_API_KEY is not configured')
  }

  const existingId = getElevenLabsAgentId() || (await findAgentByName(CONTENTOPS_AGENT_NAME))
  const config = buildAgentConfig(languageCode)

  if (existingId) {
    await elevenFetch(`/convai/agents/${existingId}`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    })
    return {
      agentId: existingId,
      created: false,
      message: `Agent ready. Add ELEVENLABS_AGENT_ID=${existingId} to .env.local to persist.`,
    }
  }

  const created = await elevenFetch<{ agent_id?: string }>('/convai/agents/create', {
    method: 'POST',
    body: JSON.stringify(config),
  })

  const agentId = created.agent_id
  if (!agentId) throw new Error('ElevenLabs did not return an agent_id')

  return {
    agentId,
    created: true,
    message: `Agent created. Add ELEVENLABS_AGENT_ID=${agentId} to .env.local to persist.`,
  }
}

/** Short-lived WebRTC token — safe to pass to the browser. */
export async function getConversationToken(agentId?: string): Promise<string> {
  const id = agentId?.trim() || getElevenLabsAgentId()
  if (!id) throw new Error('No ElevenLabs agent configured. Call /api/voice/agent/provision first.')

  const data = await elevenFetch<{ token?: string; conversation_token?: string }>(
    `/convai/conversation/token?agent_id=${encodeURIComponent(id)}`,
  )

  const token = data.token ?? data.conversation_token
  if (!token) throw new Error('ElevenLabs did not return a conversation token')
  return token
}

/** Signed WebSocket URL for private agents (alternative to WebRTC). */
export async function getSignedConversationUrl(agentId?: string): Promise<string> {
  const id = agentId?.trim() || getElevenLabsAgentId()
  if (!id) throw new Error('No ElevenLabs agent configured')

  const data = await elevenFetch<{ signed_url?: string }>(
    `/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(id)}`,
  )
  if (!data.signed_url) throw new Error('ElevenLabs did not return a signed URL')
  return data.signed_url
}
