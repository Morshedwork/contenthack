import { apiSuccess } from '@/lib/api-utils'
import { getWorkspace, patchWorkspace, scheduleFromDrafts } from '@/lib/workspace/store'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const ws = await getWorkspace()

  if (body.action === 'scheduleFromDrafts') {
    const posts = scheduleFromDrafts(ws, ws.contentDrafts.filter((d) => d.status === 'approved' || d.status === 'needs_review'))
    await patchWorkspace({ calendarPosts: posts })
    const updated = await getWorkspace()
    return apiSuccess({ calendar: updated.calendarPosts, scheduled: posts.length })
  }

  if (body.post) {
    const post = {
      id: `cal-${Date.now()}`,
      ...body.post,
      status: body.post.status ?? 'scheduled',
    }
    await patchWorkspace({ calendarPosts: [post, ...ws.calendarPosts] })
    const updated = await getWorkspace()
    return apiSuccess({ scheduled: post, calendar: updated.calendarPosts })
  }

  return apiSuccess({ calendar: ws.calendarPosts })
}

export async function GET() {
  const ws = await getWorkspace()
  return apiSuccess({ calendar: ws.calendarPosts })
}
