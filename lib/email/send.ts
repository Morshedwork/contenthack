import 'server-only'

/**
 * Email delivery for manager-drafted outreach.
 *
 * - RESEND_API_KEY → enables real sending via Resend's REST API
 * - EMAIL_FROM     → verified sender (defaults to Resend's onboarding sender for testing)
 *
 * Without a key the UI falls back to copy-to-clipboard and mailto links,
 * so outreach always has a path out the door.
 */
const RESEND_BASE = 'https://api.resend.com'
const DEFAULT_FROM = 'ContentOps AI <onboarding@resend.dev>'

function getApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim()
}

export function hasEmailProvider(): boolean {
  return Boolean(getApiKey())
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM
}

export interface SendEmailInput {
  to: string
  subject: string
  body: string
  replyTo?: string
}

export interface SendEmailResult {
  id: string
  to: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

/** Send a plain-text email via Resend. Throws with a readable message on failure. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured — add it to .env.local to send emails')
  }

  const to = input.to.trim()
  if (!isValidEmail(to)) throw new Error('A valid recipient email address is required')
  if (!input.subject.trim()) throw new Error('Email subject is required')
  if (!input.body.trim()) throw new Error('Email body is required')

  const res = await fetch(`${RESEND_BASE}/emails`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [to],
      subject: input.subject.trim(),
      text: input.body.trim(),
      ...(input.replyTo?.trim() ? { reply_to: input.replyTo.trim() } : {}),
    }),
  })

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string }
  if (!res.ok) {
    throw new Error(data.message || `Email send failed (${res.status})`)
  }

  return { id: data.id ?? `email-${Date.now()}`, to }
}
