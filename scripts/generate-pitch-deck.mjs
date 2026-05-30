import path from 'node:path'
import pptxgen from 'pptxgenjs'

let ShapeType

const TITLE = process.env.DECK_TITLE || 'ContentOps AI'
const SUBTITLE =
  process.env.DECK_SUBTITLE ||
  'AI content operations manager: research → strategy → content → approval → scheduling → publishing → leads → outreach → ROI'
const OUTPUT = process.env.DECK_OUT || 'ContentOps-AI-Pitch-Deck.pptx'

const COLORS = {
  bg: '0B1020',
  panel: '121A33',
  border: '253055',
  text: 'EAF0FF',
  muted: 'A9B4D0',
  accent: '4F46E5',
  accent2: '22C55E',
  warn: 'F59E0B',
}

const FONT = {
  head: 'Calibri',
  body: 'Calibri',
}

const IMG = {
  shield: path.resolve('public/images/shield.png'),
  bridge: path.resolve('public/images/bridge.png'),
  encrypted: path.resolve('public/images/encrypted.jpg'),
  isolated: path.resolve('public/images/isolated.jpg'),
  permissions: path.resolve('public/images/permissions.jpg'),
  audit: path.resolve('public/images/audit.jpg'),
  whale: path.resolve('public/images/whale.png'),
}

function addBackground(slide) {
  slide.background = { color: COLORS.bg }
}

function addTopBar(slide, label) {
  slide.addShape(ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.55,
    fill: { color: COLORS.panel },
    line: { color: COLORS.border, width: 1 },
  })
  slide.addText(label, {
    x: 0.6,
    y: 0.14,
    w: 12.2,
    h: 0.3,
    fontFace: FONT.body,
    fontSize: 14,
    color: COLORS.muted,
  })
}

function addTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.8,
    y: 1.6,
    w: 11.8,
    h: 0.9,
    fontFace: FONT.head,
    fontSize: 54,
    bold: true,
    color: COLORS.text,
  })
  slide.addShape(ShapeType.roundRect, {
    x: 0.8,
    y: 2.7,
    w: 11.8,
    h: 0.95,
    fill: { color: COLORS.panel },
    line: { color: COLORS.border, width: 1 },
    radius: 0.18,
  })
  slide.addText(subtitle, {
    x: 1.1,
    y: 2.88,
    w: 11.2,
    h: 0.6,
    fontFace: FONT.body,
    fontSize: 18,
    color: COLORS.muted,
  })
}

function addSectionTitle(slide, title, kicker) {
  slide.addText(kicker || 'Overview', {
    x: 0.8,
    y: 0.9,
    w: 11.8,
    h: 0.3,
    fontFace: FONT.body,
    fontSize: 14,
    color: COLORS.accent,
  })
  slide.addText(title, {
    x: 0.8,
    y: 1.2,
    w: 11.8,
    h: 0.8,
    fontFace: FONT.head,
    fontSize: 36,
    bold: true,
    color: COLORS.text,
  })
}

function addBullets(slide, x, y, w, items) {
  const text = items.map((t) => `• ${t}`).join('\n')
  slide.addText(text, {
    x,
    y,
    w,
    h: 4.8,
    fontFace: FONT.body,
    fontSize: 18,
    color: COLORS.text,
    valign: 'top',
  })
}

function addCard(slide, x, y, w, h, title, body, accent = COLORS.accent) {
  slide.addShape(ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: COLORS.panel },
    line: { color: COLORS.border, width: 1 },
    radius: 0.16,
  })
  slide.addShape(ShapeType.rect, {
    x,
    y,
    w: 0.12,
    h,
    fill: { color: accent },
    line: { color: accent },
  })
  slide.addText(title, {
    x: x + 0.3,
    y: y + 0.25,
    w: w - 0.6,
    h: 0.35,
    fontFace: FONT.head,
    fontSize: 18,
    bold: true,
    color: COLORS.text,
  })
  slide.addText(body, {
    x: x + 0.3,
    y: y + 0.65,
    w: w - 0.6,
    h: h - 0.8,
    fontFace: FONT.body,
    fontSize: 14,
    color: COLORS.muted,
    valign: 'top',
  })
}

