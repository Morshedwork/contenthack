'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { dashboardNavGroups, dashboardQuickActions } from '@/lib/dashboard/nav'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()

  const run = useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [onOpenChange, router],
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command Palette" description="Navigate or run quick actions">
      <CommandInput placeholder="Search pages, agents, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {dashboardQuickActions.map((action) => (
            <CommandItem key={action.label} value={`action ${action.label} ${action.description}`} onSelect={() => run(action.href)}>
              <action.icon className="text-violet-300" />
              <div className="flex flex-col gap-0.5">
                <span>{action.label}</span>
                <span className="text-[10px] text-muted-foreground">{action.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {dashboardNavGroups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.label} ${item.description ?? ''} ${item.keywords?.join(' ') ?? ''}`}
                onSelect={() => run(item.href)}
              >
                <item.icon className="text-muted-foreground" />
                <div className="flex flex-col gap-0.5">
                  <span>{item.label}</span>
                  {item.description && (
                    <span className="text-[10px] text-muted-foreground">{item.description}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return { open, setOpen }
}
