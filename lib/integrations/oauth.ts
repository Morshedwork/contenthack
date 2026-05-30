import 'server-only'

import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'
import type { OAuthPlatform } from './platforms'
import { getOAuthRedirectUri, getPlatformCredentials, OAUTH_PLATFORMS } from './platforms'

const STATE_COOKIE = 'contentops_oauth_state'
const PKCE_COOKIE = 'contentops_oauth_pkce'

interface OAuthStatePayload {
  platform: OAuthPlatform
  workspaceId: string
  nonce: string
  ts: number
}

export interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
}

function encodeState(payload: OAuthStatePayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodeState(value: string): OAuthStatePayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as OAuthStatePayload
    if (!parsed.platform || !parsed.workspaceId || !parsed.nonce || !parsed.ts) return null
    if (Date.now() - parsed.ts > 10 * 60 * 1000) return null
    return parsed
  } catch {
    return null
  }
}

function createPkcePair() {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export async function buildAuthorizationUrl(
  platform: OAuthPlatform,
  workspaceId: string,
  origin: string,
): Promise<{ url: string; error?: string }> {
  const { config, clientId, configured } = getPlatformCredentials(platform)
  if (!configured || !clientId) {
    return {
      url: '',
      error: `${config.name} OAuth is not configured. Set ${config.clientIdEnv} and ${config.clientSecretEnv} in .env.local`,
    }
  }

  const nonce = randomBytes(16).toString('hex')
  const state = encodeState({ platform, workspaceId, nonce, ts: Date.now() })
  const redirectUri = getOAuthRedirectUri(origin, platform)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: config.scopes.join(' '),
    ...(config.extraAuthParams ?? {}),
  })

  if (config.usePkce) {
    const { verifier, challenge } = createPkcePair()
    params.set('code_challenge', challenge)
    params.set('code_challenge_method', 'S256')
    const cookieStore = await cookies()
    cookieStore.set(PKCE_COOKIE, verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })
  }

  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return { url: `${config.authUrl}?${params.toString()}` }
}

export async function exchangeAuthorizationCode(
  platform: OAuthPlatform,
  code: string,
  origin: string,
): Promise<OAuthTokenResponse> {
  const { config, clientId, clientSecret } = getPlatformCredentials(platform)
  if (!clientId || !clientSecret) {
    throw new Error(`${config.name} OAuth credentials are not configured`)
  }

  const redirectUri = getOAuthRedirectUri(origin, platform)
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  if (config.usePkce) {
    const cookieStore = await cookies()
    const verifier = cookieStore.get(PKCE_COOKIE)?.value
    if (!verifier) throw new Error('OAuth PKCE verifier missing — try connecting again')
    body.set('code_verifier', verifier)
    cookieStore.delete(PKCE_COOKIE)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (platform === 'x') {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    body.delete('client_secret')
  }

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: body.toString(),
  })

  const json = (await res.json()) as OAuthTokenResponse & { error?: string; error_description?: string }
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || `Token exchange failed (${res.status})`)
  }

  return json
}

export async function verifyOAuthState(
  platform: OAuthPlatform,
  state: string,
): Promise<OAuthStatePayload> {
  const cookieStore = await cookies()
  const stored = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete(STATE_COOKIE)

  if (!stored || stored !== state) {
    throw new Error('Invalid OAuth state — please try connecting again')
  }

  const payload = decodeState(state)
  if (!payload || payload.platform !== platform) {
    throw new Error('OAuth session expired — please try connecting again')
  }

  return payload
}

export function getConfiguredOAuthPlatforms() {
  return (Object.keys(OAUTH_PLATFORMS) as OAuthPlatform[]).filter(
    (platform) => getPlatformCredentials(platform).configured,
  )
}
