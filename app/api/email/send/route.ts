import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { hasEmailProvider, isValidEmail, sendEmail } from '@/lib/email/send'

export const maxDuration = 30

export async function GET() {
  return apiSuccess({ enabled: hasEmailProvider() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const to = typeof body?.to === 'string' ? body.to.trim() : ''
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const text = typeof body?.body === 'string' ? body.body.trim() : ''

  if (!isValidEmail(to)) return apiError('A valid recipient email is required', 400)
  if (!subject || !text) return apiError('subject and body are required', 400)
  if (!hasEmailProvider()) {
    return apiError('RESEND_API_KEY is not configured — add it to .env.local, or use Copy / Open in mail app', 400)
  }

  try {
    const result = await sendEmail({ to, subject, body: text })
    return apiSuccess(result)
  } catch (err) {
    return apiFromError(err, 'Email send failed')
  }
}
