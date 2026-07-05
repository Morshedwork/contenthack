'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const LINK_RE = /(\[[^\]]+\]\([^)]+\))/g
const BOLD_RE = /(\*\*[^*]+\*\*)/g

function renderInline(text: string, keyPrefix: string) {
  const segments = text.split(BOLD_RE)
  return segments.map((segment, i) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-foreground">
          {segment.slice(2, -2)}
        </strong>
      )
    }

    const linkParts = segment.split(LINK_RE)
    return linkParts.map((part, j) => {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        const [, label, href] = linkMatch
        const internal = href.startsWith('/')
        if (internal) {
          return (
            <Link
              key={`${keyPrefix}-l-${i}-${j}`}
              href={href}
              className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
            >
              {label}
            </Link>
          )
        }
        return (
          <a
            key={`${keyPrefix}-l-${i}-${j}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
          >
            {label}
          </a>
        )
      }
      return part ? <span key={`${keyPrefix}-t-${i}-${j}`}>{part}</span> : null
    })
  })
}

export function ChatMessageContent({ content, className }: { content: string; className?: string }) {
  const lines = content.split('\n')

  return (
    <div className={cn('space-y-2', className)}>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return i > 0 ? <div key={i} className="h-1" aria-hidden /> : null

        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <p key={i} className="leading-relaxed pl-3 border-l-2 border-violet-500/30 text-foreground/90">
              {renderInline(trimmed.replace(/^[-*]\s+/, ''), `line-${i}`)}
            </p>
          )
        }

        return (
          <p key={i} className={cn('leading-relaxed text-foreground/90', i > 0 && 'mt-1')}>
            {renderInline(line, `line-${i}`)}
          </p>
        )
      })}
    </div>
  )
}
