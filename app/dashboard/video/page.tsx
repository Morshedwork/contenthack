'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { BrandThemeReferenceSelect } from '@/components/brand/brand-theme-reference-select'
import { useWorkspace } from '@/hooks/use-workspace'
import type { GeneratedVideo, VideoScript } from '@/types'
import { Archive, Copy, Film, Loader2, Send, Sparkles, Clock, Play } from 'lucide-react'
import { toast } from 'sonner'

export default function VideoStudioPage() {
  const { data, refresh } = useWorkspace()
  const [scripts, setScripts] = useState<VideoScript[]>([])
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [topic, setTopic] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoModel, setVideoModel] = useState<'v4.5' | 'v6'>('v4.5')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9')
  const [customPromptDetails, setCustomPromptDetails] = useState('')
  const [brandThemeId, setBrandThemeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [studioTab, setStudioTab] = useState('scripts')
  const [latestVideo, setLatestVideo] = useState<GeneratedVideo | null>(null)

  useEffect(() => {
    if (data?.videoScripts) setScripts(data.videoScripts)
    if (data?.generatedVideos) setVideos(data.generatedVideos)
    if (data?.topics[0]?.title && !topic) setTopic(data.topics[0].title)
  }, [data, topic])

  const script = scripts[0]

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          count: 3,
          customPromptDetails: customPromptDetails.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Video generation failed')
      setScripts(json.data.scripts)
      await refresh()
      toast.success(`Video scripts generated${json.data.live ? ' (OpenAI)' : ' (demo)'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate video scripts')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateVideo = async () => {
    const prompt = videoPrompt.trim() || scripts[0]?.aiVideoPrompt || topic.trim()
    if (!prompt) {
      toast.error('Enter a video prompt or generate scripts first')
      return
    }
    setVideoLoading(true)
    try {
      const res = await fetch('/api/media/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: videoModel,
          aspectRatio,
          duration: 5,
          customPromptDetails: customPromptDetails.trim() || undefined,
          brandThemeId: brandThemeId && brandThemeId !== 'none' ? brandThemeId : undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Video generation failed')
      setLatestVideo(json.data.video)
      setVideos(json.data.videos)
      await refresh()
      toast.success(
        json.data.live
          ? `Video generated with PixVerse ${videoModel}`
          : 'Demo video — set PIXVERSE_API_KEY for live generation',
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate video')
    } finally {
      setVideoLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Video Studio</h1>
          <p className="text-muted-foreground text-sm">
            Script writing + AI video generation with PixVerse
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
            <Film className="size-3.5" />
            PixVerse {videoModel}
          </Badge>
        </div>
      </div>

      <Tabs value={studioTab} onValueChange={setStudioTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="scripts" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Script Writer
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-1.5">
            <Film className="size-3.5" />
            AI Video (PixVerse)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card className="mb-6 border-violet-500/20 bg-violet-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generate AI video</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="video-prompt">Video prompt</Label>
                  <Input
                    id="video-prompt"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder={scripts[0]?.aiVideoPrompt?.slice(0, 80) || 'Describe the video scene...'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Model</Label>
                    <Select value={videoModel} onValueChange={(v) => setVideoModel(v as 'v4.5' | 'v6')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v4.5">PixVerse v4.5</SelectItem>
                        <SelectItem value="v6">PixVerse v6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Aspect ratio</Label>
                    <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as '16:9' | '9:16')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 Landscape</SelectItem>
                        <SelectItem value="9:16">9:16 Reels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <BrandThemeReferenceSelect
                brandProfile={data?.brandProfile}
                value={brandThemeId || data?.brandProfile?.activeThemeId || 'none'}
                onChange={setBrandThemeId}
                description="Apply extracted brand palette and visual style to PixVerse generation."
              />
              <CustomPromptPanel
                value={customPromptDetails}
                onChange={setCustomPromptDetails}
                description="Motion, pacing, camera movement, style notes for PixVerse."
                placeholder="e.g. Smooth camera pan, cinematic lighting, professional corporate style, energetic motion..."
              />
              <div className="flex justify-end">
                <Button onClick={() => void handleGenerateVideo()} disabled={videoLoading}>
                  {videoLoading ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Film data-icon="inline-start" />
                  )}
                  {videoLoading ? 'Generating video (up to 3 min)...' : 'Generate Video'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {latestVideo?.videoUrl && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="size-4" />
                  Latest video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <video
                  src={latestVideo.videoUrl}
                  controls
                  className="w-full max-w-2xl mx-auto rounded-xl border border-border/60"
                />
                <p className="text-xs text-muted-foreground mt-3 text-center">{latestVideo.prompt}</p>
              </CardContent>
            </Card>
          )}

          {videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((v) => (
                <Card key={v.id} className="bg-card/60">
                  <CardContent className="p-4">
                    {v.videoUrl ? (
                      <video src={v.videoUrl} controls className="w-full rounded-lg mb-3" />
                    ) : (
                      <div className="aspect-video bg-secondary/40 rounded-lg flex items-center justify-center mb-3">
                        <Badge variant="outline">{v.status}</Badge>
                      </div>
                    )}
                    <p className="text-xs line-clamp-2">{v.prompt}</p>
                    <Badge variant="secondary" className="text-[10px] mt-2">{v.model}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scripts">
          <div className="flex justify-end mb-4">
            <Button onClick={() => void handleGenerate()} disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              Generate Scripts
            </Button>
          </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generation settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="video-topic">Topic focus (optional)</Label>
            <Input
              id="video-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How SMEs save 20 hours/week with AI agents"
            />
          </div>
          <CustomPromptPanel
            value={customPromptDetails}
            onChange={setCustomPromptDetails}
            description="Manual video brief — style, pacing, visual direction, platform (Reels/Shorts/TikTok), duration."
            placeholder="e.g. Fast-paced 45s Reel, bold on-screen text, B-roll of office automation, energetic voiceover, end with free audit CTA..."
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {scripts.map((vs) => (
            <Card key={vs.id} className="bg-card/60">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{vs.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock /> {vs.duration}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">{vs.status.replace(/_/g, ' ')}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-lg bg-violet-500/10 p-3 border border-violet-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">First 3-second hook</p>
                  <p className="text-sm font-medium">{vs.hook}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium text-muted-foreground">Scene Timeline</p>
                  {vs.scenes.map((scene, i) => (
                    <div key={scene.title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="size-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-mono">{i + 1}</div>
                        {i < vs.scenes.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                      </div>
                      <div className="flex-1 rounded-lg border border-border/50 p-3 mb-1">
                        <p className="text-sm font-medium mb-1">{scene.title}</p>
                        <p className="text-xs text-muted-foreground mb-1">{scene.voiceover}</p>
                        <p className="text-[10px] text-violet-400">{scene.onScreenText}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Visuals: {scene.visuals}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-secondary/30 p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">AI Video Prompt</p>
                  <p className="text-xs">{vs.aiVideoPrompt}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(vs.aiVideoPrompt); toast.success('Prompt copied') }}>
                    <Copy data-icon="inline-start" />Copy Prompt
                  </Button>
                  <Button size="sm" onClick={() => toast.success('Sent to approval board')}>
                    <Send data-icon="inline-start" />Send to Approval
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {script && (
          <Card className="h-fit sticky top-20">
            <CardHeader><CardTitle className="text-base">Preview Panel</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="font-medium">{script.title}</p>
              <p className="text-xs text-muted-foreground">{script.hook}</p>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">B-Roll Suggestions</p>
                {script.bRoll.map((b) => <Badge key={b} variant="outline" className="mr-1 mb-1 text-[10px]">{b}</Badge>)}
              </div>
              <p className="text-xs"><span className="text-muted-foreground">CTA:</span> {script.cta}</p>
              <p className="text-xs"><span className="text-muted-foreground">Duration:</span> {script.duration}</p>
              <Button size="sm" variant="outline" onClick={() => {
                setVideoPrompt(script.aiVideoPrompt)
                setStudioTab('generate')
                toast.success('Prompt loaded — click Generate Video')
              }}>
                <Film data-icon="inline-start" />
                Use prompt in PixVerse
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
