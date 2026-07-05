# ContentOps AI — Cursor Agent Guide

This project uses **GStack** (engineering workflow) + **GBrain** (persistent memory) per [garrytan/gstack](https://github.com/garrytan/gstack).

## Quick start (Cursor)

```
Load gstack. Run /sync-gbrain
```

Before coding, prefer `gbrain search` / `gbrain code-def` over blind grep. After big changes, run `/sync-gbrain` again.

**Windows:** gbrain CLI is at `scripts/gbrain.cmd`. Ensure `%USERPROFILE%\.bun\bin` and `%APPDATA%\npm` are on PATH, or call `scripts\gbrain.cmd` directly.

## GStack — development procedures

GStack turns AI into a virtual engineering team. Skills live at `~/.cursor/skills/gstack/`.

| Phase | Skill | When |
|-------|-------|------|
| Think | `/office-hours` | Reframe product scope |
| Plan | `/autoplan` | CEO + design + eng review |
| Build | Agent mode | Implement the plan |
| Review | `/review` | Catch production bugs |
| Security | `/cso` | Auth, MCP, API routes |
| Test | `/qa http://localhost:3000` | Real browser QA |
| Ship | `/ship` | Tests + PR |
| Memory | `/sync-gbrain` | Refresh code index |

**Invoke:** `Load gstack. Run /review` (or any skill above).

## GBrain — this repo

| Item | Value |
|------|-------|
| Source ID | `contenthack` (see `.gbrain-source`) |
| Engine | PGLite at `~/.gbrain/brain.pglite` |
| MCP | `.cursor/mcp.json` → `scripts/gbrain-mcp.cmd` |
| CLI wrapper | `scripts/gbrain.cmd` |

### Semantic search commands

```bash
gbrain search "where is auth handled"
gbrain code-def handleAgentChat
gbrain code-refs ManagerStack
gbrain query "how does voice manager work"
```

Set `OPENAI_API_KEY` in your shell (or user env) and run:

```bash
gbrain config set embedding_model openai:text-embedding-3-small
gbrain sync --source contenthack --strategy code
```

## ContentOps product agents (in-app)

Separate from GStack — these run inside the app via `lib/agents/`:

`research → strategy → content → video → safety → scheduler → publisher → leadfinder → outreach → analytics`

Model routing: `lib/models/routing.ts`.

## Hackathon sprint loop

```
1. /office-hours     → what are we building?
2. /autoplan         → reviewed plan
3. Implement         → code
4. /review           → production bugs
5. /qa localhost     → browser test
6. /ship             → PR
7. /sync-gbrain      → refresh brain
8. /document-release → docs
```

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool.

| Request | Skill |
|---------|-------|
| Product ideas | `/office-hours` |
| Architecture | `/plan-eng-review` |
| Full plan pipeline | `/autoplan` |
| Bugs | `/investigate` |
| QA / test site | `/qa` |
| Code review | `/review` |
| Security | `/cso` |
| Ship / PR | `/ship` |
| Refresh brain | `/sync-gbrain` |
| Save session | `/context-save` |
| Resume session | `/context-restore` |

## GBrain Search Guidance (configured by /sync-gbrain)
<!-- gstack-gbrain-search-guidance:start -->

GBrain is set up and synced on this machine. Prefer gbrain over Grep when the question is semantic or when you don't know the exact identifier yet.

**This worktree is pinned** via `.gbrain-source` → `contenthack`. Commands from this repo route to that source by default.

Prefer gbrain when:
- "Where is X handled?" → `gbrain search "<terms>"` or `gbrain query "<question>"`
- "Where is symbol Y defined?" → `gbrain code-def <symbol>` or `gbrain code-refs <symbol>`
- "What calls Y?" → `gbrain code-callers <symbol>` / `gbrain code-callees <symbol>`

Grep is still right for known exact strings, regex, and file globs. Run `/sync-gbrain` after meaningful code changes.

<!-- gstack-gbrain-search-guidance:end -->
