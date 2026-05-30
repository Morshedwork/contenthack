import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { isOAuthPlatform } from '@/lib/integrations/platforms'
import { disconnectIntegration } from '@/lib/integrations/store'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import { resolveWorkspaceContext } from '@/lib/workspace/context'

type RouteParams = { params: Promise<{ platform: string }> }

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { platform } = await params
    if (!isOAuthPlatform(platform)) {
      return apiError(`Unsupported platform: ${platform}`, 400)
    }

    const ctx = await resolveWorkspaceContext()
    await disconnectIntegration(ctx.workspaceId, platform)

    const ws = await getWorkspace(ctx)
    const integrations = ws.integrations.map((i) =>
      i.id === platform ? { ...i, connected: false, mockMode: false } : i,
    )
    await patchWorkspace({ integrations }, ctx)

    return apiSuccess({ disconnected: platform })
  } catch (err) {
    return apiFromError(err, 'Failed to disconnect integration')
  }
}
