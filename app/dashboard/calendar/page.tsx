'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarPostCard } from '@/components/calendar/calendar-post-card'
import { useWorkspace } from '@/hooks/use-workspace'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildMonthGrid(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayOfWeek = new Date(date).getDay()
    return { date, day: d, dayOfWeek }
  })
}

export default function CalendarPage() {
  const { data, loading, patch } = useWorkspace()
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewDate, setViewDate] = useState(() => new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthGrid = useMemo(() => buildMonthGrid(year, month), [year, month])
  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const posts = data?.calendarPosts ?? []
  const filtered = posts.filter((p) => {
    if (platformFilter !== 'all' && p.platform !== platformFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const getPostsForDate = (date: string) => filtered.filter((p) => p.date === date)

  const scheduleFromDrafts = async () => {
    try {
      const res = await fetch('/api/calendar/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scheduleFromDrafts' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      await patch({ calendarPosts: json.data.calendar })
      toast.success(`Scheduled ${json.data.scheduled} posts from content drafts`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule posts')
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading calendar...</div>
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Content Calendar</h1>
          <p className="text-muted-foreground text-sm">{monthLabel} — {data?.campaign.companyName || 'Campaign'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void scheduleFromDrafts()}>
            Schedule from drafts
          </Button>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="x">X</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{monthLabel}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(year, month - 1, 1))}><ChevronLeft /></Button>
            <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(year, month + 1, 1))}><ChevronRight /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthGrid[0].dayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px]" />
            ))}
            {monthGrid.map(({ date, day }) => {
              const dayPosts = getPostsForDate(date)
              return (
                <div key={date} className="min-h-[100px] rounded-lg border border-border/30 p-1.5 bg-secondary/10">
                  <span className="text-[10px] text-muted-foreground font-mono">{day}</span>
                  <div className="flex flex-col gap-1 mt-1">
                    {dayPosts.map((p) => (
                      <CalendarPostCard key={p.id} post={p} compact />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
