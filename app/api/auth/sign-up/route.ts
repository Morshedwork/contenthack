import { apiError, apiSuccess } from '@/lib/api-utils'
import { confirmUserEmail, createConfirmedUser } from '@/lib/supabase/admin-auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = body?.email as string | undefined
  const password = body?.password as string | undefined

  if (!email || !password) {
    return apiError('Email and password are required', 400)
  }

  if (password.length < 6) {
    return apiError('Password must be at least 6 characters', 400)
  }

  try {
    const { error: createError } = await createConfirmedUser(email, password)

    if (createError) {
      const alreadyRegistered =
        createError.message.toLowerCase().includes('already') ||
        createError.message.toLowerCase().includes('registered')

      if (alreadyRegistered) {
        await confirmUserEmail(email)
      } else {
        return apiError(createError.message, 400)
      }
    }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return apiError(signInError.message, 400)
    }

    return apiSuccess({ ok: true })
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Sign up failed', 500)
  }
}
