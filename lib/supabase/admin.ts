import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceEnv } from './env'

export function createAdminClient() {
  const env = getSupabaseServiceEnv()
  if (!env) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  return createClient(env.url, env.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
