import { apiError, apiSuccess } from '@/lib/api-utils'
import { confirmUserEmail } from '@/lib/supabase/admin-auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = body?.email as string | undefined
  const password = body?.password as string | undefined

  if (!email || !password) {
    return apiError('Email and password are required', 400)
  }

  try {
    const supabase = await createClient()
    let { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error?.message === 'Email not confirmed') {
      await confirmUserEmail(email)
      ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
    }

    if (error) {
      return apiError(error.message, 401)
    }

    return apiSuccess({ ok: true })
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Sign in failed', 500)
  }
}
