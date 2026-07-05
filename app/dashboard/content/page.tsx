'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentDraftEditor } from '@/components/content/content-draft-editor'
import { ContentPreviewCard } from '@/components/content/content-preview-card'
import { TopicGenerator } from '@/components/content/topic-generator'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { useWorkspace } from '@/hooks/use-workspace'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { ContentDraft, GeneratedTopic, Platform } from '@/types'

const tabs = ['linkedin', 'instagram', 'facebook', 'x', 'carousel', 'email'] as const
type StudioPlatform = (typeof tabs)[number]

function firstPlatformWithDrafts(drafts: ContentDraft[]): StudioPlatform {
  const match = tabs.find((tab) => drafts.some((draft) => draft.platform === tab))
  return match ?? 'linkedin'
}

export default function ContentStudioPage() {
  const { data, refresh, patch } = useWorkspace()
  const [activeTopic, setActiveTopic] = useState<GeneratedTopic | null>(null)
  const [editingDraft, setEditingDraft] = useState<ContentDraft | null>(null)
  const [targetPlatforms, setTargetPlatforms] = useState<Platform[]>([...tabs])
  const [studioTab, setStudioTab] = useState('topics')
  const [localDrafts, setLocalDrafts] = useState<ContentDraft[] | null>(null)
  const [platformTab, setPlatformTab] = useState<StudioPlatform>('linkedin')
  const [customPromptDetails, setCustomPromptDetails] = useState('')
  const [generating, setGenerating] = useState(false)

  const drafts = localDrafts ?? data?.contentDrafts ?? []

  const handleGenerateContentFromTopic = (topic: GeneratedTopic, platforms: Platform[]) => {
    setActiveTopic(topic)
    setTargetPlatforms(platforms.length ? platforms : [...tabs])
    setStudioTab('drafts')
    toast.success(`Topic selected — generate drafts for "${topic.title.slice(0, 40)}..."`)
  }

  const handleGenerateContent = async () => {
    setGenerating(true)
    try {
      const platforms =
        targetPlatforms.length > 0
          ? targetPlatforms
          : data?.campaign.platforms?.length
            ? data.campaign.platforms
            : [...tabs]

      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopic?.title,
          platforms,
          customPromptDetails: customPromptDetails.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Content generation failed')

      const newDrafts = json.data.drafts as ContentDraft[]
      if (!newDrafts.length) {
        throw new Error('No content drafts were returned. Try generating again.')
      }

      setLocalDrafts(newDrafts)
      setPlatformTab(firstPlatformWithDrafts(newDrafts))
      void refresh()

      toast.success(
        activeTopic
          ? `Generated ${newDrafts.length} draft${newDrafts.length === 1 ? '' : 's'} for "${activeTopic.title.slice(0, 30)}..."${json.data.live ? ' (OpenAI)' : ''}`
          : `Generated ${newDrafts.length} new content draft${newDrafts.length === 1 ? '' : 's'}${json.data.live ? ' (OpenAI)' : ''}`,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setGenerating(false)
    }
  }

  const platformsWithDrafts = [...new Set(drafts.map((draft) => draft.platform))]

  const handleSaveDraft = async (updated: ContentDraft) => {
    const nextDrafts = drafts.map((d) => (d.id === updated.id ? updated : d))
    setLocalDrafts(nextDrafts)
    await patch({ contentDrafts: nextDrafts })
    await refresh()
    toast.success('Content updated')
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Content Studio</h1>
          <p className="text-muted-foreground text-sm">
            TRAE Solo topic strategy → multi-platform content generation
          </p>
        </div>
        {activeTopic && (
          <Badge variant="secondary" className="w-fit text-xs gap-1.5 py-1.5 px-3">
            <Lightbulb className="size-3.5" />
            Active topic: {activeTopic.title.slice(0, 50)}
            {activeTopic.title.length > 50 ? '...' : ''}
          </Badge>
        )}
      </div>

      <Tabs value={studioTab} onValueChange={setStudioTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="topics" className="gap-1.5">
            <Lightbulb className="size-3.5" />
            Topic Strategy
          </TabsTrigger>
          <TabsTrigger value="drafts" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Content Drafts
            {drafts.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {drafts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <TopicGenerator
            onTopicsGenerated={() => void refresh()}
            onGenerateContentFromTopic={handleGenerateContentFromTopic}
          />
        </TabsContent>

        <TabsContent value="drafts">
          {activeTopic && (
            <div className="mb-4 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-xs text-muted-foreground mb-1">Generating from selected topic</p>
              <p className="text-sm font-medium">{activeTopic.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{activeTopic.contentAngle}</p>
            </div>
          )}

          <div className="mb-4">
            <CustomPromptPanel
              value={customPromptDetails}
              onChange={setCustomPromptDetails}
              description="Manual copy instructions — hook style, length, hashtags, CTA emphasis, platform-specific notes."
              placeholder="e.g. Keep LinkedIn posts under 200 words, use conversational tone, include a free audit CTA, add 3 relevant hashtags..."
            />
          </div>

          <div className="flex justify-end mb-4">
            <Button onClick={() => void handleGenerateContent()} disabled={generating}>
              {generating ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              Generate Content
            </Button>
          </div>

          {drafts.length > 0 && (
            <p className="mb-4 text-xs text-muted-foreground">
              {drafts.length} draft{drafts.length === 1 ? '' : 's'} ready across{' '}
              {platformsWithDrafts.map((p) => (p === 'x' ? 'X' : p)).join(', ')}. Switch platform tabs to view each post.
            </p>
          )}

          <Tabs value={platformTab} onValueChange={(value) => setPlatformTab(value as StudioPlatform)}>
            <TabsList className="mb-6 flex-wrap h-auto">
              {tabs.map((t) => {
                const count = drafts.filter((c) => c.platform === t).length
                return (
                  <TabsTrigger key={t} value={t} className="capitalize gap-1">
                    {t === 'x' ? 'X' : t}
                    {count > 0 && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {drafts
                    .filter((c) => c.platform === tab)
                    .map((content) => (
                      <ContentPreviewCard
                        key={content.id}
                        content={
                          activeTopic
                            ? {
                                ...content,
                                hook: activeTopic.hookIdeas[0] || content.hook,
                              }
                            : content
                        }
                        onRegenerate={() => void handleGenerateContent()}
                        onEdit={() => setEditingDraft(content)}
                        onApprove={() => toast.success('Sent to approval board')}
                        onSchedule={() => toast.success('Added to calendar')}
                      />
                    ))}
                  {drafts.filter((c) => c.platform === tab).length === 0 && (
                    <p className="text-muted-foreground text-sm col-span-full py-12 text-center">
                      No content for this platform yet.
                      {drafts.length > 0
                        ? ` Generated drafts are on ${platformsWithDrafts.map((p) => (p === 'x' ? 'X' : p)).join(', ')}.`
                        : ' Select a topic and click Generate Content.'}
                    </p>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>

      <ContentDraftEditor
        draft={editingDraft}
        open={editingDraft !== null}
        onOpenChange={(open) => {
          if (!open) setEditingDraft(null)
        }}
        onSave={handleSaveDraft}
      />
    </>
  )
}