function addFooter(slide, rightText) {
  slide.addText(rightText || 'contentops.ai', {
    x: 0.8,
    y: 7.15,
    w: 11.8,
    h: 0.25,
    fontFace: FONT.body,
    fontSize: 11,
    color: COLORS.muted,
    align: 'right',
  })
}

function safeImage(slide, imgPath, opts) {
  try {
    slide.addImage({ path: imgPath, ...opts })
  } catch {
    return
  }
}

function slideCover(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, 'Pitch Deck')
  safeImage(slide, IMG.shield, { x: 10.9, y: 1.25, w: 1.7, h: 1.7 })
  safeImage(slide, IMG.bridge, { x: 9.9, y: 4.35, w: 2.6, h: 2.2 })
  addTitle(slide, TITLE, SUBTITLE)
  addFooter(slide, 'Next.js • Supabase • Multi-agent workflow • MCP-ready')
}

function slideProblem(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '1 — Problem')
  addSectionTitle(slide, 'Marketing ops is fragmented', 'Problem')
  addBullets(slide, 0.9, 2.2, 7.2, [
    'Research, strategy, writing, approvals, scheduling, publishing, and lead gen live in separate tools',
    'Teams lose hours context-switching and recreating briefs',
    'Approval cycles slow down campaigns; publishing is inconsistent across platforms',
    'Lead gen is disconnected from content performance, so ROI is unclear',
  ])
  safeImage(slide, IMG.isolated, { x: 8.4, y: 2.1, w: 4.3, h: 3.8 })
  addFooter(slide)
}

function slideSolution(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '2 — Solution')
  addSectionTitle(slide, 'One command center for the whole workflow', 'Solution')
  addCard(
    slide,
    0.9,
    2.2,
    5.9,
    1.6,
    'Visual workflow, not a chatbot',
    'Dashboard-driven experience with clear stages and outputs you can review.',
  )
  addCard(
    slide,
    0.9,
    4.0,
    5.9,
    1.6,
    '10 specialized agents',
    'Each agent owns a step: research → strategy → content → video → safety → scheduling → publishing → leads → outreach → analytics.',
    COLORS.accent2,
  )
  addCard(
    slide,
    0.9,
    5.8,
    5.9,
    1.2,
    'ROI tracking',
    'Track tasks completed, content output, leads, and estimated hours saved.',
    COLORS.warn,
  )
  safeImage(slide, IMG.encrypted, { x: 7.1, y: 2.2, w: 5.6, h: 4.8 })
  addFooter(slide)
}

function slideWorkflow(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '3 — Main Workflow')
  addSectionTitle(slide, 'Campaign Goal → ROI', 'Workflow')
  const steps = [
    'Campaign Goal',
    'Market Research',
    'Topic Strategy',
    'Content Studio',
    'Video Studio',
    'Approval Board',
    'Calendar',
    'Publishing',
    'Lead Finder',
    'Outreach',
    'ROI Analytics',
  ]
  const startX = 0.9
  const startY = 2.3
  const w = 11.6
  const boxW = w / 4
  const boxH = 0.75
  steps.forEach((s, i) => {
    const row = Math.floor(i / 4)
    const col = i % 4
    const x = startX + col * boxW
    const y = startY + row * 1.05
    slide.addShape(ShapeType.roundRect, {
      x,
      y,
      w: boxW - 0.18,
      h: boxH,
      fill: { color: COLORS.panel },
      line: { color: COLORS.border, width: 1 },
      radius: 0.16,
    })
    slide.addText(`${i + 1}. ${s}`, {
      x: x + 0.18,
      y: y + 0.2,
      w: boxW - 0.5,
      h: 0.4,
      fontFace: FONT.body,
      fontSize: 14,
      color: COLORS.text,
    })
  })
  addFooter(slide, 'End-to-end campaign execution with explicit stages')
}

