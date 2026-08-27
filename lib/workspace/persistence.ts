import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServiceEnv } from '@/lib/supabase/env'
import { isDemoMode } from '@/lib/demo/mode'
import { DEMO_WORKSPACE_ID } from '@/lib/workspace/context'
import type { WorkspaceState } from '@/lib/workspace/store'

const DEMO_STATE_FILE = join(process.cwd(), '.contentops-demo-workspace.json')

/** True when service role + DB persistence are configured (not demo-only in-memory). */
export function hasSupabasePersistence(): boolean {
  return !isDemoMode() && getSupabaseServiceEnv() !== null
}

async function loadDemoWorkspaceState(): Promise<WorkspaceState | null> {
  try {
    return JSON.parse(await readFile(DEMO_STATE_FILE, 'utf8')) as WorkspaceState
  } catch {
    return null
  }
}

async function saveDemoWorkspaceState(state: WorkspaceState): Promise<void> {
  await writeFile(DEMO_STATE_FILE, JSON.stringify(state, null, 2), 'utf8')
}

export async function loadWorkspaceState(workspaceId: string): Promise<WorkspaceState | null> {
  if (workspaceId === DEMO_WORKSPACE_ID) return loadDemoWorkspaceState()
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
  if (workspaceId === DEMO_WORKSPACE_ID) {
    await saveDemoWorkspaceState(state)
    return
  }
  if (isDemoMode()) return

  if (!hasSupabasePersistence()) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required to save workspace data. Add it to your server environment (e.g. Vercel) and run supabase/schema.sql.',
    )
  }

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
    throw new Error(`Failed to save workspace: ${error.message}`)
  }
}
