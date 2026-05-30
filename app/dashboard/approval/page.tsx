'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/hooks/use-workspace'
import type { ContentStatus } from '@/types'
import { Check, Edit, X } from 'lucide-react'
import { toast } from 'sonner'

const columns: { id: ContentStatus; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'needs_review', label: 'Needs Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
]

export default function ApprovalPage() {
  const { data, loading, patch } = useWorkspace()

  const moveItem = async (id: string, status: ContentStatus) => {
    try {
      await patch({ action: 'updateApproval', draftId: id, status })
      toast.success(`Content moved to ${status.replace(/_/g, ' ')}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  if (loading || !data) {
    return <div className="p-8 text-sm text-muted-foreground">Loading approval board...</div>
  }

  const items = data.approvalItems

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Approval Board</h1>
        <p className="text-muted-foreground text-sm">No content can be published unless approved</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[280px] flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">{col.label}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {items.filter((i) => i.status === col.id).length}
              </Badge>
            </div>
            <div className="flex flex-col gap-3">
              {items.filter((i) => i.status === col.id).map((item) => (
                <Card key={item.id} className="bg-card/60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{item.platform}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${item.riskLevel === 'low' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {item.riskLevel} risk
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.preview}</p>
                    <div className="flex gap-2 text-[10px] mb-3">
                      <span>Safety: {item.brandSafetyScore}</span>
                      <span>Lead: {item.leadPotentialScore}</span>
                    </div>
                    <div className="flex gap-1">
                      {col.id === 'needs_review' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => void moveItem(item.id, 'approved')}>
                            <Check data-icon="inline-start" />Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void moveItem(item.id, 'draft')}>
                            <X />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info('Opening editor')}>
                        <Edit />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
