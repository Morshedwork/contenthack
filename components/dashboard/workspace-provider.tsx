'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { WorkspacePayload } from '@/lib/workspace/client'
import { fetchWorkspace, patchWorkspaceClient } from '@/lib/workspace/client'

type WorkspaceContextValue = {
  data: WorkspacePayload | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  patch: (body: Record<string, unknown>) => Promise<WorkspacePayload>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
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
    void refresh()
  }, [refresh])

  const patch = useCallback(async (body: Record<string, unknown>) => {
    const ws = await patchWorkspaceClient(body)
    setData(ws)
    setLoading(false)
    return ws
  }, [])

  const value = useMemo(
    () => ({ data, loading, error, refresh, patch }),
    [data, loading, error, refresh, patch],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return ctx
}
