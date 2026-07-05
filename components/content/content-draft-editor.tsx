'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { ContentDraft } from '@/types'
import { Loader2, Save } from 'lucide-react'

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-500/10 text-blue-400',
  instagram: 'bg-pink-500/10 text-pink-400',
  facebook: 'bg-indigo-500/10 text-indigo-400',
  x: 'bg-sky-500/10 text-sky-400',
  carousel: 'bg-purple-500/10 text-purple-400',
  email: 'bg-amber-500/10 text-amber-400',
}

interface ContentDraftEditorProps {
  draft: ContentDraft | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (draft: ContentDraft) => Promise<void> | void
}

export function ContentDraftEditor({ draft, open, onOpenChange, onSave }: ContentDraftEditorProps) {
  const [form, setForm] = useState<ContentDraft | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (draft && open) setForm({ ...draft })
  }, [draft, open])

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      await onSave(form)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  if (!form) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col border-l border-violet-500/20">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="font-display">Edit Content</SheetTitle>
            <Badge className={platformColors[form.platform] || 'bg-secondary'}>
              {form.platform === 'x' ? 'X' : form.platform}
            </Badge>
          </div>
          <SheetDescription>Refine hook, body copy, CTA, and hashtags before approval.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="hook">Hook / Headline</Label>
            <Input
              id="hook"
              value={form.hook}
              onChange={(e) => setForm({ ...form, hook: e.target.value })}
              placeholder="Attention-grabbing opening line"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mainCopy">Main Copy</Label>
            <Textarea
              id="mainCopy"
              value={form.mainCopy}
              onChange={(e) => setForm({ ...form, mainCopy: e.target.value })}
              placeholder="Full post body..."
              rows={8}
              className="resize-y min-h-[160px]"
            />
            <p className="text-[10px] text-muted-foreground text-right">{form.mainCopy.length} characters</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cta">Call to Action</Label>
            <Input
              id="cta"
              value={form.cta}
              onChange={(e) => setForm({ ...form, cta: e.target.value })}
              placeholder="e.g. Book a free audit →"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input
              id="hashtags"
              value={form.hashtags.join(' ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  hashtags: e.target.value
                    .split(/\s+/)
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)),
                })
              }
              placeholder="#marketing #AI #contentops"
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Preview</p>
            <p className="text-sm font-medium mb-2">{form.hook || '—'}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap mb-2">{form.mainCopy || '—'}</p>
            {form.cta && <p className="text-xs text-primary mb-2">{form.cta}</p>}
            {form.hashtags.length > 0 && (
              <p className="text-[10px] text-muted-foreground">{form.hashtags.join(' ')}</p>
            )}
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 border-t border-border/60 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
