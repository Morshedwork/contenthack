import { Suspense } from 'react'
import IntegrationsPageClient from './integrations-client'

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading integrations...</div>}>
      <IntegrationsPageClient />
    </Suspense>
  )
}
