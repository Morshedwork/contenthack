'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { TopicResultCard } from '@/components/content/topic-result-card'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { demoCampaign } from '@/lib/demo/data'
import type { ContentPillar, GeneratedTopic, Platform, TraeSoloTopicResult } from '@/types'
import { Bot, Layers, ListPlus, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'x', label: 'X' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'email', label: 'Email' },
]

interface TopicGeneratorProps {
  onTopicsGenerated?: (topics: GeneratedTopic[]) => void
  onGenerateContentFromTopic?: (topic: GeneratedTopic, platforms: Platform[]) => void
}

export function TopicGenerator({ onTopicsGenerated, onGenerateContentFromTopic }: TopicGeneratorProps) {
  const [title, setTitle] = useState('Q2 Content Strategy')
  const [goal, setGoal] = useState(demoCampaign.campaignGoal)
  const [targetAudience, setTargetAudience] = useState(demoCampaign.targetAudience)
  const [tone, setTone] = useState(demoCampaign.tone)
  const [baseContent, setBaseContent] = useState(
    'Cognisor AI helps SMEs automate workflows with custom AI agents. Our clients typically save 20+ hours per week on manual tasks like lead follow-up, reporting, and content scheduling.',
  )
  const [keyPoints, setKeyPoints] = useState([
    'Manual workflows waste 15–20 hours per week for SMEs',
    'AI agents can handle lead follow-up and reporting automatically',
    'Japan SME market is rapidly adopting AI automation in 2026',
    'Free automation audit lowers barrier to first conversation',
  ])
  const [newPoint, setNewPoint] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>(['linkedin', 'instagram', 'x'])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<TraeSoloTopicResult | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [customPromptDetails, setCustomPromptDetails] = useState('')

  const togglePlatform = (id: Platform) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const addPoint = () => {
    const trimmed = newPoint.trim()
    if (!trimmed) return
    setKeyPoints((prev) => [...prev, trimmed])
    setNewPoint('')
  }

  const removePoint = (index: number) => {
    setKeyPoints((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (keyPoints.length === 0 && !baseContent.trim()) {
      toast.error('Add key points or base content before generating')
      return
    }
    if (platforms.length === 0) {
      toast.error('Select at least one platform')
      return
    }

    setLoading(true)
    setProgress(15)
    setResult(null)

    try {
      const progressTimer = setInterval(() => {
        setProgress((p) => Math.min(p + 12, 85))
      }, 200)

      const res = await fetch('/api/trae/solo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_topics',
          brief: {
            title,
            goal,
            keyPoints,
            baseContent,
            targetAudience,
            tone,
            platforms,
            topicCount: 8,
            customPromptDetails: customPromptDetails.trim() || undefined,
          },
        }),
      })

      clearInterval(progressTimer)
      setProgress(100)

      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Generation failed')

      setResult(json.data)
      onTopicsGenerated?.(json.data.topics)
      const mode = json.data.modelUsed?.includes('OpenAI') ? 'OpenAI' : 'demo'
      toast.success(`Generated ${json.data.topics.length} topics (${mode})`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate topics')
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 600)
    }
  }

  const selectedTopic = result?.topics.find((t) => t.id === selectedTopicId)

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-violet-500/5 to-blue-500/5 border-violet-500/20">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15">
              <Bot className="size-5 text-violet-300" />
            </div>
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                TRAE Solo Agent
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  Connected
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                Structured brief → pillar mapping → intent-scored topics with hooks & formats
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit text-[10px]">
            Strategy Agent · GPT-4.1
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="size-4 text-violet-300" />
                1. Strategy Brief
              </CardTitle>
              <CardDescription>Define the campaign goal and audience context</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="brief-title">Brief title</Label>
                <Input id="brief-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="brief-goal">Campaign goal</Label>
                <Textarea id="brief-goal" value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="brief-audience">Target audience</Label>
                  <Input id="brief-audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="brief-tone">Tone</Label>
                  <Input id="brief-tone" value={tone} onChange={(e) => setTone(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ListPlus className="size-4 text-violet-300" />
                2. Key Points
              </CardTitle>
              <CardDescription>Core ideas, pain points, or messages to build topics from</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-mono mt-1.5">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm py-1.5 px-2 rounded-lg bg-secondary/30">{point}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={() => removePoint(i)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Add a key point..."
                  value={newPoint}
                  onChange={(e) => setNewPoint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPoint())}
                />
                <Button variant="outline" size="icon" onClick={addPoint}>
                  <Plus />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">3. Base Content</CardTitle>
              <CardDescription>Background copy, product info, or raw notes for context</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                value={baseContent}
                onChange={(e) => setBaseContent(e.target.value)}
                rows={4}
                placeholder="Paste existing content, product description, or research notes..."
              />
              <div>
                <Label className="mb-2 block">Target platforms</Label>
                <div className="flex flex-wrap gap-3">
                  {PLATFORMS.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={platforms.includes(p.id)}
                        onCheckedChange={() => togglePlatform(p.id)}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <CustomPromptPanel
                value={customPromptDetails}
                onChange={setCustomPromptDetails}
                description="Extra instructions for topic strategy — angles to explore, topics to avoid, competitor focus, etc."
                placeholder="e.g. Prioritize LinkedIn thought leadership, include Japan market angles, avoid generic AI buzzwords..."
              />
              {loading && progress > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>TRAE Solo processing brief...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}
              <Button onClick={handleGenerate} disabled={loading} className="w-full">
                <Sparkles data-icon="inline-start" />
                {loading ? 'TRAE Solo generating...' : 'Generate Topics with TRAE Solo'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results panel */}
        <div className="flex flex-col gap-4">
          {!result && !loading && (
            <Card className="flex items-center justify-center min-h-[400px] bg-card/40 border-dashed">
              <CardContent className="text-center text-muted-foreground py-12">
                <Bot className="mx-auto mb-3 size-10 opacity-40" />
                <p className="text-sm font-medium mb-1">No topics generated yet</p>
                <p className="text-xs max-w-[280px] mx-auto">
                  Add your key points and base content, then let TRAE Solo map them to content pillars
                </p>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <Card className="bg-violet-500/5 border-violet-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Generation Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.contentPillars.map((pillar: ContentPillar) => (
                      <Badge key={pillar.name} variant="secondary" className="text-[10px]">
                        {pillar.name} · {pillar.topicCount}
                      </Badge>
                    ))}
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      TRAE Solo execution
                    </p>
                    <ul className="flex flex-col gap-1">
                      {result.executionSteps.map((step) => (
                        <li key={step} className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {selectedTopic && (
                <Card className="border-violet-500/30">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Selected topic</CardTitle>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setSelectedTopicId(null)}>
                      <X className="size-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-1">{selectedTopic.title}</p>
                    <p className="text-xs text-muted-foreground mb-3">{selectedTopic.rationale}</p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onGenerateContentFromTopic?.(selectedTopic, platforms)}
                    >
                      <Sparkles data-icon="inline-start" />
                      Generate content from this topic
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-3">
                {result.topics.map((topic, i) => (
                  <TopicResultCard
                    key={topic.id}
                    topic={topic}
                    rank={i + 1}
                    selected={selectedTopicId === topic.id}
                    onSelect={() => setSelectedTopicId(topic.id)}
                    onGenerateContent={() => onGenerateContentFromTopic?.(topic, platforms)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
