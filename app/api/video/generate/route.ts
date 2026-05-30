import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { withOpenAI } from '@/lib/ai/openai'
import { generateVideoScripts } from '@/lib/ai/generate'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const ws = await getWorkspace()

    const { result: scripts, live } = await withOpenAI(() =>
      generateVideoScripts({
        topic: body.topic,
        count: body.count ?? 3,
        customPromptDetails: body.customPromptDetails,
        brandProfile: ws.brandProfile,
      }),
    )

    await patchWorkspace({ videoScripts: scripts })
    return apiSuccess({ scripts, live })
  } catch (err) {
    return apiFromError(err, 'Video script generation failed')
  }
}
