import type { Campaign, Platform } from '@/types'

export const PLATFORM_OPTIONS: { id: Platform; label: string }[] = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'email', label: 'Email' },
  { id: 'carousel', label: 'Carousel' },
]

export const CAMPAIGN_STATUS_LABELS: Record<Campaign['status'], string> = {
  active: 'Active',
  draft: 'Draft',
  completed: 'Completed',
}

export function formatCampaignDuration(campaign: Campaign): string {
  if (!campaign.startDate || !campaign.endDate) return 'Not set'
  const start = new Date(campaign.startDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const end = new Date(campaign.endDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${start} → ${end}`
}

export function formatPlatforms(platforms: Platform[]): string {
  if (platforms.length === 0) return 'None selected'
  return platforms
    .map((p) => PLATFORM_OPTIONS.find((o) => o.id === p)?.label || p)
    .join(', ')
}

export function createEmptyCampaign(): Campaign {
  return {
    id: `camp-${Date.now()}`,
    companyName: '',
    industry: '',
    targetAudience: '',
    region: '',
    productService: '',
    campaignGoal: '',
    platforms: [],
    tone: '',
    contentFrequency: '',
    startDate: '',
    endDate: '',
    mainOffer: '',
    ctaStyle: '',
    status: 'draft',
  }
}
