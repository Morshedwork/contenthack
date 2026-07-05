import { handleAgentChat, handleBasicChat } from '@/lib/agents/orchestrator'
import type { ChatMessage, ChatMode, ChatStreamEvent } from '@/lib/agents/types'
import { resolveAgentWorkspaceOptions } from '@/lib/workspace/api-context'

function sseLine(event: ChatStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const messages = body?.messages as ChatMessage[] | undefined
  const mode = (body?.mode === 'basic' ? 'basic' : 'agent') as ChatMode
  const wsOptions = resolveAgentWorkspaceOptions(request)

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), { status: 400 })
  }
  if (!messages.some((m) => m.role === 'user' && m.content?.trim())) {
    return new Response(JSON.stringify({ error: 'At least one user message is required' }), { status: 400 })
  }

  if (mode === 'basic') {
    try {
      const result = await handleBasicChat(messages, wsOptions)
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          controller.enqueue(encoder.encode(sseLine({ type: 'done', response: result })))
          controller.close()
        },
      })
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chat request failed'
      return new Response(JSON.stringify({ error: message }), { status: 500 })
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        await handleAgentChat(messages, {
          ...wsOptions,
          signal: request.signal,
          onProgress: (event) => {
            controller.enqueue(encoder.encode(sseLine(event)))
          },
        })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'Chat request failed'
        controller.enqueue(encoder.encode(sseLine({ type: 'error', message })))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
