import 'server-only'

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

/**
 * Email delivery for manager-drafted outreach via Nodemailer + SMTP.
 *
 * Required in `.env.local`:
 *   SMTP_HOST, SMTP_USER, SMTP_PASS
 *
 * Optional:
 *   SMTP_PORT      (default 587)
 *   SMTP_SECURE    (true for port 465)
 *   EMAIL_FROM     (default: SMTP_USER)
 *   EMAIL_REPLY_TO
 *
 * Without SMTP config the UI falls back to copy-to-clipboard and mailto links.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let transporter: Transporter | null = null

function smtpHost(): string | undefined {
  const host = process.env.SMTP_HOST?.trim()
  if (!host) return undefined
  // If someone pastes an @gmail.com address as host, use Google's SMTP server.
  if (host.includes('@')) return 'smtp.gmail.com'
  return host
}

function smtpUser(): string | undefined {
  return process.env.SMTP_USER?.trim()
}

function smtpPass(): string | undefined {
  const pass = process.env.SMTP_PASS?.trim()
  // Gmail app passwords are often pasted with spaces — strip them for auth.
  return pass?.replace(/\s+/g, '')
}

function smtpPort(): number {
  const raw = process.env.SMTP_PORT?.trim()
  const n = raw ? Number(raw) : 587
  return Number.isFinite(n) ? n : 587
}

function smtpSecure(): boolean {
  if (process.env.SMTP_SECURE?.trim().toLowerCase() === 'true') return true
  return smtpPort() === 465
}

export function hasEmailProvider(): boolean {
  return Boolean(smtpHost() && smtpUser() && smtpPass())
}

export function emailFrom(): string {
  return (
    process.env.SMTP_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    smtpUser() ||
    'ContentOps AI <noreply@localhost>'
  )
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

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

function getTransporter(): Transporter {
  if (transporter) return transporter

  const host = smtpHost()
  const user = smtpUser()
  const pass = smtpPass()
  if (!host || !user || !pass) {
    throw new Error(
      'SMTP is not configured — set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local',
    )
  }

  transporter = nodemailer.createTransport({
    host,
    port: smtpPort(),
    secure: smtpSecure(),
    auth: { user, pass },
  })

  return transporter
}

/** Send a plain-text email via Nodemailer. Throws with a readable message on failure. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = input.to.trim()
  if (!isValidEmail(to)) throw new Error('A valid recipient email address is required')
  if (!input.subject.trim()) throw new Error('Email subject is required')
  if (!input.body.trim()) throw new Error('Email body is required')

  const transport = getTransporter()
  const replyTo = input.replyTo?.trim() || process.env.EMAIL_REPLY_TO?.trim()

  const info = await transport.sendMail({
    from: emailFrom(),
    to,
    subject: input.subject.trim(),
    text: input.body.trim(),
    ...(replyTo ? { replyTo } : {}),
  })

  return { id: info.messageId || `email-${Date.now()}`, to }
}
