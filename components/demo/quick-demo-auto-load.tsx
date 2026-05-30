'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { loadQuickCampaignDemoClient } from '@/lib/workspace/client'
import { isInvestorPitchCampaign } from '@/lib/demo/investor-pitch'
import { setDemoTourMode } from '@/lib/demo/tour-mode'
import { isDemoMode } from '@/lib/demo/mode'
import { useWorkspace } from '@/hooks/use-workspace'
import { toast } from 'sonner'

const AUTO_DEMO_KEY = 'contentops-auto-demo-loaded'

async function loadQuickDemo() {
  setDemoTourMode('quick')
  await loadQuickCampaignDemoClient()
  toast.success('Demo ready — 3 stops, ~2 min')
}

/** Loads quick demo from ?demo=quick or auto on first dashboard visit in demo mode. */
export function QuickDemoAutoLoad() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { data, refresh } = useWorkspace()
  const started = useRef(false)

  useEffect(() => {
    if (searchParams.get('demo') !== 'quick' || started.current) return
    started.current = true
    sessionStorage.setItem(AUTO_DEMO_KEY, '1')

    ;(async () => {
      try {
        await loadQuickDemo()
        await refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load demo')
      } finally {
        router.replace('/dashboard')
        router.refresh()
      }
    })()
  }, [searchParams, router, refresh])

  useEffect(() => {
    if (!isDemoMode() || pathname !== '/dashboard' || !data || started.current) return
    if (searchParams.get('demo') === 'quick') return
    if (sessionStorage.getItem(AUTO_DEMO_KEY) === '1') return
    if (isInvestorPitchCampaign(data.campaign.id)) return

    started.current = true
    sessionStorage.setItem(AUTO_DEMO_KEY, '1')

    ;(async () => {
      try {
        await loadQuickDemo()
        await refresh()
        router.refresh()
      } catch {
        /* non-blocking */
      }
    })()
  }, [pathname, data, searchParams, refresh, router])

  return null
}
