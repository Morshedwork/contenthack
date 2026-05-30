import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { generateTopics } from '@/lib/ai/generate'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { result: topics, live } = await withOpenAI(() =>
      generateTopics({ goal: body.goal, count: body.count, customPromptDetails: body.customPromptDetails }),
    )
    return apiSuccess({ topics, live })
  } catch (err) {
    return apiFromError(err, 'Topic generation failed')
  }
}
