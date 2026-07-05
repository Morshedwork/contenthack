import { redirect } from 'next/navigation'

export default function PublishingPage() {
  redirect('/dashboard/approval?tab=publishing')
}
