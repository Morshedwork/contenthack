import type { Platform } from '@/types'

export type OAuthPlatform = Extract<Platform, 'linkedin' | 'instagram' | 'facebook' | 'x' | 'tiktok' | 'youtube'>

export interface PlatformOAuthConfig {
  id: OAuthPlatform
  name: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  clientIdEnv: string
  clientSecretEnv: string
  extraAuthParams?: Record<string, string>
  usePkce?: boolean
}

export const OAUTH_PLATFORMS: Record<OAuthPlatform, PlatformOAuthConfig> = {
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['openid', 'profile', 'w_member_social', 'email'],
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scopes: [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
    ],
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    clientIdEnv: 'X_CLIENT_ID',
    clientSecretEnv: 'X_CLIENT_SECRET',
    extraAuthParams: { code_challenge_method: 'S256' },
    usePkce: true,
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scopes: ['user.info.basic', 'video.publish'],
    clientIdEnv: 'TIKTOK_CLIENT_KEY',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
  },
}

export function isOAuthPlatform(platform: string): platform is OAuthPlatform {
  return platform in OAUTH_PLATFORMS
}

export function getPlatformCredentials(platform: OAuthPlatform) {
  const config = OAUTH_PLATFORMS[platform]
  const clientId = process.env[config.clientIdEnv]?.trim()
  const clientSecret = process.env[config.clientSecretEnv]?.trim()
  return { config, clientId, clientSecret, configured: Boolean(clientId && clientSecret) }
}

export function getOAuthRedirectUri(origin: string, platform: OAuthPlatform) {
  return `${origin.replace(/\/$/, '')}/api/integrations/${platform}/callback`
}
