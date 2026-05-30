'use client'

import { useCallback, useEffect, useState } from 'react'
import type { WorkspacePayload } from '@/lib/workspace/client'
import { fetchWorkspace, patchWorkspaceClient } from '@/lib/workspace/client'

export function useWorkspace() {
  const [data, setData] = useState<WorkspacePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const ws = await fetchWorkspace()
      setData(ws)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      const ws = await patchWorkspaceClient(body)
      setData(ws)
      return ws
    },
    [],
  )

  return { data, loading, error, refresh, patch }
}
