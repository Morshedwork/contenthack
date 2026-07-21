'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import {
  GPT_IMAGE_2_RESOLUTION_OPTIONS,
  GPT_IMAGE_2_THINKING_OPTIONS,
  GPT_IMAGE_QUALITY_OPTIONS,
  IMAGE_ASPECT_RATIOS,
  IMAGE_PROMPT_MODELS,
  OPENAI_RENDER_MODELS,
  POLLINATIONS_RENDER_MODELS,
  OPENROUTER_RENDER_MODELS,
  OPENROUTER_IMAGE_QUALITY_OPTIONS,
  OPENROUTER_IMAGE_RESOLUTION_OPTIONS,
  type OpenRouterImageQualityId,
  type OpenRouterImageResolutionId,
  getImageRenderProvider,
  isGptImage2RenderModel,
  isGptImageRenderModel,
  type GptImage2ResolutionId,
  type GptImage2ThinkingId,
  type GptImageQualityId,
  type ImageAspectRatioId,
  type ImagePromptModelId,
  type ImageRenderModelId,
} from '@/lib/models/media-options'
import { SelectGroup, SelectLabel } from '@/components/ui/select'
import { BrandThemeReferenceSelect } from '@/components/brand/brand-theme-reference-select'
import { useWorkspace } from '@/hooks/use-workspace'
import type { GeneratedImage } from '@/types'
import { Archive, Copy, Download, ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function ImageStudioPage() {
  const { data, refresh } = useWorkspace()
  const [prompt, setPrompt] = useState('')
  const [promptModel, setPromptModel] = useState<ImagePromptModelId>('kimi-k2.5')
  const [renderModel, setRenderModel] = useState<ImageRenderModelId>('flux')
  const [openaiQuality, setOpenaiQuality] = useState<'standard' | 'hd'>('standard')
  const [gptImageQuality, setGptImageQuality] = useState<GptImageQualityId>('medium')
  const [gptImage2Resolution, setGptImage2Resolution] = useState<GptImage2ResolutionId>('2k')
  const [gptImageThinking, setGptImageThinking] = useState<GptImage2ThinkingId>('off')
  const [openrouterResolution, setOpenrouterResolution] = useState<OpenRouterImageResolutionId>('2k')
  const [openrouterQuality, setOpenrouterQuality] = useState<OpenRouterImageQualityId>('medium')
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatioId>('1:1')
  const renderProvider = getImageRenderProvider(renderModel)
  const isOpenAIRender = renderProvider === 'openai'
  const isOpenRouterRender = renderProvider === 'openrouter'
  const isGptImage = isGptImageRenderModel(renderModel)
  const isGptImage2 = isGptImage2RenderModel(renderModel)
  const showQualityControl = renderModel === 'dall-e-3' || isGptImage
  const showGptImage2Controls = isGptImage2
  const showOpenRouterControls = isOpenRouterRender
  const [customPromptDetails, setCustomPromptDetails] = useState('')
  const [brandThemeId, setBrandThemeId] = useState('')
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [latest, setLatest] = useState<GeneratedImage | null>(null)
  const [hasOpenAI, setHasOpenAI] = useState(false)
  const [hasOpenRouter, setHasOpenRouter] = useState(false)

  useEffect(() => {
    if (data?.generatedImages) setImages(data.generatedImages)
  }, [data?.generatedImages])

  useEffect(() => {
    void fetch('/api/media/providers')
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return
        setHasOpenAI(Boolean(json.data.openai))
        setHasOpenRouter(Boolean(json.data.openrouter))
        if (json.data.defaultRenderModel) setRenderModel(json.data.defaultRenderModel)
        if (json.data.defaultPromptModel) setPromptModel(json.data.defaultPromptModel)
        if (!json.data.openai) {
          setPromptModel((current) =>
            IMAGE_PROMPT_MODELS.find((m) => m.id === current)?.provider === 'openai'
              ? (json.data.defaultPromptModel as ImagePromptModelId)
              : current,
          )
          setRenderModel((current) =>
            getImageRenderProvider(current) === 'openai'
              ? (json.data.defaultRenderModel as ImageRenderModelId)
              : current,
          )
        }
      })
      .catch(() => {})
  }, [])

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
          promptModel,
          renderModel,
          aspectRatio,
          openaiQuality: isOpenAIRender && renderModel === 'dall-e-3' ? openaiQuality : undefined,
          gptImageQuality: isOpenAIRender && isGptImage ? gptImageQuality : undefined,
          gptImage2Resolution: isOpenAIRender && isGptImage2 ? gptImage2Resolution : undefined,
          gptImageThinking: isOpenAIRender && isGptImage2 ? gptImageThinking : undefined,
          openrouterResolution: isOpenRouterRender ? openrouterResolution : undefined,
          openrouterQuality: isOpenRouterRender ? openrouterQuality : undefined,
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
          ? `Image generated · ${renderModel} render`
          : 'Demo image generated — set OPENAI_API_KEY for live GPT Image generation',
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
            GPT Image 2.0, GPT Image 1.5, DALL·E, and OpenRouter models — with GPT-4o or Kimi prompt enhancement
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
            {renderModel} · {promptModel}
          </Badge>
        </div>
      </div>

      <Card className="mb-6 border-violet-500/20 bg-violet-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-violet-400" />
            Generate marketing image
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            Free = Pollinations. OpenRouter Budget = cheapest paid (no true $0 image models on OpenRouter).
          </p>
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
          <div className={`grid grid-cols-1 gap-3 ${showQualityControl || showGptImage2Controls || showOpenRouterControls ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
            <div className="flex flex-col gap-1.5">
              <Label>Prompt model</Label>
              <Select value={promptModel} onValueChange={(v) => setPromptModel(v as ImagePromptModelId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hasOpenAI && (
                    <SelectGroup>
                      <SelectLabel>OpenAI</SelectLabel>
                      {IMAGE_PROMPT_MODELS.filter((m) => m.provider === 'openai').map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  <SelectGroup>
                    <SelectLabel>Moonshot (Kimi)</SelectLabel>
                    {IMAGE_PROMPT_MODELS.filter((m) => m.provider === 'kimi').map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Image model</Label>
              <Select value={renderModel} onValueChange={(v) => setRenderModel(v as ImageRenderModelId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hasOpenAI && (
                    <SelectGroup>
                      <SelectLabel>OpenAI</SelectLabel>
                      {OPENAI_RENDER_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  <SelectGroup>
                    <SelectLabel>Free · Pollinations</SelectLabel>
                    {POLLINATIONS_RENDER_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label} (free)
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>OpenRouter · Budget</SelectLabel>
                    {OPENROUTER_RENDER_MODELS.filter((m) => m.tier === 'budget').map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>OpenRouter · Standard</SelectLabel>
                    {OPENROUTER_RENDER_MODELS.filter((m) => m.tier === 'standard').map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>OpenRouter · Premium</SelectLabel>
                    {OPENROUTER_RENDER_MODELS.filter((m) => m.tier === 'premium').map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Aspect ratio</Label>
              <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as ImageAspectRatioId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMAGE_ASPECT_RATIOS.map((ar) => (
                    <SelectItem key={ar.id} value={ar.id}>
                      {ar.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderModel === 'dall-e-3' && (
              <div className="flex flex-col gap-1.5">
                <Label>DALL·E quality</Label>
                <Select
                  value={openaiQuality}
                  onValueChange={(v) => setOpenaiQuality(v as 'standard' | 'hd')}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="hd">HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {isGptImage && (
              <div className="flex flex-col gap-1.5">
                <Label>GPT Image quality</Label>
                <Select
                  value={gptImageQuality}
                  onValueChange={(v) => setGptImageQuality(v as GptImageQualityId)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GPT_IMAGE_QUALITY_OPTIONS.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showOpenRouterControls && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Resolution</Label>
                  <Select
                    value={openrouterResolution}
                    onValueChange={(v) => setOpenrouterResolution(v as OpenRouterImageResolutionId)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPENROUTER_IMAGE_RESOLUTION_OPTIONS.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Quality</Label>
                  <Select
                    value={openrouterQuality}
                    onValueChange={(v) => setOpenrouterQuality(v as OpenRouterImageQualityId)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPENROUTER_IMAGE_QUALITY_OPTIONS.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {isGptImage2 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Resolution</Label>
                  <Select
                    value={gptImage2Resolution}
                    onValueChange={(v) => setGptImage2Resolution(v as GptImage2ResolutionId)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GPT_IMAGE_2_RESOLUTION_OPTIONS.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Thinking mode</Label>
                  <Select
                    value={gptImageThinking}
                    onValueChange={(v) => setGptImageThinking(v as GptImage2ThinkingId)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GPT_IMAGE_2_THINKING_OPTIONS.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground -mt-1">
            {IMAGE_PROMPT_MODELS.find((m) => m.id === promptModel)?.description}
            {' · '}
            {[...OPENAI_RENDER_MODELS, ...POLLINATIONS_RENDER_MODELS, ...OPENROUTER_RENDER_MODELS].find((m) => m.id === renderModel)?.description}
            {isOpenAIRender
              ? hasOpenAI
                ? ' · Powered by OPENAI_API_KEY'
                : ' · Requires OPENAI_API_KEY in .env.local'
              : isOpenRouterRender
                ? hasOpenRouter
                  ? ' · Powered by OPENROUTER_API_KEY'
                  : ' · Requires OPENROUTER_API_KEY in .env.local'
                : ' · Pollinations render (free)'}
          </p>
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
