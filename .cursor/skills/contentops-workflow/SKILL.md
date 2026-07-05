---
name: contentops-workflow
description: >-
  ContentOps AI campaign workflow — maps 11 product agents to gstack engineering
  skills. Use when building features, running campaigns, or coordinating AI agents
  in this repo.
---

# ContentOps Workflow + gstack

## Product agents (runtime — `lib/agents/`)

| Agent ID | Role | Model task (`lib/models/routing.ts`) |
|----------|------|--------------------------------------|
| `research` | Market & competitor analysis | Market research → GPT-4o |
| `strategy` | Topics & content pillars | Content generation → GPT-4o |
| `content` | Social posts & captions | Content generation → GPT-4o |
| `brandtheme` | Brand colors from URLs | Content generation |
| `video` | Short-form scripts | Video scripts → GPT-4.1 mini |
| `safety` | Compliance & claims | Brand safety → o4-mini |
| `scheduler` | Calendar optimization | Content generation |
| `publisher` | Multi-platform publish | No LLM — adapter layer |
| `leadfinder` | Prospect discovery | Lead scoring → o4-mini |
| `outreach` | Personalized messages | Outreach writing → GPT-4o |
| `analytics` | ROI summaries | Analytics summary → GPT-4o mini |

## Engineering skills (development — gstack at `~/.cursor/skills/`)

When **changing this codebase**, pair product work with gstack:

| Phase | gstack skill | ContentOps touchpoint |
|-------|-------------|---------------------|
| Ideate | `/office-hours` | Reframe campaign features vs. chatbot |
| Plan | `/autoplan` | Covers API routes, agents, UI together |
| Review plan | `/plan-eng-review` | `lib/agents/engine.ts`, MCP bridge |
| Implement | (agent mode) | Match existing patterns in `lib/` |
| Security | `/cso` | Auth, `CONTENTOPS_MCP_SECRET`, Supabase |
| Visual QA | `/qa http://localhost:3000/dashboard` | Dashboard, calendar, Kanban |
| Code review | `/review` | Before every PR |
| Ship | `/ship` | Push to `Morshedwork/contenthack` |

## Full campaign flow (user-facing)

```
Campaign Goal → research → strategy → content → video → safety
→ scheduler → publisher → leadfinder → outreach → analytics
```

Trigger via dashboard chat or MCP tools in `scripts/trae-contentops-mcp.mjs`.

## Full feature flow (developer-facing)

```
/office-hours → /autoplan → implement → /review → /qa → /ship
```

## Cross-model strategy

1. **In-app agents**: routed by task type in `resolveTaskModel()` — cost vs. quality.
2. **Engineering review**: gstack `/review` (primary) + `/codex` (second opinion).
3. **Benchmark**: gstack `/benchmark-models` to compare models on a skill task.

## Key files

- Agents: `lib/agents/orchestrator.ts`, `lib/agents/engine.ts`
- Models: `lib/models/routing.ts`
- MCP: `scripts/trae-contentops-mcp.mjs`, `.trae/mcp.json`
- Publishers: `lib/publishers/`
- API: `app/api/`
