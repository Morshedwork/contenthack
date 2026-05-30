'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { SectionShell } from './landing-ui'

export function CtaSection() {
  return (
    <SectionShell className="pb-32">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-black to-blue-600/15 p-10 text-center md:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.2),transparent_70%)]"
        />
        <div className="relative">
          <h2 className="font-display text-3xl tracking-tight text-white md:text-4xl text-balance">
            Ready to transform your content operations?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/55">
            Launch the demo dashboard and explore the full Cognisor AI campaign workflow — no API keys required.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full px-8 shadow-lg shadow-violet-500/25">
            <Link href="/dashboard">
              Launch Demo Dashboard
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </SectionShell>
  )
}
