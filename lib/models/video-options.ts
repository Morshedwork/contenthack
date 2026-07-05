export type VideoFormat = 'reel' | 'shorts' | 'tiktok' | 'story'

export type VideoPromotionType =
  | 'product_launch'
  | 'sale'
  | 'testimonial'
  | 'brand_awareness'
  | 'event'
  | 'tutorial'
  | 'ugc'
  | 'lead_gen'
  | 'announcement'

export const VIDEO_FORMATS: {
  id: VideoFormat
  label: string
  description: string
  aspectRatio: '9:16' | '1:1' | '16:9'
}[] = [
  { id: 'reel', label: 'Instagram Reel', description: '9:16 vertical, 15–90s', aspectRatio: '9:16' },
  { id: 'shorts', label: 'YouTube Shorts', description: '9:16 vertical, up to 60s', aspectRatio: '9:16' },
  { id: 'tiktok', label: 'TikTok', description: '9:16 vertical, trend-forward', aspectRatio: '9:16' },
  { id: 'story', label: 'Story', description: '9:16 ephemeral, punchy', aspectRatio: '9:16' },
]

export const VIDEO_PROMOTION_TYPES: {
  id: VideoPromotionType
  label: string
  description: string
  hookStyle: string
}[] = [
  {
    id: 'product_launch',
    label: 'Product Launch',
    description: 'Introduce a new product or feature with excitement and clarity',
    hookStyle: 'Bold reveal, problem → solution arc',
  },
  {
    id: 'sale',
    label: 'Sale & Offers',
    description: 'Limited-time discounts, flash sales, promo codes',
    hookStyle: 'Urgency-driven, countdown energy',
  },
  {
    id: 'testimonial',
    label: 'Testimonial / Social Proof',
    description: 'Client wins, reviews, before/after transformations',
    hookStyle: 'Quote-led, results-focused',
  },
  {
    id: 'brand_awareness',
    label: 'Brand Awareness',
    description: 'Tell your brand story, values, and differentiation',
    hookStyle: 'Emotional, cinematic, memorable',
  },
  {
    id: 'event',
    label: 'Event / Webinar',
    description: 'Promote live events, webinars, workshops, launches',
    hookStyle: 'Date/time CTA, FOMO, speaker highlights',
  },
  {
    id: 'tutorial',
    label: 'Tutorial / How-To',
    description: 'Educational content that demonstrates value',
    hookStyle: 'Step-by-step, quick wins, save-worthy',
  },
  {
    id: 'ugc',
    label: 'UGC Style',
    description: 'Authentic, casual, creator-style promotion',
    hookStyle: 'Conversational, POV, native platform feel',
  },
  {
    id: 'lead_gen',
    label: 'Lead Generation',
    description: 'Drive sign-ups, audits, demos, and consultations',
    hookStyle: 'Pain point → offer → clear CTA',
  },
  {
    id: 'announcement',
    label: 'Announcement',
    description: 'News, updates, milestones, partnerships',
    hookStyle: 'Direct, news-style, shareable',
  },
]

export function getPromotionTypeLabel(id: VideoPromotionType): string {
  return VIDEO_PROMOTION_TYPES.find((p) => p.id === id)?.label ?? id
}

export function getVideoFormatLabel(id: VideoFormat): string {
  return VIDEO_FORMATS.find((f) => f.id === id)?.label ?? id
}

export function isValidVideoFormat(id: string): id is VideoFormat {
  return VIDEO_FORMATS.some((f) => f.id === id)
}

export function isValidPromotionType(id: string): id is VideoPromotionType {
  return VIDEO_PROMOTION_TYPES.some((p) => p.id === id)
}
