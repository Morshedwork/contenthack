# ContentOps AI — Hackathon Agent Guide

This project uses **GStack** (engineering workflow) + **GBrain** (persistent memory) per [garrytan/gstack](https://github.com/garrytan/gstack).

## GStack — development procedures

GStack turns AI into a virtual engineering team. Use these skills (installed at `~/.cursor/skills/`) for all code work:

| Phase | Skill | Specialist |
|-------|-------|------------|
| Think | `/office-hours` | YC partner — reframe the product |
| Plan | `/autoplan` | CEO + design + eng review pipeline |
| Plan (single) | `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review` | Scope, architecture, design |
| Build | Agent mode | Implement the approved plan |
| Review | `/review` | Staff engineer — production bugs |
| Security | `/cso` | OWASP + STRIDE audit |
| Test | `/qa <url>` | QA lead — real browser testing |
| Browse | `/browse` | Headless Chromium (~100ms/command) |
| Ship | `/ship` | Release engineer — tests + PR |
| Deploy | `/land-and-deploy`, `/canary` | Merge, verify production |
| Debug | `/investigate` | Root-cause before fixes |
| Docs | `/document-release`, `/document-generate` | Keep docs in sync |
| Memory | `/learn`, `/context-save`, `/context-restore` | Session learnings |
| Cross-model | `/codex` | Second opinion from another model |
| Upgrade | `/gstack-upgrade` | Stay current |

**Invoke in Cursor:** `Load gstack. Run /office-hours` (or any skill above).

**Full skill list (35 core + extras):** autoplan, benchmark, browse, canary, codex, cso, design-consultation, design-html, design-review, design-shotgun, devex-review, document-generate, document-release, investigate, learn, office-hours, plan-ceo-review, plan-design-review, plan-devex-review, plan-eng-review, qa, qa-only, retro, review, setup-gbrain, setup-deploy, ship, spec, sync-gbrain, and safety tools (careful, freeze, guard, unfreeze).

## GBrain — AI notepad (project memory)

GBrain stores decisions, code index, and session context so agents work without re-explaining everything.

**Status (this machine):**
- Engine: PGLite local (`~/.gbrain/brain.pglite`)
- Repo source: `contenthack` (262 files indexed)
- MCP: registered in Cursor (`gbrain serve`)

**Before coding:** prefer `gbrain search` / `code-def` / `code-refs` over blind grep when the question is semantic.

**After big changes:** `Load gstack. Run /sync-gbrain`

**Enable semantic search:** set `OPENAI_API_KEY` then run:
```bash
gbrain config set embedding_model openai:text-embedding-3-small
gbrain sync --source contenthack --strategy code
```

## ContentOps product agents (in-app)

Separate from GStack — these run inside the app via `lib/agents/`:

`research → strategy → content → video → safety → scheduler → publisher → leadfinder → outreach → analytics`

Model routing: `lib/models/routing.ts` (GPT-4o, o4-mini, Kimi K2.5 by task).

## Hackathon sprint loop

```
1. /office-hours     — what are we building and why?
2. /autoplan         — reviewed plan (CEO + eng + design)
3. Implement         — code the plan
4. /review           — catch production bugs
5. /qa localhost     — test dashboard in real browser
6. /ship             — PR with tests
7. /sync-gbrain      — update brain with new code + decisions
8. /document-release — docs match what shipped
```

## Two-layer architecture

```
GStack (how we build)  →  review, qa, ship, security
GBrain (what we remember)  →  decisions, code search, learnings
ContentOps (what we sell)  →  11 campaign agents + MCP bridge
```

## Key paths

| Tool | Location |
|------|----------|
| gstack install | `~/.cursor/skills/gstack` |
| gstack skills | `~/.cursor/skills/*` |
| gbrain CLI | `~/gbrain` |
| gbrain data | `~/.gbrain/` |
| Project rules | `.cursor/rules/gstack-contentops.mdc` |
| Workflow skill | `.cursor/skills/contentops-workflow/` |
| MCP (ContentOps) | `.trae/mcp.json` |

## Competitive advantage

- **GStack:** Repeatable eng process — plan before code, review before merge, QA before ship.
- **GBrain:** Context persists — no re-explaining architecture every session.
- **ContentOps:** Domain-specific multi-agent product with cost-aware model routing.
- **Together:** Ship a hackathon-quality AI product at team velocity as a solo builder.
