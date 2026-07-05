'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { BrandThemeReferenceSelect } from '@/components/brand/brand-theme-reference-select'
import { FullReelCampaignPipeline } from '@/components/video/video-agent-pipeline'
import { ReelsFromContentPanel } from '@/components/video/reels-from-content-panel'
import { PromotionReelsPanel } from '@/components/video/promotion-reels-panel'
import { VideoScriptCard } from '@/components/video/video-script-card'
import { useWorkspace } from '@/hooks/use-workspace'
import type { GeneratedVideo, VideoScript } from '@/types'
import type { PixverseModel, PixverseQuality } from '@/lib/ai/pixverse'
import {
  VIDEO_ASPECT_RATIOS,
  VIDEO_MODELS,
  VIDEO_QUALITIES,
  getVideoDurationsForModel,
  type VideoDurationSec,
} from '@/lib/models/media-options'
import {
  Archive,
  Bot,
  Clapperboard,
  Film,
  Layers,
  Loader2,
  Megaphone,
  Play,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

type ScriptFilter = 'all' | 'content' | 'promotion' | 'topic'

export default function VideoStudioPage() {
  const { data, refresh } = useWorkspace()
  const [scripts, setScripts] = useState<VideoScript[]>([])
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [topic, setTopic] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoModel, setVideoModel] = useState<PixverseModel>('v4.5')
  const [videoDuration, setVideoDuration] = useState<VideoDurationSec>(5)
  const [videoQuality, setVideoQuality] = useState<PixverseQuality>('540p')
  const [aspectRatio, setAspectRatio] = useState<(typeof VIDEO_ASPECT_RATIOS)[number]['id']>('9:16')
  const [customPromptDetails, setCustomPromptDetails] = useState('')
  const [brandThemeId, setBrandThemeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [batchVideoLoading, setBatchVideoLoading] = useState(false)
  const [studioTab, setStudioTab] = useState('agents')
  const [scriptFilter, setScriptFilter] = useState<ScriptFilter>('all')
  const [selectedScriptIds, setSelectedScriptIds] = useState<string[]>([])
  const [latestVideo, setLatestVideo] = useState<GeneratedVideo | null>(null)

  const durationOptions = getVideoDurationsForModel(videoModel)
  const contentDrafts = data?.contentDrafts ?? []
  const topicCount = data?.topics?.length ?? 0

  useEffect(() => {
    if (data?.videoScripts) setScripts(data.videoScripts)
    if (data?.generatedVideos) setVideos(data.generatedVideos)
    if (data?.topics[0]?.title && !topic) setTopic(data.topics[0].title)
  }, [data, topic])

  useEffect(() => {
    if (!durationOptions.includes(videoDuration)) {
      setVideoDuration(durationOptions[0])
    }
    if (videoQuality === '1080p' && videoDuration === 8) {
      setVideoDuration(5)
    }
  }, [videoModel, videoQuality, videoDuration, durationOptions])

  useEffect(() => {
    void fetch('/api/media/providers')
      .then((r) => r.json())
      .then((json) => {
        if (!json.success || !json.data.defaultVideoModel) return
        setVideoModel(json.data.defaultVideoModel)
      })
      .catch(() => {})
  }, [])

  const filteredScripts = useMemo(() => {
    return scripts.filter((s) => {
      if (scriptFilter === 'content') return Boolean(s.sourceContentId)
      if (scriptFilter === 'promotion') return Boolean(s.promotionType)
      if (scriptFilter === 'topic') return !s.sourceContentId && !s.promotionType
      return true
    })
  }, [scripts, scriptFilter])

  const handleGenerateTopicScripts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'topic',
          topic: topic.trim() || undefined,
          count: 3,
          format: 'reel',
          merge: true,
          customPromptDetails: customPromptDetails.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Video generation failed')
      setScripts(json.data.scripts)
      await refresh()
      toast.success(`Topic scripts generated${json.data.live ? ' (OpenAI)' : ' (demo)'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate video scripts')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateVideo = async (promptOverride?: string) => {
    const prompt = promptOverride || videoPrompt.trim() || scripts[0]?.aiVideoPrompt || topic.trim()
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
          duration: videoDuration,
          quality: videoQuality,
          customPromptDetails: customPromptDetails.trim() || undefined,
          brandThemeId: brandThemeId && brandThemeId !== 'none' ? brandThemeId : undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Video generation failed')
      setLatestVideo(json.data.video)
      setVideos(json.data.videos)
      await refresh()
      if (json.data.warnings?.length) {
        json.data.warnings.forEach((w: string) => toast.warning(w))
      }
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

  const handleBatchGenerateVideos = async () => {
    const targets =
      selectedScriptIds.length > 0
        ? scripts.filter((s) => selectedScriptIds.includes(s.id) && s.aiVideoPrompt)
        : filteredScripts.filter((s) => s.aiVideoPrompt).slice(0, 3)

    if (!targets.length) {
      toast.error('Select scripts with AI video prompts, or generate scripts first')
      return
    }

    setBatchVideoLoading(true)
    let successCount = 0
    try {
      for (const script of targets) {
        toast.info(`Generating video ${successCount + 1}/${targets.length}: ${script.title.slice(0, 30)}...`)
        const res = await fetch('/api/media/video/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: script.aiVideoPrompt,
            model: videoModel,
            aspectRatio,
            duration: videoDuration,
            quality: videoQuality,
            customPromptDetails: customPromptDetails.trim() || undefined,
            brandThemeId: brandThemeId && brandThemeId !== 'none' ? brandThemeId : undefined,
          }),
        })
        const json = await res.json()
        if (json.success) {
          successCount++
          setLatestVideo(json.data.video)
          setVideos(json.data.videos)
        }
      }
      await refresh()
      toast.success(`Generated ${successCount} of ${targets.length} videos`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Batch video generation failed')
    } finally {
      setBatchVideoLoading(false)
    }
  }

  const toggleScriptSelection = (id: string, selected: boolean) => {
    setSelectedScriptIds((prev) =>
      selected ? [...prev, id] : prev.filter((x) => x !== id),
    )
  }

  const scriptCounts = {
    all: scripts.length,
    content: scripts.filter((s) => s.sourceContentId).length,
    promotion: scripts.filter((s) => s.promotionType).length,
    topic: scripts.filter((s) => !s.sourceContentId && !s.promotionType).length,
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Video Studio</h1>
          <p className="text-muted-foreground text-sm">
            Multi-agent reel pipelines · content adaptation · promotion campaigns · PixVerse render
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/library">
              <Archive data-icon="inline-start" />
              Content Library
            </Link>
          </Button>
          <Badge variant="secondary" className="w-fit gap-1.5 py-1.5 px-3">
            <Film className="size-3.5" />
            PixVerse {videoModel} · {videoDuration}s · {aspectRatio}
          </Badge>
        </div>
      </div>

      <Tabs value={studioTab} onValueChange={setStudioTab}>
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="agents" className="gap-1.5">
            <Bot className="size-3.5" />
            Agent Pipeline
          </TabsTrigger>
          <TabsTrigger value="content-reels" className="gap-1.5">
            <Layers className="size-3.5" />
            Reels from Content
          </TabsTrigger>
          <TabsTrigger value="promotion" className="gap-1.5">
            <Megaphone className="size-3.5" />
            Promotion Reels
          </TabsTrigger>
          <TabsTrigger value="scripts" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Topic Scripts
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-1.5">
            <Film className="size-3.5" />
            AI Video
            {videos.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {videos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5">
            <Clapperboard className="size-3.5" />
            Script Library
            {scripts.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {scripts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <FullReelCampaignPipeline
            draftCount={contentDrafts.length}
            topicCount={topicCount}
            onComplete={() => void refresh()}
          />
        </TabsContent>

        <TabsContent value="content-reels">
          <ReelsFromContentPanel
            contentDrafts={contentDrafts}
            topicCount={topicCount}
            onGenerated={() => void refresh()}
          />
        </TabsContent>

        <TabsContent value="promotion">
          <PromotionReelsPanel
            draftCount={contentDrafts.length}
            topicCount={topicCount}
            onGenerated={() => void refresh()}
          />
        </TabsContent>

        <TabsContent value="scripts">
          <div className="flex justify-end mb-4">
            <Button onClick={() => void handleGenerateTopicScripts()} disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              Generate Topic Scripts
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Topic-based script writer</CardTitle>
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
                description="Manual video brief — style, pacing, visual direction, platform, duration."
                placeholder="e.g. Fast-paced 45s Reel, bold on-screen text, B-roll of office automation..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card className="mb-6 border-violet-500/20 bg-violet-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generate AI video</CardTitle>
              <p className="text-xs text-muted-foreground">
                Single or batch generation from selected scripts. Defaults to 9:16 for Reels.
              </p>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Model</Label>
                    <Select value={videoModel} onValueChange={(v) => setVideoModel(v as PixverseModel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VIDEO_MODELS.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Duration</Label>
                    <Select
                      value={String(videoDuration)}
                      onValueChange={(v) => setVideoDuration(Number(v) as VideoDurationSec)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((sec) => (
                          <SelectItem key={sec} value={String(sec)}>{sec}s</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Quality</Label>
                    <Select value={videoQuality} onValueChange={(v) => setVideoQuality(v as PixverseQuality)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VIDEO_QUALITIES.map((q) => (
                          <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Aspect ratio</Label>
                    <Select
                      value={aspectRatio}
                      onValueChange={(v) =>
                        setAspectRatio(v as (typeof VIDEO_ASPECT_RATIOS)[number]['id'])
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VIDEO_ASPECT_RATIOS.map((ar) => (
                          <SelectItem key={ar.id} value={ar.id}>{ar.label}</SelectItem>
                        ))}
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
                placeholder="e.g. Smooth camera pan, cinematic lighting, vertical Reel style..."
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleBatchGenerateVideos()}
                  disabled={batchVideoLoading || videoLoading}
                >
                  {batchVideoLoading ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Layers data-icon="inline-start" />
                  )}
                  {batchVideoLoading
                    ? 'Batch generating...'
                    : `Multi-Generate (${selectedScriptIds.length || Math.min(filteredScripts.length, 3)} scripts)`}
                </Button>
                <Button onClick={() => void handleGenerateVideo()} disabled={videoLoading || batchVideoLoading}>
                  {videoLoading ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Film data-icon="inline-start" />
                  )}
                  {videoLoading ? 'Generating...' : 'Generate Single Video'}
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
                  className="w-full max-w-sm mx-auto rounded-xl border border-border/60"
                />
                <p className="text-xs text-muted-foreground mt-3 text-center">{latestVideo.prompt}</p>
              </CardContent>
            </Card>
          )}

          {videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v) => (
                <Card key={v.id} className="bg-card/60">
                  <CardContent className="p-4">
                    {v.videoUrl ? (
                      <video src={v.videoUrl} controls className="w-full rounded-lg mb-3 max-h-64" />
                    ) : (
                      <div className="aspect-[9/16] max-h-64 bg-secondary/40 rounded-lg flex items-center justify-center mb-3">
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

        <TabsContent value="library">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <Tabs value={scriptFilter} onValueChange={(v) => setScriptFilter(v as ScriptFilter)}>
              <TabsList>
                <TabsTrigger value="all">All ({scriptCounts.all})</TabsTrigger>
                <TabsTrigger value="content">From Content ({scriptCounts.content})</TabsTrigger>
                <TabsTrigger value="promotion">Promotion ({scriptCounts.promotion})</TabsTrigger>
                <TabsTrigger value="topic">Topic ({scriptCounts.topic})</TabsTrigger>
              </TabsList>
            </Tabs>
            {selectedScriptIds.length > 0 && (
              <Badge variant="secondary">{selectedScriptIds.length} selected for batch video</Badge>
            )}
          </div>

          {filteredScripts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No scripts in this category yet. Use Reels from Content or Promotion Reels to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredScripts.map((vs) => (
                <VideoScriptCard
                  key={vs.id}
                  script={vs}
                  selectable
                  selected={selectedScriptIds.includes(vs.id)}
                  onSelectChange={(sel) => toggleScriptSelection(vs.id, sel)}
                  onUsePrompt={(prompt) => {
                    setVideoPrompt(prompt)
                    setStudioTab('generate')
                    toast.success('Prompt loaded — generate single or batch video')
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
