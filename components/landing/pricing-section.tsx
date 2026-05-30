'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { GlassCard, SectionHeader, SectionShell } from './landing-ui'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Starter',
    price: '$49',
    desc: 'For solo marketers and founders',
    features: ['1 campaign', '3 AI agents', 'Mock publishing', 'Basic analytics', '50 posts/month'],
  },
  {
    name: 'Growth',
    price: '$149',
    desc: 'For growing marketing teams',
    features: ['5 campaigns', 'All 10 agents', 'Live publishing', 'Lead finder', 'ROI analytics', 'Model routing'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'For agencies and large teams',
    features: ['Unlimited campaigns', 'Custom models', 'SSO & audit logs', 'Priority support', 'MCP integrations'],
  },
]

export function PricingSection() {
  return (
    <SectionShell id="pricing" variant="elevated">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple pricing"
        description="Start with demo mode free. Upgrade when you're ready to go live."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <GlassCard
            key={plan.name}
            className={cn(
              'flex flex-col',
              plan.popular && 'border-violet-400/30 bg-violet-500/[0.08] ring-1 ring-violet-400/20',
            )}
          >
            {plan.popular && (
              <span className="mb-2 text-[10px] font-medium uppercase tracking-wider text-violet-300">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-medium text-white">{plan.name}</h3>
            <p className="mb-4 text-sm text-white/50">{plan.desc}</p>
            <p className="mb-6 font-display text-3xl text-white">
              {plan.price}
              {plan.price !== 'Custom' && (
                <span className="font-sans text-sm text-white/40">/mo</span>
              )}
            </p>
            <ul className="mb-6 flex flex-1 flex-col gap-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="size-4 shrink-0 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant={plan.popular ? 'default' : 'outline'}
              className={cn(
                'w-full rounded-full',
                !plan.popular && 'border-white/20 bg-transparent text-white hover:bg-white/10',
              )}
            >
              <Link href="/dashboard">{plan.price === 'Custom' ? 'Contact Sales' : 'Start Demo'}</Link>
            </Button>
          </GlassCard>
        ))}
      </div>
    </SectionShell>
  )
}
