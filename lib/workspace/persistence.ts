import { createAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServiceEnv } from '@/lib/supabase/env'
import { isDemoMode } from '@/lib/demo/mode'
import type { WorkspaceState } from '@/lib/workspace/store'

/** True when service role + DB persistence are configured (not demo-only in-memory). */
export function hasSupabasePersistence(): boolean {
  return !isDemoMode() && getSupabaseServiceEnv() !== null
}

export async function loadWorkspaceState(workspaceId: string): Promise<WorkspaceState | null> {
  if (isDemoMode()) return null

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('workspace_state')
      .select('state')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      console.warn('[workspace] load failed:', error.message)
      return null
    }
    if (!data?.state) return null

    return data.state as WorkspaceState
  } catch (err) {
    console.warn('[workspace] load error:', err)
    return null
  }
}

export async function saveWorkspaceState(workspaceId: string, state: WorkspaceState): Promise<void> {
  if (isDemoMode()) return

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('workspace_state').upsert(
      {
        workspace_id: workspaceId,
        state: state as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id' },
    )

    if (error) {
      console.warn('[workspace] save failed (using in-memory state):', error.message)
    }
  } catch (err) {
    console.warn('[workspace] save error (using in-memory state):', err)
  }
}
