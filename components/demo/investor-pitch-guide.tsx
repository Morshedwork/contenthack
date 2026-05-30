'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getActiveTourSteps,
  getDemoTourMode,
  setDemoTourMode,
  type DemoTourMode,
} from '@/lib/demo/tour-mode'
import { cn } from '@/lib/utils'
import { ArrowRight, ChevronDown, ChevronUp, Presentation, X } from 'lucide-react'

const STORAGE_KEY = 'contentops-investor-tour-dismissed'

interface InvestorPitchGuideProps {
  campaignId: string
}

export function InvestorPitchGuide({ campaignId }: InvestorPitchGuideProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [tourMode, setTourMode] = useState<DemoTourMode>('quick')

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') setDismissed(true)
    setTourMode(getDemoTourMode())
  }, [])

  const tourSteps = getActiveTourSteps(tourMode)
  const isQuick = tourMode === 'quick'

  const activeStep = tourSteps.findIndex(
    (s) => pathname === s.href || (s.href !== '/dashboard' && pathname.startsWith(s.href)),
  )
  const currentStep = activeStep >= 0 ? activeStep + 1 : 0
  const nextStop =
    activeStep >= 0 && activeStep < tourSteps.length - 1
      ? tourSteps[activeStep + 1]
      : activeStep < 0
        ? tourSteps[0]
        : null

  const switchTourMode = (mode: DemoTourMode) => {
    setDemoTourMode(mode)
    setTourMode(mode)
    setExpanded(mode === 'full')
  }

  if (dismissed) return null

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="mb-6 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-background/80 to-blue-500/5 overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 md:p-5">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
            <Presentation className="size-5 text-violet-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-display text-lg leading-tight">
                {isQuick ? '2-min campaign demo' : 'Full platform tour'}
              </p>
              <Badge variant="outline" className="text-[10px] border-violet-500/40 text-violet-200">
                {currentStep > 0
                  ? `Step ${currentStep}/${tourSteps.length}`
                  : isQuick
                    ? '~2 min · 3 stops'
                    : '~12 min · 12 stops'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isQuick
                ? 'Overview → Content → Leads. Tap Continue or pick a stop.'
                : `Pre-loaded campaign (${campaignId}). Click each stop in order.`}
            </p>

            {isQuick && (
              <ol className="flex flex-wrap gap-2 mt-3">
                {tourSteps.map((stop, i) => {
                  const isCurrent =
                    pathname === stop.href ||
                    (stop.href !== '/dashboard' && pathname.startsWith(stop.href))
                  const isPast = currentStep > 0 && i < activeStep
                  return (
                    <li key={stop.href}>
                      <Link
                        href={stop.href}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          isCurrent
                            ? 'border-violet-500/50 bg-violet-500/20 text-violet-100'
                            : isPast
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                              : 'border-border/50 bg-background/40 text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <span className="font-mono opacity-60">{stop.step}</span>
                        {stop.label}
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )}

            {!isQuick && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs px-2.5"
                  onClick={() => switchTourMode('quick')}
                >
                  Quick (2 min)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs px-2.5"
                  onClick={() => switchTourMode('full')}
                >
                  Full tour (12 stops)
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1">
            {!isQuick && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setExpanded((e) => !e)}
                aria-label={expanded ? 'Collapse tour' : 'Expand tour'}
              >
                {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={dismiss} aria-label="Dismiss tour">
              <X className="size-4" />
            </Button>
          </div>
          {isQuick && nextStop && (
            <Button asChild size="sm" className="rounded-xl">
              <Link href={nextStop.href}>
                Continue: {nextStop.label}
                <ArrowRight data-icon="inline-end" className="size-3.5" />
              </Link>
            </Button>
          )}
          {isQuick && !nextStop && activeStep === tourSteps.length - 1 && (
            <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30 text-xs">
              Demo complete
            </Badge>
          )}
          {isQuick && (
            <button
              type="button"
              onClick={() => switchTourMode('full')}
              className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              12-stop full tour
            </button>
          )}
        </div>
      </div>

      {!isQuick && expanded && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 border-t border-violet-500/20">
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mt-4">
            {tourSteps.map((stop, i) => {
              const isCurrent =
                pathname === stop.href ||
                (stop.href !== '/dashboard' && pathname.startsWith(stop.href))
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
