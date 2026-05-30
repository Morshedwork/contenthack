import { apiFromError, apiSuccess } from '@/lib/api-utils'
import { publishToPlatform } from '@/lib/publishers/publish'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import type { Platform } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const platform = (body.platform || 'linkedin') as Platform
    const ws = await getWorkspace()

    const payload = {
      title: body.title || 'Untitled',
      content: body.content || '',
      mediaUrls: body.mediaUrls,
      scheduledAt: body.scheduledAt,
    }

    const result = await publishToPlatform(platform, payload)

    const log = {
      id: `p-${Date.now()}`,
      title: body.title || 'Untitled',
      platform,
      status: result.success ? ('success' as const) : ('failed' as const),
      time: new Date().toISOString(),
      url: result.url,
      error: result.error,
    }

    await patchWorkspace({ publishLogs: [log, ...ws.publishLogs] })

    if (!result.success) {
      return apiFromError(new Error(result.error || 'Publish failed'), 'Publish failed')
    }

    return apiSuccess({ publish: result, log })
  } catch (err) {
    return apiFromError(err, 'Publish failed')
  }
}
