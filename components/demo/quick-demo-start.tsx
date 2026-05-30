'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { loadQuickCampaignDemoClient } from '@/lib/workspace/client'
import { setDemoTourMode } from '@/lib/demo/tour-mode'
import { cn } from '@/lib/utils'
import { Loader2, Play, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface QuickDemoStartProps {
  onLoaded?: () => void
  className?: string
  size?: 'default' | 'lg' | 'sm'
  variant?: 'default' | 'outline'
  label?: string
}

export function QuickDemoStart({
  onLoaded,
  className,
  size = 'lg',
  variant = 'default',
  label = 'Start 2-min demo',
}: QuickDemoStartProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      setDemoTourMode('quick')
      await loadQuickCampaignDemoClient()
      toast.success('Demo loaded — Overview → Content → Leads (~2 min)')
      onLoaded?.()
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load demo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(className)}
      disabled={loading}
      onClick={handleStart}
    >
      {loading ? (
        <Loader2 data-icon="inline-start" className="animate-spin" />
      ) : variant === 'default' ? (
        <Sparkles data-icon="inline-start" />
      ) : (
        <Play data-icon="inline-start" />
      )}
      {loading ? 'Loading demo...' : label}
    </Button>
  )
}
