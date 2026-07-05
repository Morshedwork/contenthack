import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  BarChart3,
  Bot,
  Calendar,
  CheckSquare,
  Cpu,
  FileText,
  ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Mic,
  Plug,
  Search,
  Send,
  Settings,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  description?: string
  keywords?: string[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const dashboardNavGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, description: 'Campaign snapshot & KPIs', keywords: ['home', 'dashboard'] },
      { label: 'Campaign Builder', href: '/dashboard/campaign-builder', icon: Target, description: 'Configure your campaign', keywords: ['campaign', 'setup'] },
    ],
  },
  {
    label: 'AI Engine',
    items: [
      { label: 'Text Chat', href: '/dashboard/chat', icon: MessageSquare, description: 'Type prompts and run agent workflows', keywords: ['chat', 'assistant', 'agent', 'text', 'prompt'] },
      { label: 'Live Voice', href: '/dashboard/voice', icon: Mic, description: 'Speak naturally with the live AI agent', keywords: ['voice', 'speak', 'mic', 'live', 'agent', 'conversation'] },
      { label: 'Agent Command Center', href: '/dashboard/agents', icon: Bot, description: 'Run and monitor all agents', keywords: ['agents', 'workflow', 'automation'] },
      { label: 'Model Hub', href: '/dashboard/models', icon: Cpu, description: 'AI model routing & settings', keywords: ['models', 'gpt', 'openai'] },
    ],
  },
  {
    label: 'Create',
    items: [
      { label: 'Market Research', href: '/dashboard/research', icon: Search, description: 'Competitor & market analysis', keywords: ['research', 'market', 'trends'] },
      { label: 'Content Studio', href: '/dashboard/content', icon: FileText, description: 'Generate social posts', keywords: ['content', 'posts', 'copy'] },
      { label: 'Image Studio', href: '/dashboard/image', icon: ImageIcon, description: 'GPT Image & DALL·E generation via OpenAI API', keywords: ['image', 'openai', 'gpt', 'visual'] },
      { label: 'Video Studio', href: '/dashboard/video', icon: Video, description: 'Scripts & PixVerse video generation', keywords: ['video', 'reels', 'pixverse'] },
    ],
  },
  {
    label: 'Library',
    items: [
      { label: 'Content Library', href: '/dashboard/library', icon: Archive, description: 'Browse all generated assets', keywords: ['library', 'assets', 'gallery', 'history', 'generated'] },
    ],
  },
  {
    label: 'Publish',
    items: [
      { label: 'Approve & Publish', href: '/dashboard/approval', icon: CheckSquare, description: 'Review, approve, and publish content', keywords: ['approval', 'review', 'publish', 'posting'] },
      { label: 'Content Calendar', href: '/dashboard/calendar', icon: Calendar, description: 'Schedule and plan posts', keywords: ['calendar', 'schedule'] },
    ],
  },
  {
    label: 'Grow',
    items: [
      { label: 'Lead Finder', href: '/dashboard/leads', icon: Users, description: 'Discover qualified prospects', keywords: ['leads', 'prospects'] },
      { label: 'Outreach Studio', href: '/dashboard/outreach', icon: Send, description: 'Personalized outreach messages', keywords: ['outreach', 'email', 'linkedin'] },
      { label: 'ROI Analytics', href: '/dashboard/analytics', icon: BarChart3, description: 'Performance & ROI reports', keywords: ['analytics', 'roi', 'metrics'] },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Integrations', href: '/dashboard/integrations', icon: Plug, description: 'Connect social platforms', keywords: ['integrations', 'oauth'] },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'Brand profile & safety rules', keywords: ['settings', 'brand'] },
      { label: 'Impact Report', href: '/dashboard/impact-report', icon: TrendingUp, description: 'Before/after impact summary', keywords: ['impact', 'report'] },
    ],
  },
]

export const dashboardQuickActions = [
  { label: '2-min Demo', href: '/dashboard?demo=quick', icon: Target, description: 'Load campaign demo in ~2 minutes' },
  { label: 'Run Full Workflow', href: '/dashboard/agents', icon: Zap, description: 'Execute all agents end-to-end' },
  { label: 'Text Chat', href: '/dashboard/chat', icon: MessageSquare, description: 'Prompt-driven agent control' },
  { label: 'Live Voice', href: '/dashboard/voice', icon: Mic, description: 'Speak to your AI agent' },
  { label: 'Approve & Publish', href: '/dashboard/approval', icon: CheckSquare, description: 'Review and publish content' },
] as const

export const allNavItems = dashboardNavGroups.flatMap((g) => g.items)

export function getPageMeta(pathname: string): { title: string; description: string } {
  if (pathname === '/dashboard') {
    return { title: 'Overview', description: 'Your campaign command center' }
  }
  const item = allNavItems.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
  if (item) {
    return { title: item.label, description: item.description ?? '' }
  }
  return { title: 'Dashboard', description: '' }
}
