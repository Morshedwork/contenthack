'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVoiceLanguage } from '@/hooks/use-voice-language'
import { VOICE_LANGUAGES, type VoiceLanguageCode } from '@/lib/voice/languages'
import { cn } from '@/lib/utils'
import { Languages } from 'lucide-react'

interface VoiceLanguageSelectProps {
  className?: string
  compact?: boolean
}

export function VoiceLanguageSelect({ className, compact }: VoiceLanguageSelectProps) {
  const { languageCode, setLanguage } = useVoiceLanguage()

  return (
    <Select value={languageCode} onValueChange={(value) => setLanguage(value as VoiceLanguageCode)}>
      <SelectTrigger
        size={compact ? 'sm' : 'default'}
        className={cn('min-w-[9rem]', className)}
        aria-label="Voice language"
      >
        <Languages className="size-4 opacity-70" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">Auto · detect</SelectItem>
        {VOICE_LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.nativeLabel}
            {!compact && lang.nativeLabel !== lang.label ? ` · ${lang.label}` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
