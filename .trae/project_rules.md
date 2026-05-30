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

- `generate_content_topics` — structured topic generation
- `generate_content_from_topic` — draft content for a platform
- `get_trae_solo_capabilities` — agent info

## Workflow

Campaign Goal → Market Research → **Topic Strategy (TRAE Solo)** → Content Studio → Approval → Publish
