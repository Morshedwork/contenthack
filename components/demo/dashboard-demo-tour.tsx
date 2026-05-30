'use client'

import { useWorkspace } from '@/hooks/use-workspace'
import { isInvestorPitchCampaign } from '@/lib/demo/investor-pitch'
import { InvestorPitchGuide } from '@/components/demo/investor-pitch-guide'

export function DashboardDemoTour() {
  const { data, loading } = useWorkspace()

  if (loading || !data || !isInvestorPitchCampaign(data.campaign.id)) {
    return null
  }

  return <InvestorPitchGuide campaignId={data.campaign.companyName} />
}
