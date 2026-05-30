'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BrandProfile } from '@/types'
import { BrandThemeSwatches } from './brand-theme-swatches'

export function BrandThemeReferenceSelect({
  brandProfile,
  value,
  onChange,
  label = 'Brand theme reference',
  description = 'Apply extracted brand colors and visual style to this generation.',
}: {
  brandProfile?: BrandProfile | null
  value: string
  onChange: (themeId: string) => void
  label?: string
  description?: string
}) {
  const themes = brandProfile?.themeCollection ?? []
  if (themes.length === 0) return null

  const selected = value || brandProfile?.activeThemeId || themes[0]?.id || 'none'

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select brand theme reference" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No theme reference</SelectItem>
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              <span className="flex items-center gap-2">
                <BrandThemeSwatches colors={theme.colors} size="sm" />
                <span>{theme.companyName}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}
