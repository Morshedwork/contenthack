'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/hooks/use-workspace'
import { toast } from 'sonner'

const SOCIAL_PLATFORMS = new Set(['linkedin', 'instagram', 'facebook', 'x', 'tiktok', 'youtube'])

export default function IntegrationsPageClient() {
  const { data, loading, refresh } = useWorkspace()
  const searchParams = useSearchParams()
  const [configuredPlatforms, setConfiguredPlatforms] = useState<Set<string>>(new Set())
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/integrations/status')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.configured)) {
          setConfiguredPlatforms(new Set(json.data.configured))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase()}${connected.slice(1)} connected successfully`)
      void refresh()
      window.history.replaceState({}, '', '/dashboard/integrations')
    } else if (error) {
      toast.error(decodeURIComponent(error))
      window.history.replaceState({}, '', '/dashboard/integrations')
    }
  }, [searchParams, refresh])

  const connect = (platformId: string) => {
    if (!SOCIAL_PLATFORMS.has(platformId)) {
      toast.error('OAuth is only available for social publishing platforms right now')
      return
    }

    if (!configuredPlatforms.has(platformId)) {
      toast.error(
        `${platformId} OAuth is not configured. Add the client ID and secret to .env.local, then restart the dev server.`,
      )
      return
    }

    setConnecting(platformId)
    window.location.href = `/api/integrations/${platformId}/connect`
  }

  const disconnect = async (platformId: string, name: string) => {
    setDisconnecting(platformId)
    try {
      const res = await fetch(`/api/integrations/${platformId}/disconnect`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Disconnect failed')
      await refresh()
      toast.success(`${name} disconnected`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect')
    } finally {
      setDisconnecting(null)
    }
  }

  if (loading || !data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading integrations...</div>
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Connect social accounts via OAuth to publish content directly from ContentOps
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.integrations.map((integration) => {
          const isSocial = SOCIAL_PLATFORMS.has(integration.id)
          const oauthReady = configuredPlatforms.has(integration.id)

          return (
            <Card key={integration.id} className="bg-card/60">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold">
                    {integration.name[0]}
                  </div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    integration.connected ? 'text-emerald-400 border-emerald-400/30' : ''
                  }`}
                >
                  {integration.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {integration.scopes && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Required Scopes</p>
                    <div className="flex flex-wrap gap-1">
                      {integration.scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[9px] font-mono">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {isSocial && !oauthReady && !integration.connected && (
                  <p className="text-[11px] text-amber-400/90">
                    OAuth credentials not configured in .env.local
                  </p>
                )}

                <div className="flex gap-2">
                  {integration.connected ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={disconnecting === integration.id}
                      onClick={() => void disconnect(integration.id, integration.name)}
                    >
                      {disconnecting === integration.id ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={!isSocial || connecting === integration.id}
                      onClick={() => connect(integration.id)}
                    >
                      {connecting === integration.id ? 'Redirecting...' : isSocial ? 'Connect with OAuth' : 'Coming soon'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
