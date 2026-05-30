import { apiError, apiSuccess } from '@/lib/api-utils'
import { confirmUserEmail } from '@/lib/supabase/admin-auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = body?.email as string | undefined

  if (!email) {
    return apiError('Email is required', 400)
  }

  try {
    const ok = await confirmUserEmail(email)
    if (!ok) {
      return apiError('User not found', 404)
    }
    return apiSuccess({ ok: true })
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Confirmation failed', 500)
  }
}
