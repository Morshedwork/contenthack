# ContentOps AI — TRAE Solo Rules

When working in TRAE Solo mode on this project:

## Content Topic Generation

Use the structured brief format:
1. **Strategy Brief** — title, goal, target audience, tone
2. **Key Points** — bullet list of pain points, messages, or ideas
3. **Base Content** — product description, research notes, or existing copy

## API Endpoints

- `POST /api/topics/generate` — generate topics from brief (UI + direct API)
- `POST /api/trae/solo` — TRAE Solo agent endpoint with actions:
  - `generate_topics` — pass `{ brief: { keyPoints, baseContent, ... } }`
  - `generate_content` — pass `{ topic, platform }`
  - `capabilities` — list agent capabilities

## MCP Tools (via `.trae/mcp.json`)

Local wiring (main dev loop):

1. `npm run dev` — Next.js on `http://localhost:3000`
2. TRAE loads `.trae/mcp.json` → runs `scripts/trae-contentops-mcp.mjs` with `CONTENTOPS_API_URL=http://localhost:3000`
3. MCP requests send `X-ContentOps-MCP: 1`; local dev uses the demo workspace without cookies
4. **Deployed API:** set `CONTENTOPS_MCP_SECRET` on Vercel and in TRAE MCP env (see `.trae/mcp.production.example.json`)

Tools:

- `generate_content_topics` — structured topic generation
- `generate_content_from_topic` — draft content for a platform
- `get_trae_solo_capabilities` — agent info
- Plus research, drafts, video, safety, leads, outreach (see `scripts/trae-contentops-mcp.mjs`)

## Workflow

Campaign Goal → Market Research → **Topic Strategy (TRAE Solo)** → Content Studio → Approval → Publish
