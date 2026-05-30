import { NextResponse } from 'next/server'
import { exchangeAuthorizationCode, verifyOAuthState } from '@/lib/integrations/oauth'
import { isOAuthPlatform, OAUTH_PLATFORMS } from '@/lib/integrations/platforms'
import { saveIntegrationCredentials } from '@/lib/integrations/store'
import { connectIntegration } from '@/lib/workspace/store'

type RouteParams = { params: Promise<{ platform: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  const origin = new URL(request.url).origin
  const { platform } = await params

  try {
    if (!isOAuthPlatform(platform)) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=Unsupported%20platform', origin),
      )
    }

    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const providerError = url.searchParams.get('error_description') || url.searchParams.get('error')

    if (providerError) {
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(providerError)}`, origin),
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=Missing%20OAuth%20code', origin),
      )
    }

    const payload = await verifyOAuthState(platform, state)
    const token = await exchangeAuthorizationCode(platform, code, origin)
    await saveIntegrationCredentials(
      payload.workspaceId,
      platform,
      token,
      OAUTH_PLATFORMS[platform].scopes,
    )
    await connectIntegration(platform, { workspaceId: payload.workspaceId, userId: '' })

    return NextResponse.redirect(
      new URL(`/dashboard/integrations?connected=${platform}`, origin),
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OAuth callback failed'
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(message)}`, origin),
    )
  }
}
