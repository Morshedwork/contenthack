import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode, DEMO_USER } from '@/lib/demo/mode'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isDemoMode()) {
    return (
      <DashboardShell user={DEMO_USER}>
        {children}
        <Toaster />
      </DashboardShell>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <DashboardShell user={user}>
      {children}
      <Toaster />
    </DashboardShell>
  )
}
