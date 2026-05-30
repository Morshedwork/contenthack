import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasSupabaseConfig } from '@/lib/supabase/env'
import { isDemoMode, DEMO_USER } from '@/lib/demo/mode'

export interface WorkspaceContext {
  userId: string
  workspaceId: string
}

export const DEMO_WORKSPACE_ID = '00000000-0000-4000-8000-000000000001'

export async function resolveWorkspaceContext(options?: {
  allowAnonymous?: boolean
}): Promise<WorkspaceContext> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    return { userId: DEMO_USER.id, workspaceId: DEMO_WORKSPACE_ID }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (options?.allowAnonymous) {
      return { userId: DEMO_USER.id, workspaceId: DEMO_WORKSPACE_ID }
    }
    throw new Error('Unauthorized')
  }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    return { userId: user.id, workspaceId: existing.id }
  }

  const { data: created, error } = await admin
    .from('workspaces')
    .insert({ name: 'My Workspace', owner_id: user.id })
    .select('id')
    .single()

  if (error || !created) {
    throw new Error(error?.message ?? 'Failed to create workspace')
  }

  return { userId: user.id, workspaceId: created.id }
}
