'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomPromptPanel } from '@/components/shared/custom-prompt-panel'
import { useWorkspace } from '@/hooks/use-workspace'
import type { OutreachMessage } from '@/types'
import { AlertTriangle, Check, Copy, Loader2, Mail, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function EmailActions({ msg }: { msg: OutreachMessage }) {
  const [to, setTo] = useState('')
  const [sending, setSending] = useState(false)
  const [providerEnabled, setProviderEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/email/send')
      .then((r) => r.json())
      .then((json) => setProviderEnabled(Boolean(json?.data?.enabled)))
      .catch(() => setProviderEnabled(false))
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${msg.emailSubject}\n\n${msg.emailBody}`)
      toast.success('Email copied — paste it anywhere')
    } catch {
      toast.error('Clipboard unavailable — select and copy the text manually')
    }
  }

  const mailtoHref = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(msg.emailSubject)}&body=${encodeURIComponent(msg.emailBody)}`

  const handleSend = async () => {
    if (!EMAIL_RE.test(to.trim())) {
      toast.error('Enter a valid recipient email address')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), subject: msg.emailSubject, body: msg.emailBody }),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Email send failed')
      toast.success(`Email sent to ${to.trim()}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Email send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-secondary/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">Send this email</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@company.com"
          className="h-9 text-sm sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {providerEnabled && (
            <Button size="sm" onClick={() => void handleSend()} disabled={sending || !to.trim()}>
              {sending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Send data-icon="inline-start" />
              )}
              Send email
            </Button>
          )}
          <Button size="sm" variant="outline" asChild>
            <a href={mailtoHref} aria-disabled={!to.trim()}>
              <Mail data-icon="inline-start" />
              Open in mail app
            </a>
          </Button>
          <Button size="sm" variant="outline" onClick={() => void handleCopy()}>
            <Copy data-icon="inline-start" />
            Copy email
          </Button>
        </div>
      </div>
      {providerEnabled === false && (
        <p className="text-[10px] text-muted-foreground">
          Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env.local for one-click delivery — copy and mail-app options work without it.
        </p>
      )}
    </div>
  )
}

export default function OutreachPage() {
  const { data, refresh } = useWorkspace()
  const [messages, setMessages] = useState<OutreachMessage[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [customPromptDetails, setCustomPromptDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const leads = data?.leads ?? []

  useEffect(() => {
    if (data) {
      setMessages(data.outreach)
      if (!selectedLeadId && data.leads[0]) setSelectedLeadId(data.leads[0].id)
    }
  }, [data, selectedLeadId])

  const selectedLead = leads.find((l) => l.id === selectedLeadId)

  const handleGenerate = async () => {
    if (!selectedLead) {
      toast.error('Select a lead first')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          leadName: selectedLead.name,
          company: selectedLead.company,
          painPoint: selectedLead.painPoint,
          matchReason: selectedLead.matchReason,
          customPromptDetails: customPromptDetails.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Outreach generation failed')
      const outreach = json.data.outreach as OutreachMessage
      setMessages((prev) => [outreach, ...prev.filter((m) => m.leadId !== outreach.leadId)])
      await refresh()
      toast.success(`Outreach drafted for ${selectedLead.name}${json.data.live ? ' (OpenAI)' : ' (demo)'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate outreach')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Outreach Studio</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <AlertTriangle className="text-amber-400" />
            Outreach messages require manual approval before sending — no auto-send
          </p>
        </div>
        <Button onClick={() => void handleGenerate()} disabled={loading || !selectedLead}>
          {loading ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          Generate Outreach
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Outreach settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="outreach-lead">Target lead</Label>
            <select
              id="outreach-lead"
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} — {lead.company} (score {lead.score})
                </option>
              ))}
            </select>
          </div>
          {selectedLead && (
            <div className="rounded-lg bg-secondary/30 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Lead context</p>
              <p><span className="text-muted-foreground">Pain point:</span> {selectedLead.painPoint}</p>
              <p className="mt-1"><span className="text-muted-foreground">Match:</span> {selectedLead.matchReason}</p>
            </div>
          )}
          <CustomPromptPanel
            value={customPromptDetails}
            onChange={setCustomPromptDetails}
            description="Manual outreach instructions — tone, length, channel focus, personalization angles, things to avoid."
            placeholder="e.g. Warm and consultative tone, reference their recent LinkedIn post, keep connection request under 250 chars, no hard sell in first message..."
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {messages.map((msg) => (
          <Card key={msg.id} className="bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{msg.leadName}</CardTitle>
              <Badge variant={msg.approved ? 'default' : 'outline'} className="text-[10px]">
                {msg.approved ? 'Approved' : 'Pending Approval'}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg bg-secondary/30 p-1 text-[10px] text-muted-foreground px-3 py-1">
                Personalization: {msg.personalizationReason}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">LinkedIn Connection</p>
                  <p className="text-sm">{msg.linkedinConnection}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">LinkedIn Follow-up</p>
                  <p className="text-sm">{msg.linkedinFollowUp}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Email Subject</p>
                  <p className="text-sm">{msg.emailSubject}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Short Pitch</p>
                  <p className="text-sm">{msg.shortPitch}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Email Body</p>
                <p className="text-sm whitespace-pre-line bg-secondary/20 rounded-lg p-3">{msg.emailBody}</p>
              </div>
              {!msg.approved ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setMessages((prev) =>
                        prev.map((m) => (m.id === msg.id ? { ...m, approved: true } : m)),
                      )
                      toast.success(`Outreach for ${msg.leadName} approved — ready to send`)
                    }}
                  >
                    <Check data-icon="inline-start" />Approve for Sending
                  </Button>
                </div>
              ) : (
                <EmailActions msg={msg} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
