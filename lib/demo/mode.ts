export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE !== 'false'
}

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@cognisor.ai',
  user_metadata: { full_name: 'Demo User' },
}
