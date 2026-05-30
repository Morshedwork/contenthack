import { investorPitchTourSteps, quickCampaignTourSteps } from '@/lib/demo/investor-pitch'

export const TOUR_MODE_STORAGE_KEY = 'contentops-demo-tour-mode'
export type DemoTourMode = 'quick' | 'full'

export function setDemoTourMode(mode: DemoTourMode): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(TOUR_MODE_STORAGE_KEY, mode)
}

export function getDemoTourMode(): DemoTourMode {
  if (typeof sessionStorage === 'undefined') return 'quick'
  return sessionStorage.getItem(TOUR_MODE_STORAGE_KEY) === 'full' ? 'full' : 'quick'
}

export function getActiveTourSteps(mode: DemoTourMode = getDemoTourMode()) {
  return mode === 'full' ? [...investorPitchTourSteps] : [...quickCampaignTourSteps]
}
