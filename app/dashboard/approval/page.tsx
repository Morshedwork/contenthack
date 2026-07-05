import { Suspense } from 'react'
import ApprovalPageClient from './approval-client'

export default function ApprovalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading approve & publish...</div>}>
      <ApprovalPageClient />
    </Suspense>
  )
}
