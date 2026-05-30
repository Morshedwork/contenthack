'use client'

import { ContentLibrary } from '@/components/library/content-library'
import { useWorkspace } from '@/hooks/use-workspace'

export default function ContentLibraryPage() {
  const { data, loading } = useWorkspace()

  if (loading || !data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading content library...</div>
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Content Library</h1>
        <p className="text-muted-foreground text-sm">
          All generated posts, images, videos, scripts, and topics in one place
        </p>
      </div>
      <ContentLibrary data={data} />
    </>
  )
}
