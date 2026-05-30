import {
  Activity,
  Bot,
  Clock,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Stat {
  label: string
  value: string
  change: string
  icon: LucideIcon
  trend: 'up' | 'down' | 'neutral'
}

export interface Agent {
  name: string
  status: 'running' | 'idle' | 'error'
  type: string
  tasks: number
  region: string
}

export interface ActivityItem {
  action: string
  agent: string
  time: string
}

export const stats: Stat[] = [
  { label: 'Active Agents', value: '12', change: '+2 this week', icon: Bot, trend: 'up' },
  { label: 'Tasks Completed', value: '1,847', change: '+156 today', icon: Zap, trend: 'up' },
  { label: 'Compute Hours', value: '342', change: 'This month', icon: Clock, trend: 'neutral' },
  { label: 'Uptime', value: '99.9%', change: 'Last 30 days', icon: Activity, trend: 'up' },
]

export const agents: Agent[] = [
  { name: 'Data Processor Alpha', status: 'running', type: 'Data Pipeline', tasks: 234, region: 'us-east-1' },
  { name: 'ML Inference Bot', status: 'running', type: 'Machine Learning', tasks: 1203, region: 'eu-west-1' },
  { name: 'Web Scraper v2', status: 'idle', type: 'Data Collection', tasks: 89, region: 'ap-south-1' },
  { name: 'Report Generator', status: 'running', type: 'Analytics', tasks: 321, region: 'us-west-2' },
  { name: 'Image Classifier', status: 'idle', type: 'Machine Learning', tasks: 512, region: 'us-east-1' },
  { name: 'Log Aggregator', status: 'error', type: 'Data Pipeline', tasks: 47, region: 'eu-central-1' },
]

export const recentActivity: ActivityItem[] = [
  { action: 'Agent deployed', agent: 'ML Inference Bot', time: '2 minutes ago' },
  { action: 'Task completed', agent: 'Data Processor Alpha', time: '5 minutes ago' },
  { action: 'Scaling event', agent: 'Web Scraper v2', time: '12 minutes ago' },
  { action: 'Alert resolved', agent: 'Report Generator', time: '1 hour ago' },
  { action: 'New region added', agent: 'Data Processor Alpha', time: '3 hours ago' },
]

export const taskVolume = [
  { day: 'Mon', tasks: 240 },
  { day: 'Tue', tasks: 312 },
  { day: 'Wed', tasks: 287 },
  { day: 'Thu', tasks: 398 },
  { day: 'Fri', tasks: 445 },
  { day: 'Sat', tasks: 289 },
  { day: 'Sun', tasks: 367 },
]

export const computeUsage = [
  { month: 'Jan', hours: 210 },
  { month: 'Feb', hours: 245 },
  { month: 'Mar', hours: 289 },
  { month: 'Apr', hours: 312 },
  { month: 'May', hours: 298 },
  { month: 'Jun', hours: 342 },
]

export const regionDistribution = [
  { region: 'us-east-1', agents: 4 },
  { region: 'eu-west-1', agents: 3 },
  { region: 'ap-south-1', agents: 2 },
  { region: 'us-west-2', agents: 2 },
  { region: 'eu-central-1', agents: 1 },
]
