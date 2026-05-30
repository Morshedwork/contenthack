'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWorkspace } from '@/hooks/use-workspace'
import type { BrandProfile, SafetySettings } from '@/types'
import { BrandThemeCollectionPanel } from '@/components/brand/brand-theme-collection'
import { toast } from 'sonner'

export function SettingsContent() {
  const { data, loading, patch } = useWorkspace()
  const [brand, setBrand] = useState<BrandProfile | null>(null)
  const [safety, setSafety] = useState<SafetySettings | null>(null)

  useEffect(() => {
    if (data) {
      setBrand(data.brandProfile)
      setSafety(data.safetySettings)
    }
  }, [data])

  const saveBrand = async () => {
    if (!brand) return
    try {
      await patch({ brandProfile: brand })
      toast.success('Brand profile saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save brand profile')
    }
  }

  const saveSafety = async () => {
    if (!safety) return
    try {
      await patch({ safetySettings: safety })
      toast.success('Safety settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save safety settings')
    }
  }

  if (loading || !brand || !safety) {
    return <div className="p-8 text-sm text-muted-foreground">Loading settings...</div>
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Brand profile and safety configuration</p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList className="mb-6">
          <TabsTrigger value="brand">Brand Profile</TabsTrigger>
          <TabsTrigger value="safety">Safety Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="flex flex-col gap-6 max-w-3xl">
          <BrandThemeCollectionPanel
            brand={brand}
            onChange={setBrand}
            onSave={saveBrand}
          />
          <Card>
            <CardHeader><CardTitle className="text-base">Brand Profile</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4 max-w-xl">
              {[
                { id: 'name', label: 'Brand name', key: 'brandName' as const },
                { id: 'desc', label: 'Brand description', key: 'brandDescription' as const, textarea: true },
                { id: 'audience', label: 'Target audience', key: 'targetAudience' as const },
                { id: 'tone', label: 'Tone', key: 'tone' as const },
                { id: 'product', label: 'Product description', key: 'productDescription' as const, textarea: true },
                { id: 'offer', label: 'Main offer', key: 'mainOffer' as const },
                { id: 'cta', label: 'CTA style', key: 'ctaStyle' as const },
              ].map((f) => (
                <div key={f.id} className="flex flex-col gap-1.5">
                  <Label htmlFor={f.id}>{f.label}</Label>
                  {f.textarea ? (
                    <Textarea
                      id={f.id}
                      value={brand[f.key]}
                      onChange={(e) => setBrand((prev) => prev && { ...prev, [f.key]: e.target.value })}
                      rows={2}
                    />
                  ) : (
                    <Input
                      id={f.id}
                      value={brand[f.key]}
                      onChange={(e) => setBrand((prev) => prev && { ...prev, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <Label>Words to avoid</Label>
                <Input
                  value={brand.wordsToAvoid.join(', ')}
                  onChange={(e) =>
                    setBrand((prev) =>
                      prev ? { ...prev, wordsToAvoid: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } : prev,
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Content rules</Label>
                <Textarea
                  value={brand.contentRules.join('\n')}
                  onChange={(e) =>
                    setBrand((prev) =>
                      prev ? { ...prev, contentRules: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) } : prev,
                    )
                  }
                  rows={3}
                />
              </div>
              <Button onClick={() => void saveBrand()} className="w-fit">Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety">
          <Card>
            <CardHeader><CardTitle className="text-base">Safety Settings</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4 max-w-xl">
              {[
                { key: 'requireApprovalBeforePosting' as const, label: 'Require approval before posting' },
                { key: 'enableBrandSafetyCheck' as const, label: 'Enable brand safety check' },
                { key: 'enableClaimDetection' as const, label: 'Enable claim detection' },
                { key: 'enableSpamRiskDetection' as const, label: 'Enable spam risk detection' },
                { key: 'enableOutreachApproval' as const, label: 'Enable outreach approval' },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <Label htmlFor={s.key}>{s.label}</Label>
                  <Switch
                    id={s.key}
                    checked={safety[s.key]}
                    onCheckedChange={(v) => setSafety((prev) => prev && { ...prev, [s.key]: v })}
                  />
                </div>
              ))}
              <Button onClick={() => void saveSafety()} className="w-fit mt-2">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
