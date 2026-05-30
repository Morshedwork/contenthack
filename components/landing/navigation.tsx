'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Agents', href: '#agents' },
  { label: 'Live Demo', href: '#demo' },
  { label: 'Pricing', href: '#pricing' },
]

export function Navigation() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/[0.08] bg-black/80 shadow-lg shadow-black/20 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/20 ring-1 ring-violet-400/30">
            <Sparkles className="size-5 text-violet-300" />
          </div>
          <span className="font-display text-xl tracking-tight text-white">ContentOps AI</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-base text-white/60 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            asChild
            variant="ghost"
            className="text-base text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild className="rounded-full shadow-md shadow-violet-500/20">
            <Link href="/dashboard">Launch Demo</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent className="border-white/10 bg-zinc-950">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav className="mt-8 flex flex-col gap-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-lg text-white"
                >
                  {l.label}
                </a>
              ))}
              <Button asChild className="mt-4 rounded-full">
                <Link href="/dashboard">Launch Demo</Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
