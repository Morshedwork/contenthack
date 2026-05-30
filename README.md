# ContentOps AI

AI content operations manager for marketing and sales teams. Turn one campaign goal into market research, content strategy, post generation, video scripts, approval workflows, scheduling, publishing, lead discovery, outreach, and ROI analytics.

## Problem

Marketing teams spend hours on research, use scattered tools for content creation, face slow approval cycles, and have lead generation disconnected from content performance.

## Solution

ContentOps AI is a visual command center — not a chatbot. It orchestrates 10 specialized AI agents through a complete campaign workflow with model routing, approval gates, and productivity ROI tracking.

## Main Workflow

```
Campaign Goal → Market Research → Topic Strategy → Content Studio → Video Studio
→ Approval Board → Calendar → Publishing → Lead Finder → Outreach → ROI Analytics
```

## Tech Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Supabase** (auth, database, storage)
- **Recharts** for analytics
- **Framer Motion** for animations
- **Lucide** icons
- API routes for backend logic

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page or [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the demo dashboard.

## Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` (default) to:

- Access the dashboard without Supabase auth
- Use mock AI model outputs (no API keys required)
- Publish in mock mode across all platforms

## TRAE MCP (Project Tools)

This repo ships with a project MCP server definition at `.trae/mcp.json` that exposes ContentOps tools to TRAE (via stdio):

- `generate_content_topics`
- `generate_content_from_topic`
- `get_trae_solo_capabilities`

To use it:

```bash
npm install
cp .env.example .env.local
npm run dev
```

In a second terminal:

```bash
npm run mcp:contentops
```

The MCP bridge calls your API with `X-ContentOps-MCP: 1`. In **development**, MCP tools use the demo workspace without a browser session. For a **deployed** API, set a shared secret (see below).

### After deploying (Vercel)

MCP still runs in **TRAE on your machine** — it is not hosted on Vercel. It calls your deployed Next.js API over HTTPS.

1. **Vercel** → Project → Settings → Environment Variables:
   - `OPENAI_API_KEY` (and other keys you need)
   - `CONTENTOPS_MCP_SECRET` = a long random string (e.g. `openssl rand -hex 32`)
2. **TRAE** → copy `.trae/mcp.production.example.json` into `.trae/mcp.json` (or merge `env`):
   - `CONTENTOPS_API_URL` = `https://your-app.vercel.app`
   - `CONTENTOPS_MCP_SECRET` = same value as on Vercel
3. Redeploy, reload MCP in TRAE, run `npm run dev` only if you also want local API.

Without `CONTENTOPS_MCP_SECRET` on production, MCP calls return **Unauthorized** (by design).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_DEMO_MODE` | Enable demo mode (default: true) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `OPENAI_API_KEY` | OpenAI API key — powers all AI generation. Without it the app falls back to demo data |
| `OPENAI_MODEL` | Default OpenAI model for most tasks (default: `gpt-4o-mini`) |
| `OPENAI_MODEL_QUALITY` | Higher-quality model for research & safety (default: `gpt-4o`) |
| `CONTENTOPS_API_URL` | Base URL for the MCP bridge (`.trae/mcp.json` or TRAE MCP env) |
| `CONTENTOPS_MCP_SECRET` | Shared secret for production MCP (set on Vercel **and** in TRAE MCP `env`) |
| `CONTENTOPS_MCP_ALLOW_ANONYMOUS` | If `true`, MCP works without secret (not recommended on public URLs) |

## Agent Architecture

10 specialized agents, each with assigned model, progress tracking, and confidence scoring:

| Agent | Role |
|-------|------|
| Research Agent | Market & competitor analysis |
| Strategy Agent | Topic & content strategy |
| Content Agent | Social post generation |
| Video Agent | Short-form video scripts |
| Brand Safety Agent | Compliance & risk checks |
| Scheduler Agent | Calendar optimization |
| Publisher Agent | Multi-platform publishing |
| Lead Finder Agent | Prospect discovery |
| Outreach Agent | Personalized messaging |
| Analytics Agent | ROI & performance tracking |

## Model Routing Architecture

All AI generation runs through OpenAI. Task types are routed to specific OpenAI models with fallback, temperature, and cost controls:

- Market research → GPT-4o (fallback: GPT-4.1)
- Content generation → GPT-4o (fallback: GPT-4o mini)
- Video scripts → GPT-4.1 mini (fallback: GPT-4o)
- Brand safety → o4-mini (fallback: GPT-4o)
- Lead scoring → o4-mini (fallback: GPT-4o mini)
- Outreach writing → GPT-4o (fallback: GPT-4.1)
- Analytics summary → GPT-4o mini (fallback: GPT-4.1 mini)

## Publishing Adapter Architecture

Each platform has an adapter implementing:

```typescript
validatePost(post) → uploadMedia(urls) → publishPost(post) → getPostStatus(id)
```

Adapters in `lib/publishers/`:

- `mockPublisher.ts` — Demo publishing
- `linkedinAdapter.ts` — LinkedIn Posts API + media upload
- `instagramAdapter.ts` — Instagram Content Publishing API (images, videos, Reels, carousel)
- `facebookAdapter.ts` — Facebook Pages API
- `xAdapter.ts` — X API v2
- `tiktokAdapter.ts` — TikTok Content Posting API
- `youtubeAdapter.ts` — YouTube Data API (Shorts)

No browser automation — official API-ready architecture only.

## Demo Data

Sample company: **Cognisor AI** (AI automation, Japan + global market)

Includes: 1 campaign, 1 research report, 12 topics, 8 posts, 5 video scripts, 12 scheduled posts, 15 leads, 10 outreach messages, 10 agent tasks, 6 model routing configs, ROI analytics.

## Hackathon Judging Alignment

| Criteria | Alignment |
|----------|-----------|
| Innovation & Originality | Connects content creation + lead gen + model routing + ROI |
| TRAE Integration | Multi-agent architecture, model management, modular adapters, MCP-ready |
| Usability & Design | Dashboard, calendar, Kanban, lead table, analytics — familiar workflows |
| Business Impact | Time saved, cost reduction, faster campaigns, lead generation metrics |

## Future Roadmap

- Live OAuth for all platforms
- Real-time collaboration
- A/B content testing
- CRM sync (HubSpot, Salesforce)
- White-label for agencies
- Custom agent training
- Advanced attribution analytics

## Project Structure

```
app/                    # Pages and API routes
components/             # UI components (landing, dashboard, agents, etc.)
lib/                    # Agents, models, publishers, demo data
types/                  # TypeScript types
supabase/schema.sql     # Database schema
```
