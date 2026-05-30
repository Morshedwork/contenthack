import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function apiFromError(err: unknown, fallback = 'Request failed') {
  const message = err instanceof Error ? err.message : fallback
  const status = message === 'Unauthorized' ? 401 : 500
  return apiError(message, status)
}

export async function simulateDelay(ms = 600) {
  await new Promise((r) => setTimeout(r, ms))
}
