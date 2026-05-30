import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { checkBrandSafety } from '@/lib/ai/generate'
import { getWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ws = await getWorkspace()
    const content: string = body.content || ''
    const { result, live } = await withOpenAI(() =>
      checkBrandSafety({ content, brandProfile: ws.brandProfile }),
    )
    return apiSuccess({ ...result, live })
  } catch (err) {
    return apiFromError(err, 'Brand safety check failed')
  }
}
