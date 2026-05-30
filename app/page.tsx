import { Navigation } from '@/components/landing/navigation'
import { HeroSection } from '@/components/landing/hero-section'
import { ProblemSection } from '@/components/landing/problem-section'
import { SolutionSection } from '@/components/landing/solution-section'
import {
  FeaturesSection,
  MultiAgentSection,
  ModelManagementSection,
  ROISection,
  SocialAutomationSection,
  LeadGenSection,
  DemoPreviewSection,
} from '@/components/landing/features-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { CtaSection } from '@/components/landing/cta-section'
import { FooterSection } from '@/components/landing/footer-section'

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-foreground">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <MultiAgentSection />
      <ModelManagementSection />
      <ROISection />
      <SocialAutomationSection />
      <LeadGenSection />
      <DemoPreviewSection />
      <PricingSection />
      <CtaSection />
      <FooterSection />
    </main>
  )
}
