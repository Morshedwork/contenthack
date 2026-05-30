import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient()
  let page = 1

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data.users.length) return null

    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (user) return user.id

    if (data.users.length < 200) break
    page++
  }

  return null
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
