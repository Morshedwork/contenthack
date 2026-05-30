'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BrandProfile, ExtractedBrandTheme } from '@/types'
import { BrandThemeSwatches } from './brand-theme-swatches'
import { ExternalLink, Loader2, Palette, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function BrandThemeCollectionPanel({
  brand,
  onChange,
  onSave,
}: {
  brand: BrandProfile
  onChange: (next: BrandProfile) => void
  onSave: () => Promise<void>
}) {
  const [url, setUrl] = useState('')
  const [extracting, setExtracting] = useState(false)

  const themes = brand.themeCollection ?? []

  const handleExtract = async () => {
    const trimmed = url.trim()
    if (!trimmed) {
      toast.error('Enter a company website URL')
      return
    }
    setExtracting(true)
    try {
      const res = await fetch('/api/brand/extract-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Extraction failed')
      onChange(json.data.brandProfile)
      setUrl('')
      toast.success(
        json.data.live
          ? `Theme extracted for ${json.data.theme.companyName}`
          : `Theme extracted (heuristic) for ${json.data.theme.companyName}`,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to extract brand theme')
    } finally {
      setExtracting(false)
    }
  }

  const setActive = (themeId: string) => {
    onChange({ ...brand, activeThemeId: themeId })
  }

  const removeTheme = (themeId: string) => {
    const next = themes.filter((t) => t.id !== themeId)
    onChange({
      ...brand,
      themeCollection: next,
      activeThemeId: brand.activeThemeId === themeId ? next[0]?.id : brand.activeThemeId,
    })
  }

  return (
    <Card className="border-violet-500/20 bg-violet-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="size-4 text-violet-400" />
          Extracted brand theme collection
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <Label htmlFor="brand-url">Company website URL</Label>
            <Input
              id="brand-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://company.com"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void handleExtract()} disabled={extracting}>
              {extracting ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Palette data-icon="inline-start" />
              )}
              {extracting ? 'Extracting...' : 'Extract theme'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          The Brand Theme Agent scans the site for colors, typography, and visual style. Extracted themes
          can be used as references in Image Studio and Video Studio.
        </p>

        {themes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border/60 rounded-lg">
            No themes extracted yet. Enter a company URL above or run the Brand Theme Agent from Command Center.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                active={brand.activeThemeId === theme.id}
                onSetActive={() => setActive(theme.id)}
                onRemove={() => removeTheme(theme.id)}
              />
            ))}
          </div>
        )}

        <Button variant="outline" onClick={() => void onSave()} className="w-fit">
          Save theme collection
        </Button>
      </CardContent>
    </Card>
  )
}

function ThemeCard({
  theme,
  active,
  onSetActive,
  onRemove,
}: {
  theme: ExtractedBrandTheme
  active: boolean
  onSetActive: () => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm">{theme.companyName}</p>
            {active && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Star className="size-3" />
                Active reference
              </Badge>
            )}
          </div>
          <a
            href={theme.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {theme.sourceUrl}
            <ExternalLink className="size-3" />
          </a>
        </div>
        <BrandThemeSwatches colors={theme.colors} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {theme.colors.map((color) => (
          <div key={`${theme.id}-${color.role}`} className="flex items-center gap-2 text-xs">
            <span
              className="size-4 rounded border border-border/60 shrink-0"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-muted-foreground capitalize">{color.role}</span>
            <span className="font-mono">{color.hex}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground grid gap-1 sm:grid-cols-3">
        <p><span className="text-foreground/80">Style:</span> {theme.visualStyle}</p>
        <p><span className="text-foreground/80">Typography:</span> {theme.typography}</p>
        <p><span className="text-foreground/80">Mood:</span> {theme.mood}</p>
      </div>

      {theme.notes && <p className="text-xs text-muted-foreground">{theme.notes}</p>}

      <div className="flex gap-2">
        {!active && (
          <Button size="sm" variant="outline" onClick={onSetActive}>
            Set as active reference
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 data-icon="inline-start" />
          Remove
        </Button>
      </div>
    </div>
  )
}
