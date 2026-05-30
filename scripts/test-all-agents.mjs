/**
 * Smoke-test every agent via POST /api/agents/run
 * Usage: node scripts/test-all-agents.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:3000'

const AGENTS = [
  { id: 'research', label: 'Research Agent' },
  { id: 'strategy', label: 'Strategy Agent' },
  { id: 'content', label: 'Content Agent' },
  { id: 'brandtheme', label: 'Brand Theme Agent', body: { url: 'https://stripe.com' } },
  { id: 'video', label: 'Video Agent' },
  { id: 'safety', label: 'Brand Safety Agent' },
  { id: 'scheduler', label: 'Scheduler Agent' },
  { id: 'publisher', label: 'Publisher Agent' },
  { id: 'leadfinder', label: 'Lead Finder Agent' },
  { id: 'outreach', label: 'Outreach Agent' },
  { id: 'analytics', label: 'Analytics Agent' },
]

async function runAgent({ id, label, body = {} }) {
  const started = Date.now()
  try {
    const res = await fetch(`${BASE}/api/agents/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: id, allowAnonymous: true, ...body }),
    })
    const data = await res.json().catch(() => ({}))
    const ms = Date.now() - started
    const ok = res.ok && data?.success !== false
    const agent = data?.data?.agent ?? data?.agent
    const status = agent?.status ?? (ok ? 'unknown' : 'failed')
    const lastOutput = agent?.lastOutput ?? data?.error ?? data?.message ?? JSON.stringify(data).slice(0, 120)
    const live = data?.data?.live ?? data?.live
    return {
      id,
      label,
      ok,
      http: res.status,
      status,
      live: live ?? null,
      lastOutput: String(lastOutput).slice(0, 100),
      ms,
      error: ok ? null : (data?.error || data?.message || `HTTP ${res.status}`),
    }
  } catch (err) {
    return {
      id,
      label,
      ok: false,
      http: 0,
      status: 'error',
      live: null,
      lastOutput: '',
      ms: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function main() {
  console.log(`Testing ${AGENTS.length} agents at ${BASE}\n`)
  const results = []
  for (const agent of AGENTS) {
    process.stdout.write(`  ${agent.id}... `)
    const r = await runAgent(agent)
    results.push(r)
    console.log(r.ok ? `OK (${r.status}, ${r.ms}ms)` : `FAIL — ${r.error}`)
  }

  const passed = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)

  console.log('\n--- Summary ---')
  console.log(`Passed: ${passed.length}/${results.length}`)
  if (failed.length) {
    console.log('\nFailed:')
    for (const f of failed) {
      console.log(`  - ${f.id}: ${f.error}`)
    }
  }
  console.log('\nDetails:')
  console.table(
    results.map((r) => ({
      agent: r.id,
      ok: r.ok ? 'yes' : 'NO',
      status: r.status,
      live: r.live,
      ms: r.ms,
      output: r.lastOutput,
    })),
  )
  process.exit(failed.length ? 1 : 0)
}

main()
