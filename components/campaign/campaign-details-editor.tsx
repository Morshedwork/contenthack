'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  CAMPAIGN_STATUS_LABELS,
  formatCampaignDuration,
  formatPlatforms,
  PLATFORM_OPTIONS,
} from '@/lib/campaigns'
import type { Campaign, Platform } from '@/types'
import {
  Building2,
  Calendar,
  Edit3,
  Eye,
  Globe,
  Megaphone,
  Save,
  Target,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface CampaignDetailsEditorProps {
  campaign: Campaign
  onSave: (campaign: Campaign) => Promise<void> | void
}

interface DetailRowProps {
  label: string
  value: string
  multiline?: boolean
}

function DetailRow({ label, value, multiline }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border/50 last:border-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>
        {value || '—'}
      </p>
    </div>
  )
}

export function CampaignDetailsEditor({ campaign, onSave }: CampaignDetailsEditorProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Campaign>(campaign)

  useEffect(() => {
    if (!editing) setDraft(campaign)
  }, [campaign, editing])

  const startEdit = () => {
    setDraft(campaign)
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft(campaign)
    setEditing(false)
  }

  const updateField = <K extends keyof Campaign>(key: K, value: Campaign[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const togglePlatform = (platform: Platform) => {
    setDraft((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const handleSave = async () => {
    if (!draft.companyName.trim()) {
      toast.error('Company name is required')
      return
    }
    if (!draft.campaignGoal.trim()) {
      toast.error('Campaign goal is required')
      return
    }

    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
      toast.success('Campaign details saved')
    } catch {
      toast.error('Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  const c = editing ? draft : campaign

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-violet-500/5 to-blue-500/5 border-violet-500/20">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={
                  c.status === 'active'
                    ? 'text-emerald-400 border-emerald-500/30'
                    : c.status === 'completed'
                      ? 'text-blue-400 border-blue-500/30'
                      : ''
                }
              >
                {CAMPAIGN_STATUS_LABELS[c.status]}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {c.id}
              </Badge>
            </div>
            <h2 className="text-xl font-display tracking-tight">{c.companyName || 'Untitled campaign'}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">{c.campaignGoal}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {!editing ? (
              <Button onClick={startEdit}>
                <Edit3 data-icon="inline-start" />
                Edit details
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                  <X data-icon="inline-start" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save data-icon="inline-start" />
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {!editing ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4 text-violet-300" />
                Business profile
              </CardTitle>
              <CardDescription>Company and market context</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailRow label="Company name" value={c.companyName} />
              <DetailRow label="Industry" value={c.industry} />
              <DetailRow label="Region" value={c.region} />
              <DetailRow label="Product or service" value={c.productService} multiline />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4 text-blue-300" />
                Audience & goal
              </CardTitle>
              <CardDescription>Who you reach and what you want to achieve</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailRow label="Target audience" value={c.targetAudience} multiline />
              <DetailRow label="Campaign goal" value={c.campaignGoal} multiline />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="size-4 text-amber-300" />
                Content strategy
              </CardTitle>
              <CardDescription>Voice, channels, and conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailRow label="Platforms" value={formatPlatforms(c.platforms)} />
              <DetailRow label="Tone" value={c.tone} />
              <DetailRow label="Content frequency" value={c.contentFrequency} />
              <DetailRow label="Main offer" value={c.mainOffer} multiline />
              <DetailRow label="CTA style" value={c.ctaStyle} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-emerald-300" />
                Schedule & status
              </CardTitle>
              <CardDescription>Campaign timeline and lifecycle</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailRow label="Duration" value={formatCampaignDuration(c)} />
              <DetailRow label="Start date" value={c.startDate} />
              <DetailRow label="End date" value={c.endDate} />
              <DetailRow label="Status" value={CAMPAIGN_STATUS_LABELS[c.status]} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4 text-violet-300" />
                Business profile
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  value={draft.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={draft.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={draft.region}
                  onChange={(e) => updateField('region', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="productService">Product or service</Label>
                <Textarea
                  id="productService"
                  value={draft.productService}
                  onChange={(e) => updateField('productService', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="size-4 text-blue-300" />
                Audience & goal
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="targetAudience">Target audience</Label>
                <Textarea
                  id="targetAudience"
                  value={draft.targetAudience}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="campaignGoal">Campaign goal</Label>
                <Textarea
                  id="campaignGoal"
                  value={draft.campaignGoal}
                  onChange={(e) => updateField('campaignGoal', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="size-4 text-amber-300" />
                Content strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label className="mb-2 block">Platforms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORM_OPTIONS.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={draft.platforms.includes(p.id)}
                        onCheckedChange={() => togglePlatform(p.id)}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tone">Tone</Label>
                  <Input
                    id="tone"
                    value={draft.tone}
                    onChange={(e) => updateField('tone', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contentFrequency">Content frequency</Label>
                  <Input
                    id="contentFrequency"
                    value={draft.contentFrequency}
                    onChange={(e) => updateField('contentFrequency', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mainOffer">Main offer</Label>
                <Input
                  id="mainOffer"
                  value={draft.mainOffer}
                  onChange={(e) => updateField('mainOffer', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ctaStyle">CTA style</Label>
                <Input
                  id="ctaStyle"
                  value={draft.ctaStyle}
                  onChange={(e) => updateField('ctaStyle', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-emerald-300" />
                Schedule & status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="endDate">End date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => updateField('status', v as Campaign['status'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!editing && (
        <Card className="border-dashed bg-card/40">
          <CardContent className="py-4 flex items-center gap-3 text-sm text-muted-foreground">
            <Eye className="size-4 shrink-0" />
            <span>
              This is the full campaign record used by research, topic strategy, content studio, and
              workflow agents. Click <strong className="text-foreground">Edit details</strong> to
              update any field.
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
