import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function FooterSection() {
  return (
    <footer className="border-t border-white/[0.08] bg-black px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-violet-300" />
              <span className="font-display text-white">ContentOps AI</span>
            </Link>
            <p className="text-sm text-white/45">
              AI content operations manager for marketing and sales teams.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-white">Product</h4>
            <ul className="flex flex-col gap-2 text-sm text-white/45">
              <li><a href="#features" className="hover:text-white/80">Features</a></li>
              <li><a href="#workflow" className="hover:text-white/80">Workflow</a></li>
              <li><a href="#demo" className="hover:text-white/80">Live Demo</a></li>
              <li><a href="#pricing" className="hover:text-white/80">Pricing</a></li>
              <li><Link href="/dashboard" className="hover:text-white/80">Demo Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-white">Platform</h4>
            <ul className="flex flex-col gap-2 text-sm text-white/45">
              <li><Link href="/dashboard/agents" className="hover:text-white/80">Agent Center</Link></li>
              <li><Link href="/dashboard/models" className="hover:text-white/80">Model Hub</Link></li>
              <li><Link href="/dashboard/analytics" className="hover:text-white/80">ROI Analytics</Link></li>
              <li><Link href="/dashboard/impact-report" className="hover:text-white/80">Impact Report</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-white">Company</h4>
            <ul className="flex flex-col gap-2 text-sm text-white/45">
              <li><Link href="/auth/login" className="hover:text-white/80">Sign in</Link></li>
              <li><Link href="/auth/sign-up" className="hover:text-white/80">Sign up</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 border-t border-white/[0.08] pt-8 text-sm text-white/40 md:flex-row">
          <p>&copy; {new Date().getFullYear()} ContentOps AI. All rights reserved.</p>
          <p>Built for TRAE Hackathon — Demo mode enabled</p>
        </div>
      </div>
    </footer>
  )
}