function slideAgents(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '4 — Agents')
  addSectionTitle(slide, 'Specialized agents, coordinated as a workflow', 'Architecture')
  addBullets(slide, 0.9, 2.2, 6.4, [
    'Research Agent — market + competitor analysis',
    'Strategy Agent — topic pillars + intent scoring',
    'Content Agent — platform-native drafts',
    'Video Agent — short-form scripts',
    'Brand Safety Agent — compliance checks',
    'Scheduler Agent — calendar planning',
    'Publisher Agent — platform adapters',
    'Lead Finder Agent — prospect discovery',
    'Outreach Agent — personalized messaging',
    'Analytics Agent — ROI and performance summaries',
  ])
  safeImage(slide, IMG.whale, { x: 8.2, y: 2.15, w: 4.6, h: 4.2 })
  addFooter(slide)
}

function slideModelRouting(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '5 — Model Routing')
  addSectionTitle(slide, 'Route tasks to the best model (with fallback)', 'Models')
  addCard(
    slide,
    0.9,
    2.25,
    5.9,
    1.25,
    'Configurable by task type',
    'Each task can set: model, fallback, temperature, token limits, and quality priority.',
  )
  addCard(
    slide,
    0.9,
    3.7,
    5.9,
    1.25,
    'Cost + quality control',
    'Use fast models for drafts and higher-quality models for research and safety-sensitive outputs.',
    COLORS.accent2,
  )
  addCard(
    slide,
    0.9,
    5.15,
    5.9,
    1.25,
    'Demo-safe fallback',
    'If no API key is set, endpoints return demo/mock data so the UI remains usable.',
    COLORS.warn,
  )
  safeImage(slide, IMG.permissions, { x: 7.1, y: 2.25, w: 5.6, h: 4.6 })
  addFooter(slide)
}

function slidePublishing(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '6 — Publishing')
  addSectionTitle(slide, 'Adapter-based publishing (API-ready)', 'Publishing')
  addBullets(slide, 0.9, 2.2, 6.6, [
    'Each platform implements: validate → upload media → publish → status',
    'Mock publisher enables end-to-end testing without OAuth',
    'Adapters exist for LinkedIn, Instagram, Facebook, X, TikTok, YouTube',
    'Designed for official APIs (no brittle browser automation)',
  ])
  safeImage(slide, IMG.audit, { x: 8.0, y: 2.15, w: 4.7, h: 4.2 })
  addFooter(slide)
}

function slideTraeMcp(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '7 — TRAE + MCP')
  addSectionTitle(slide, 'MCP-ready tools for agent workflows', 'Integration')
  addCard(
    slide,
    0.9,
    2.25,
    5.9,
    1.55,
    'Project MCP server',
    'The repo includes a stdio MCP bridge that exposes app capabilities as tools.',
  )
  addCard(
    slide,
    0.9,
    3.95,
    5.9,
    2.05,
    'Tools exposed',
    'Topics, content drafts, video scripts, research, safety checks, lead generation, and outreach messages.',
    COLORS.accent2,
  )
  slide.addShape(ShapeType.roundRect, {
    x: 7.1,
    y: 2.25,
    w: 5.6,
    h: 3.75,
    fill: { color: COLORS.panel },
    line: { color: COLORS.border, width: 1 },
    radius: 0.16,
  })
  slide.addText('Trae Agent', {
    x: 7.4,
    y: 2.5,
    w: 5.0,
    h: 0.4,
    fontFace: FONT.head,
    fontSize: 16,
    bold: true,
    color: COLORS.text,
  })
  slide.addText('↕ MCP (stdio)\n↕ HTTP API\n↕ OpenAI', {
    x: 7.45,
    y: 3.05,
    w: 5.0,
    h: 2.6,
    fontFace: FONT.body,
    fontSize: 16,
    color: COLORS.muted,
    valign: 'top',
  })
  addFooter(slide)
}

function slideTech(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '8 — Tech Stack')
  addSectionTitle(slide, 'Next.js + Supabase + modular agents', 'Implementation')
  addBullets(slide, 0.9, 2.2, 6.6, [
    'Next.js App Router + TypeScript',
    'Tailwind + shadcn/ui for the dashboard UX',
    'Supabase for auth, database, and persistence',
    'API routes encapsulate agent logic and model routing',
    'Publish adapters in lib/publishers/',
  ])
  safeImage(slide, IMG.bridge, { x: 8.2, y: 2.3, w: 4.4, h: 3.7 })
  addFooter(slide)
}

