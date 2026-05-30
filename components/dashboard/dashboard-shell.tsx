'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bot,
  ChevronDown,
  ChevronsUpDown,
  Cpu,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
  Bell,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { isDemoMode } from '@/lib/demo/mode'
import { AgentChat } from '@/components/agents/agent-chat'
import { CommandPalette, useCommandPalette } from '@/components/dashboard/command-palette'
import { dashboardNavGroups, dashboardQuickActions, getPageMeta } from '@/lib/dashboard/nav'

interface DashboardShellProps {
  user: { email?: string; user_metadata?: { full_name?: string } }
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette()
  const demo = isDemoMode()
  const displayName = user.user_metadata?.full_name || user.email || 'Demo User'
  const initial = displayName[0]?.toUpperCase() ?? 'D'
  const pageMeta = getPageMeta(pathname)

  const handleSignOut = async () => {
    if (demo) {
      router.push('/')
      return
    }
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="flex items-center gap-3 px-5 h-[4.25rem] border-b border-sidebar-border shrink-0">
        <div className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/30">
          <Sparkles className="text-white size-5" />
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-sidebar" />
        </div>
        <div className="leading-tight min-w-0">
          <p className="font-display text-base truncate">ContentOps AI</p>
          <p className="text-xs text-muted-foreground">Operations Command</p>
        </div>
      </div>

      <div className="px-4 py-3.5 border-b border-sidebar-border shrink-0">
        <Select defaultValue="cognisor">
          <SelectTrigger className="h-11 text-sm bg-sidebar-accent/30 border-sidebar-border hover:bg-sidebar-accent/50 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-violet-500/20 text-xs font-semibold text-violet-300">
                C
              </div>
              <SelectValue placeholder="Workspace" />
            </div>
            <ChevronsUpDown className="size-4 opacity-50" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cognisor">Cognisor AI</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick actions */}
      <div className="px-4 py-3.5 border-b border-sidebar-border shrink-0">
        <p className="px-1 label-caps mb-2.5">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          {dashboardQuickActions.slice(0, 4).map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={onNavigate}
              className="flex flex-col gap-1.5 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/20 px-3 py-2.5 text-left transition-all hover:bg-violet-500/10 hover:border-violet-500/30 group"
            >
              <action.icon className="size-4 text-violet-300 group-hover:text-violet-200" />
              <span className="text-xs font-medium leading-snug">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto thin-scroll px-4 py-4 flex flex-col gap-5 min-h-0">
        {dashboardNavGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-2 label-caps mb-1.5">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={item.description}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                    active
                      ? 'nav-pill-active text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-0.5 rounded-full bg-gradient-to-b from-violet-400 to-blue-400" />
                  )}
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      active
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'bg-sidebar-accent/30 text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    <item.icon className="size-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4 shrink-0">
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            setChatOpen(true)
          }}
          className="w-full rounded-xl bg-gradient-to-br from-violet-500/15 to-blue-500/10 border border-violet-500/25 p-4 text-left transition-all hover:border-violet-500/40 hover:from-violet-500/20 group"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <MessageSquare className="size-4 text-violet-300 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium">AI Agent Chat</p>
            <Badge variant="secondary" className="ml-auto text-xs h-5 px-2">New</Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Control all agents with a single prompt
          </p>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex dashboard-mesh">
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      <aside className="hidden lg:flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl shrink-0">
        <SidebarBody />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-40 flex items-center px-5 lg:px-6 gap-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar flex flex-col">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Page context */}
          <div className="hidden sm:flex flex-col min-w-0 mr-1">
            <h1 className="page-title truncate leading-tight">{pageMeta.title}</h1>
            {pageMeta.description && (
              <p className="text-xs text-muted-foreground truncate md:text-sm">{pageMeta.description}</p>
            )}
          </div>

          <div className="flex-1" />

          {/* Search trigger */}
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2.5 h-11 px-4 rounded-xl border border-border/60 bg-secondary/30 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors min-w-[220px] max-w-xs"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 text-left text-sm truncate">Search or jump to…</span>
            <kbd className="hidden md:inline-flex items-center rounded border border-border/60 bg-background/60 px-2 py-0.5 text-xs font-mono">
              ⌘K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden shrink-0"
            onClick={() => setCmdOpen(true)}
            aria-label="Search"
          >
            <Search />
          </Button>

          <Select defaultValue="gpt-4o">
            <SelectTrigger className="w-[150px] h-11 text-sm hidden md:flex bg-secondary/30 border-border/60 rounded-xl">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-violet-300" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
              <SelectItem value="gpt-4o-mini">GPT-4o mini</SelectItem>
              <SelectItem value="o4-mini">o4-mini</SelectItem>
            </SelectContent>
          </Select>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="hidden xl:flex h-11 rounded-xl border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200"
          >
            <Link href="/dashboard/agents">
              <Zap data-icon="inline-start" className="size-3.5" />
              Run Workflow
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="relative rounded-lg shrink-0">
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-1.5 bg-violet-400 rounded-full ring-2 ring-background" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2.5 h-11 rounded-xl pl-2 pr-3 shrink-0">
                <div className="size-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-semibold text-white">
                  {initial}
                </div>
                <span className="text-base hidden md:inline truncate max-w-[120px]">{displayName}</span>
                <ChevronDown className="size-4 opacity-50 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <p className="text-base font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/impact-report">Impact Report</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
                <LogOut data-icon="inline-start" />
                {signingOut ? 'Signing out...' : demo ? 'Exit Demo' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-7">{children}</main>
      </div>

      {pathname !== '/dashboard/chat' && (
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-5 right-5 z-50 size-12 rounded-2xl shadow-xl shadow-violet-500/30 bg-gradient-to-br from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 p-0 border border-white/10"
              aria-label="Open AI Chat"
            >
              <MessageSquare className="size-5 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col border-l border-violet-500/20">
            <SheetTitle className="sr-only">AI Chat</SheetTitle>
            <div className="px-5 pt-5 pb-4 border-b border-border/60 shrink-0 bg-gradient-to-r from-violet-500/10 to-transparent">
              <h2 className="font-display text-xl flex items-center gap-2.5">
                <Bot className="size-5 text-violet-300" />
                AI Chat
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Basic chat or agent mode for your pipeline
              </p>
            </div>
            <div className="flex-1 min-h-0 p-4">
              <AgentChat variant="widget" className="h-full" />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
