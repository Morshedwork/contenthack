import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasSupabasePersistence } from '@/lib/workspace/persistence'
import type { PlatformIntegration } from '@/types'
import type { OAuthPlatform } from './platforms'
import type { OAuthTokenResponse } from './oauth'

export interface StoredIntegrationCredentials {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
  scope?: string
  connectedAt: string
}

interface PlatformIntegrationRow {
  id: string
  workspace_id: string
  platform: string
  connected: boolean
  mock_mode: boolean
  credentials: StoredIntegrationCredentials | null
  scopes: string[] | null
  updated_at: string
}

function toStoredCredentials(token: OAuthTokenResponse): StoredIntegrationCredentials {
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : undefined,
    tokenType: token.token_type,
    scope: token.scope,
    connectedAt: new Date().toISOString(),
  }
}

export async function saveIntegrationCredentials(
  workspaceId: string,
  platform: OAuthPlatform,
  token: OAuthTokenResponse,
  scopes: string[],
): Promise<void> {
  const credentials = toStoredCredentials(token)

  if (!hasSupabasePersistence()) {
    inMemoryCredentials.set(`${workspaceId}:${platform}`, credentials)
    return
  }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('platform_integrations')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('platform', platform)
    .maybeSingle()

  const row = {
    workspace_id: workspaceId,
    platform,
    connected: true,
    mock_mode: false,
    credentials,
    scopes,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await admin.from('platform_integrations').update(row).eq('id', existing.id)
    if (error) throw new Error(error.message)
    return
  }

  const { error } = await admin.from('platform_integrations').insert(row)
  if (error) throw new Error(error.message)
}

export async function disconnectIntegration(
  workspaceId: string,
  platform: OAuthPlatform,
): Promise<void> {
  inMemoryCredentials.delete(`${workspaceId}:${platform}`)

  if (!hasSupabasePersistence()) return

  const admin = createAdminClient()
  const { error } = await admin
    .from('platform_integrations')
    .update({
      connected: false,
      mock_mode: false,
      credentials: null,
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .eq('platform', platform)

  if (error) throw new Error(error.message)
}

export async function loadIntegrationCredentials(
  workspaceId: string,
  platform: OAuthPlatform,
): Promise<StoredIntegrationCredentials | null> {
  const cached = inMemoryCredentials.get(`${workspaceId}:${platform}`)
  if (cached) return cached

  if (!hasSupabasePersistence()) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('platform_integrations')
    .select('connected, credentials')
    .eq('workspace_id', workspaceId)
    .eq('platform', platform)
    .maybeSingle()

  if (error || !data?.connected || !data.credentials) return null
  return data.credentials as StoredIntegrationCredentials
}

export async function loadConnectedPlatforms(workspaceId: string): Promise<Set<string>> {
  const connected = new Set<string>()

  for (const [key, value] of inMemoryCredentials.entries()) {
    if (key.startsWith(`${workspaceId}:`) && value.accessToken) {
      connected.add(key.split(':')[1]!)
    }
  }

  if (!hasSupabasePersistence()) return connected

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('platform_integrations')
    .select('platform, connected')
    .eq('workspace_id', workspaceId)
    .eq('connected', true)

  if (error || !data) return connected

  for (const row of data as Pick<PlatformIntegrationRow, 'platform'>[]) {
    connected.add(row.platform)
  }

  return connected
}

export function mergeIntegrationConnectionState(
  integrations: PlatformIntegration[],
  connectedPlatforms: Set<string>,
): PlatformIntegration[] {
  return integrations.map((integration) => {
    const isConnected = connectedPlatforms.has(integration.id)
    return isConnected
      ? { ...integration, connected: true, mockMode: false, apiStatus: 'healthy' as const }
      : { ...integration, connected: false, mockMode: false }
  })
}

const inMemoryCredentials = new Map<string, StoredIntegrationCredentials>()
