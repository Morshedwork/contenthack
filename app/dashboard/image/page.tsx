'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { BrandThemeReferenceSelect } from '@/components/brand/brand-theme-reference-select'
import { useWorkspace } from '@/hooks/use-workspace'
import type { GeneratedImage } from '@/types'
import { Archive, Copy, Download, ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function ImageStudioPage() {
  const { data, refresh } = useWorkspace()
  const [prompt, setPrompt] = useState('')
  const [customPromptDetails, setCustomPromptDetails] = useState('')
  const [brandThemeId, setBrandThemeId] = useState('')
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [latest, setLatest] = useState<GeneratedImage | null>(null)

  useEffect(() => {
    if (data?.generatedImages) setImages(data.generatedImages)
  }, [data?.generatedImages])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Enter a prompt to generate an image')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/media/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          customPromptDetails: customPromptDetails.trim() || undefined,
          brandThemeId: brandThemeId && brandThemeId !== 'none' ? brandThemeId : undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Image generation failed')
      setLatest(json.data.image)
      setImages(json.data.images)
      await refresh()
      toast.success(
        json.data.live
          ? 'Image generated with Kimi K2.5'
          : 'Demo image generated — set KIMI_API_KEY for live generation',
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = (image: GeneratedImage) => {
    const link = document.createElement('a')
    link.href = image.imageUrl
    link.download = `contentops-${image.id}.jpg`
    link.click()
    toast.success('Download started')
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Image Studio</h1>
          <p className="text-muted-foreground text-sm">
            AI image generation powered by Kimi K2.5 (Moonshot AI)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/library">
              <Archive data-icon="inline-start" />
              Content Library
            </Link>
          </Button>
          <Badge variant="secondary" className="w-fit gap-1.5 py-1.5 px-3">
            <ImageIcon className="size-3.5" />
            Kimi K2.5
          </Badge>
        </div>
      </div>

      <Card className="mb-6 border-violet-500/20 bg-violet-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-violet-400" />
            Generate marketing image
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-prompt">Image prompt</Label>
            <Textarea
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Professional LinkedIn banner for an AI automation company, modern gradient, team collaborating with holographic dashboards"
              rows={3}
            />
          </div>
          <BrandThemeReferenceSelect
            brandProfile={data?.brandProfile}
            value={brandThemeId || data?.brandProfile?.activeThemeId || 'none'}
            onChange={setBrandThemeId}
          />
          <CustomPromptPanel
            value={customPromptDetails}
            onChange={setCustomPromptDetails}
            description="Visual direction — style, colors, composition, platform (Instagram/LinkedIn), mood."
            placeholder="e.g. Photorealistic, purple and blue brand colors, clean minimal layout, no text overlay, 1:1 aspect for Instagram..."
          />
          <div className="flex justify-end">
            <Button onClick={() => void handleGenerate()} disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {loading ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {latest && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">Latest generation</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{latest.enhancedPrompt}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[10px]">{latest.model}</Badge>
              <Badge variant="outline" className="text-[10px]">{latest.style}</Badge>
              <Badge variant="outline" className="text-[10px]">{latest.aspectRatio}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl overflow-hidden border border-border/60 bg-secondary/20 max-w-2xl mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={latest.imageUrl}
                alt={latest.prompt}
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="flex gap-2 mt-4 justify-center">
              <Button size="sm" variant="outline" onClick={() => downloadImage(latest)}>
                <Download data-icon="inline-start" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(latest.enhancedPrompt)
                  toast.success('Prompt copied')
                }}
              >
                <Copy data-icon="inline-start" />
                Copy prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">Recent generations</h2>
          <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
            <Link href="/dashboard/library">View all in Library →</Link>
          </Button>
        </div>
        {images.length === 0 ? (
          <p className="text-muted-foreground text-sm py-12 text-center">
            No images yet. Enter a prompt above and click Generate Image.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <Card key={img.id} className="overflow-hidden bg-card/60">
                <div className="aspect-square relative bg-secondary/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <p className="text-xs font-medium line-clamp-2 mb-2">{img.prompt}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">{img.model}</Badge>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setLatest(img)}>
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
