import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServiceEnv } from '@/lib/supabase/env'

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const env = getSupabaseServiceEnv()
  if (!env) return null

  const res = await fetch(
    `${env.url}/auth/v1/admin/users?filter=${encodeURIComponent(`email.eq.${email}`)}`,
    {
      headers: {
        Authorization: `Bearer ${env.serviceKey}`,
        apikey: env.serviceKey,
      },
    },
  )

  if (!res.ok) return null

  const json = (await res.json()) as { users?: { id: string }[] }
  return json.users?.[0]?.id ?? null
}

export async function confirmUserEmail(email: string): Promise<boolean> {
  const userId = await getUserIdByEmail(email)
  if (!userId) return false

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })

  return !error
}

export async function createConfirmedUser(email: string, password: string) {
  const admin = createAdminClient()
  return admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
}
