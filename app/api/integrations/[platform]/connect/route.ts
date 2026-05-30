import { NextResponse } from 'next/server'
import { apiError, apiFromError } from '@/lib/api-utils'
import { buildAuthorizationUrl } from '@/lib/integrations/oauth'
import { isOAuthPlatform } from '@/lib/integrations/platforms'
import { resolveWorkspaceContext } from '@/lib/workspace/context'

type RouteParams = { params: Promise<{ platform: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { platform } = await params
    if (!isOAuthPlatform(platform)) {
      return apiError(`Unsupported platform: ${platform}`, 400)
    }

    const ctx = await resolveWorkspaceContext()
    const origin = new URL(request.url).origin
    const { url, error } = await buildAuthorizationUrl(platform, ctx.workspaceId, origin)

    if (error || !url) {
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(error || 'OAuth not configured')}`, origin),
      )
    }

    return NextResponse.redirect(url)
  } catch (err) {
    return apiFromError(err, 'Failed to start OAuth flow')
  }
}
