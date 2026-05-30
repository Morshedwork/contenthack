import fs from 'node:fs/promises'
import path from 'node:path'

const API_BASE = (process.env.CONTENTOPS_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const MODEL = process.env.VIDEO_MODEL || 'v4.5'
const ASPECT_RATIO = process.env.VIDEO_ASPECT_RATIO || '16:9'
const DURATION = Number(process.env.VIDEO_DURATION || 5)
const WAIT = process.env.VIDEO_WAIT !== 'false'
const OUT = process.env.VIDEO_PITCH_OUT || 'pitch/video-pitch-assets.json'

const CLIPS = [
  {
    id: 'scene-01',
    title: 'The chaos',
    prompt:
      'Fast-paced montage of a marketer switching between browser tabs: competitor research, Google doc brief, social post drafts, approval comments, scheduling calendar, publishing dashboard, lead list, ROI chart. Modern office, cinematic lighting, smooth motion, professional corporate style.',
  },
  {
    id: 'scene-02',
    title: 'The command center',
    prompt:
      'Cinematic close-up of a laptop showing a modern dark-mode dashboard with cards and workflow stages. Smooth camera push-in, premium SaaS aesthetic, soft depth of field, professional lighting.',
  },
  {
    id: 'scene-03',
    title: 'Market research agent',
    prompt:
      'Clean animated dashboard-style visuals showing competitor list, trend cards, keyword table, and an opportunity score gauge. Modern UI, dark theme, subtle motion graphics, professional.',
  },
  {
    id: 'scene-04',
    title: 'Topic strategy',
    prompt:
      'Modern SaaS UI showing content pillars with topic cards and intent scores (informational/commercial/transactional). Smooth transitions, dark mode, premium look.',
  },
  {
    id: 'scene-05',
    title: 'Content + video studio',
    prompt:
      'Split-screen of social media drafts for LinkedIn/Instagram/X and a short-form video script timeline with scenes and on-screen text. Clean UI, crisp typography, professional motion.',
  },
  {
    id: 'scene-06',
    title: 'Approval + calendar',
    prompt:
      'Modern approval kanban board transitioning into a content calendar view with scheduled posts. Dark mode UI, smooth camera pan, clean corporate style.',
  },
  {
    id: 'scene-07',
    title: 'Publishing + leads + outreach',
    prompt:
      'Dashboard sequence: publishing log with success badges, lead table with lead scores, and a personalized outreach message composer. Premium SaaS UI, smooth motion graphics.',
  },
  {
    id: 'scene-08',
    title: 'ROI + CTA',
    prompt:
      'Elegant ROI analytics dashboard with charts labeled hours saved, cost saved, posts generated, leads found. Cinematic motion, dark theme, premium SaaS aesthetic. End on a clean logo/title card: ContentOps AI.',
  },
]

async function callVideo(prompt) {
  const res = await fetch(`${API_BASE}/api/media/video/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: MODEL,
      aspectRatio: ASPECT_RATIO,
      duration: DURATION,
      wait: WAIT,
    }),
  })
  const json = await res.json()
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Video request failed (${res.status})`)
  }
  return json.data.video
}

async function main() {
  await fs.mkdir(path.dirname(OUT), { recursive: true })

  const startedAt = new Date().toISOString()
  const results = []

  for (const clip of CLIPS) {
    const video = await callVideo(clip.prompt)
    results.push({
      id: clip.id,
      title: clip.title,
      prompt: clip.prompt,
      provider: video.provider,
      model: video.model,
      duration: video.duration,
      aspectRatio: video.aspectRatio,
      status: video.status,
      videoId: video.videoId,
      videoUrl: video.videoUrl,
      createdAt: video.createdAt,
    })
    process.stdout.write(`${clip.id} ${video.status}${video.videoUrl ? ` ${video.videoUrl}` : ''}\n`)
  }

  const payload = {
    generatedAt: startedAt,
    apiBase: API_BASE,
    model: MODEL,
    aspectRatio: ASPECT_RATIO,
    duration: DURATION,
    wait: WAIT,
    clips: results,
  }

  await fs.writeFile(OUT, JSON.stringify(payload, null, 2), 'utf8')
  process.stdout.write(path.resolve(OUT))
}

main().catch((err) => {
  process.stderr.write(String(err?.message || err))
  process.exitCode = 1
})

