import 'server-only'

import { loadIntegrationCredentials } from '@/lib/integrations/store'
import type { OAuthPlatform } from '@/lib/integrations/platforms'
import { isOAuthPlatform } from '@/lib/integrations/platforms'
import { resolveWorkspaceContext } from '@/lib/workspace/context'

const ENV_TOKEN_KEYS: Partial<Record<OAuthPlatform, string>> = {
  linkedin: 'LINKEDIN_ACCESS_TOKEN',
  instagram: 'INSTAGRAM_ACCESS_TOKEN',
  facebook: 'FACEBOOK_ACCESS_TOKEN',
}

export async function getPlatformAccessToken(platform: OAuthPlatform): Promise<string | null> {
  try {
    const ctx = await resolveWorkspaceContext()
    const stored = await loadIntegrationCredentials(ctx.workspaceId, platform)
    if (stored?.accessToken) return stored.accessToken
  } catch {
    // Fall through to env token
  }

  const envKey = ENV_TOKEN_KEYS[platform]
  if (envKey && process.env[envKey]?.trim()) {
    return process.env[envKey]!.trim()
  }

  return null
}

export async function requirePlatformAccessToken(platform: string): Promise<string> {
  if (!isOAuthPlatform(platform)) {
    throw new Error(`Unsupported platform: ${platform}`)
  }

  const token = await getPlatformAccessToken(platform)
  if (!token) {
    throw new Error(
      `${platform} is not connected. Go to Integrations and connect via OAuth first.`,
    )
  }

  return token
}
