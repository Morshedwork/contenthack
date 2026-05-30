'use client'

import { ChevronDown, MessageSquarePlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface CustomPromptPanelProps {
  value: string
  onChange: (value: string) => void
  label?: string
  description?: string
  placeholder?: string
  defaultOpen?: boolean
  className?: string
}

export function CustomPromptPanel({
  value,
  onChange,
  label = 'Custom prompt details',
  description = 'Add extra instructions, constraints, examples, or context for the AI to follow.',
  placeholder = 'e.g. Focus on Japan SME market, mention our free audit offer, avoid jargon, use data-backed hooks...',
  defaultOpen = false,
  className,
}: CustomPromptPanelProps) {
  return (
    <Collapsible defaultOpen={defaultOpen || Boolean(value.trim())}>
      <Card className={cn('border-dashed bg-card/40', className)}>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-3 cursor-pointer group">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquarePlus className="size-4 text-violet-300" />
                  {label}
                </CardTitle>
                <CardDescription className="mt-1">{description}</CardDescription>
              </div>
              <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1 transition-transform group-data-[state=open]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="custom-prompt-details" className="sr-only">
                {label}
              </Label>
              <Textarea
                id="custom-prompt-details"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                placeholder={placeholder}
                className="resize-y min-h-[96px]"
              />
              {value.trim() && (
                <p className="text-[10px] text-muted-foreground">
                  These instructions will be appended to the AI prompt for this generation.
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
