'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { investorPitchTourSteps } from '@/lib/demo/investor-pitch'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Presentation, X } from 'lucide-react'

const STORAGE_KEY = 'contentops-investor-tour-dismissed'

interface InvestorPitchGuideProps {
  campaignId: string
}

export function InvestorPitchGuide({ campaignId }: InvestorPitchGuideProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') setDismissed(true)
  }, [])

  const activeStep = investorPitchTourSteps.findIndex(
    (s) => pathname === s.href || (s.href !== '/dashboard' && pathname.startsWith(s.href)),
  )
  const currentStep = activeStep >= 0 ? activeStep + 1 : 0

  if (dismissed) return null

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="mb-6 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-background/80 to-blue-500/5 overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 md:p-5 border-b border-violet-500/20">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
            <Presentation className="size-5 text-violet-300" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-display text-lg leading-tight">Investor pitch walkthrough</p>
              <Badge variant="outline" className="text-[10px] border-violet-500/40 text-violet-200">
                {currentStep > 0 ? `Step ${currentStep} of ${investorPitchTourSteps.length}` : '12-step full flow'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Pre-loaded seed-raise campaign ({campaignId}). Click each stop in order for a live demo narrative.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse tour' : 'Expand tour'}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={dismiss} aria-label="Dismiss tour">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 md:p-5 pt-0 md:pt-0">
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {investorPitchTourSteps.map((stop, i) => {
              const isCurrent = pathname === stop.href || (stop.href !== '/dashboard' && pathname.startsWith(stop.href))
              const isPast = currentStep > 0 && i < activeStep

              return (
                <li key={stop.href}>
                  <Link
                    href={stop.href}
                    className={cn(
                      'flex flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-all hover:bg-violet-500/10',
                      isCurrent
                        ? 'border-violet-500/50 bg-violet-500/15 ring-1 ring-violet-500/30'
                        : isPast
                          ? 'border-emerald-500/25 bg-emerald-500/5'
                          : 'border-border/50 bg-background/30',
                    )}
                  >
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {String(stop.step).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium">{stop.label}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2">{stop.blurb}</span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