function slideROI(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '9 — ROI Analytics')
  addSectionTitle(slide, 'Measure impact, not just output', 'Analytics')
  addCard(
    slide,
    0.9,
    2.25,
    3.8,
    1.5,
    'Hours saved',
    'Track estimated manual time avoided per workflow step.',
    COLORS.accent2,
  )
  addCard(
    slide,
    4.85,
    2.25,
    3.8,
    1.5,
    'Cost saved',
    'Translate hours saved into a weekly/monthly cost estimate.',
    COLORS.warn,
  )
  addCard(
    slide,
    8.8,
    2.25,
    3.8,
    1.5,
    'Lead lift',
    'Connect lead research and outreach to content performance.',
    COLORS.accent,
  )
  slide.addShape(ShapeType.roundRect, {
    x: 0.9,
    y: 4.05,
    w: 11.7,
    h: 2.45,
    fill: { color: COLORS.panel },
    line: { color: COLORS.border, width: 1 },
    radius: 0.16,
  })
  slide.addText('Dashboard outputs include: posts generated, leads found, outreach drafts, publishing logs, and ROI summaries.', {
    x: 1.2,
    y: 4.45,
    w: 11.1,
    h: 1.8,
    fontFace: FONT.body,
    fontSize: 18,
    color: COLORS.text,
    valign: 'top',
  })
  addFooter(slide)
}

function slideRoadmap(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, '10 — Roadmap')
  addSectionTitle(slide, 'From demo to production-grade ops', 'Roadmap')
  addBullets(slide, 0.9, 2.2, 11.5, [
    'Live OAuth for all platforms + scope management',
    'Collaboration + approval workflows for teams',
    'CRM sync (HubSpot / Salesforce) and attribution',
    'A/B testing and automated performance-driven iteration',
    'Custom agent training and brand governance policies',
  ])
  addFooter(slide)
}

function slideCTA(pptx) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addTopBar(slide, 'Next Steps')
  slide.addText('Build campaigns faster.\nProve ROI.\nShip consistently.', {
    x: 0.9,
    y: 1.65,
    w: 11.8,
    h: 2.2,
    fontFace: FONT.head,
    fontSize: 44,
    bold: true,
    color: COLORS.text,
  })
  slide.addShape(ShapeType.roundRect, {
    x: 0.9,
    y: 4.35,
    w: 7.2,
    h: 1.1,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent },
    radius: 0.2,
  })
  slide.addText('Run the demo → /dashboard', {
    x: 1.25,
    y: 4.64,
    w: 6.6,
    h: 0.6,
    fontFace: FONT.head,
    fontSize: 22,
    bold: true,
    color: 'FFFFFF',
  })
  slide.addText('Open-source friendly architecture: agents + model routing + adapters + MCP tools.', {
    x: 0.9,
    y: 5.75,
    w: 11.8,
    h: 0.8,
    fontFace: FONT.body,
    fontSize: 18,
    color: COLORS.muted,
  })
  addFooter(slide, 'Thank you')
}

async function main() {
  const pptx = new pptxgen()
  ShapeType = pptx.ShapeType
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'ContentOps AI'
  pptx.company = 'ContentOps AI'
  pptx.subject = 'Project pitch deck'
  pptx.theme = { headFontFace: FONT.head, bodyFontFace: FONT.body }

  slideCover(pptx)
  slideProblem(pptx)
  slideSolution(pptx)
  slideWorkflow(pptx)
  slideAgents(pptx)
  slideModelRouting(pptx)
  slidePublishing(pptx)
  slideTraeMcp(pptx)
  slideTech(pptx)
  slideROI(pptx)
  slideRoadmap(pptx)
  slideCTA(pptx)

  await pptx.writeFile({ fileName: path.resolve(OUTPUT) })
  process.stdout.write(path.resolve(OUTPUT))
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err?.message || err))
  process.exitCode = 1
})
