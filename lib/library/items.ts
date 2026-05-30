import type {
  ContentDraft,
  GeneratedImage,
  GeneratedTopic,
  GeneratedVideo,
  LibraryContentType,
  LibraryItem,
  VideoScript,
} from '@/types'

function idTimestamp(id: string): string {
  const match = id.match(/-([a-z0-9]+)$/i)
  if (!match) return new Date(0).toISOString()
  const n = parseInt(match[1], 36)
  if (!Number.isFinite(n)) return new Date(0).toISOString()
  return new Date(n).toISOString()
}

export function buildLibraryItems(input: {
  contentDrafts?: ContentDraft[]
  generatedImages?: GeneratedImage[]
  generatedVideos?: GeneratedVideo[]
  videoScripts?: VideoScript[]
  topics?: GeneratedTopic[]
}): LibraryItem[] {
  const items: LibraryItem[] = []

  for (const draft of input.contentDrafts ?? []) {
    items.push({
      id: draft.id,
      type: 'post',
      title: draft.hook.slice(0, 80) || 'Untitled post',
      preview: draft.mainCopy,
      createdAt: idTimestamp(draft.id),
      platform: draft.platform,
      status: draft.status,
      meta: `${draft.platform} · ${draft.status}`,
      href: '/dashboard/content',
    })
  }

  for (const image of input.generatedImages ?? []) {
    items.push({
      id: image.id,
      type: 'image',
      title: image.prompt.slice(0, 80) || 'Generated image',
      preview: image.enhancedPrompt,
      createdAt: image.createdAt,
      model: image.model,
      provider: image.provider,
      status: image.status,
      thumbnailUrl: image.imageUrl,
      mediaUrl: image.imageUrl,
      meta: `${image.model} · ${image.aspectRatio}`,
      href: '/dashboard/image',
    })
  }

  for (const video of input.generatedVideos ?? []) {
    items.push({
      id: video.id,
      type: 'video',
      title: video.prompt.slice(0, 80) || 'Generated video',
      preview: video.prompt,
      createdAt: video.createdAt,
      model: video.model,
      provider: video.provider,
      status: video.status,
      mediaUrl: video.videoUrl,
      meta: `${video.model} · ${video.duration}s · ${video.aspectRatio}`,
      href: '/dashboard/video',
    })
  }

  for (const script of input.videoScripts ?? []) {
    items.push({
      id: script.id,
      type: 'script',
      title: script.title,
      preview: script.hook,
      createdAt: idTimestamp(script.id),
      status: script.status,
      meta: `${script.duration} · ${script.status}`,
      href: '/dashboard/video',
    })
  }

  for (const topic of input.topics ?? []) {
    items.push({
      id: topic.id,
      type: 'topic',
      title: topic.title,
      preview: topic.contentAngle,
      createdAt: idTimestamp(topic.id),
      status: `score ${topic.intentScore}`,
      meta: `${topic.pillar} · ${topic.searchIntent}`,
      href: '/dashboard/content',
    })
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function libraryCounts(items: LibraryItem[]): Record<LibraryContentType | 'all', number> {
  return {
    all: items.length,
    post: items.filter((i) => i.type === 'post').length,
    image: items.filter((i) => i.type === 'image').length,
    video: items.filter((i) => i.type === 'video').length,
    script: items.filter((i) => i.type === 'script').length,
    topic: items.filter((i) => i.type === 'topic').length,
  }
}

export const libraryTypeLabels: Record<LibraryContentType, string> = {
  post: 'Posts',
  image: 'Images',
  video: 'Videos',
  script: 'Scripts',
  topic: 'Topics',
}
