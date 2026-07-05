'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { UnifiedAssistant } from '@/components/assistant/unified-assistant'
import { LiveVoiceAssistant } from '@/components/assistant/live-voice-assistant'
import { AssistantModeSwitcher } from '@/components/assistant/assistant-page-shell'
import { MessageSquare, Sparkles } from 'lucide-react'

type WidgetMode = 'chat' | 'live-agent'

const WIDGET_MODES = [
  { id: 'chat' as const, label: 'Text chat', icon: MessageSquare, description: 'Type prompts & run agents', accent: 'violet' as const },
  { id: 'live-agent' as const, label: 'Live voice', icon: Sparkles, description: 'Speak naturally in real time', accent: 'rose' as const },
]

interface AssistantWidgetProps {
  className?: string
}

/** Floating sheet widget — toggles between text chat and live voice. */
export function AssistantWidget({ className }: AssistantWidgetProps) {
  const [mode, setMode] = useState<WidgetMode>('chat')

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}>
      <AssistantModeSwitcher modes={WIDGET_MODES} value={mode} onChange={setMode} compact />
      {mode === 'chat' ? (
        <UnifiedAssistant variant="widget" className="min-h-0 flex-1" />
      ) : (
        <LiveVoiceAssistant variant="widget" className="min-h-0 flex-1" />
      )}
      {mode === 'chat' && (
        <p className="shrink-0 text-center text-[11px] text-muted-foreground">
          Need voice?{' '}
          <Link href="/dashboard/voice" className="text-rose-300 hover:underline">
            Open Live Voice
          </Link>
        </p>
      )}
    </div>
  )
}
