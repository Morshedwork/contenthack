/**
 * Applies supabase/schema.sql to the linked Postgres database.
 * Usage: node scripts/apply-schema.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env.local')
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq)
      const value = trimmed.slice(eq + 1)
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local optional if vars already exported
  }
}

loadEnv()

// Prefer direct connection string; fall back to discrete POSTGRES_* vars
const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL

if (!connectionString && !process.env.POSTGRES_HOST) {
  console.error('Missing POSTGRES_URL_NON_POOLING or POSTGRES_HOST in .env.local')
  process.exit(1)
}

const sql = readFileSync(resolve(__dirname, '../supabase/schema.sql'), 'utf8')

const client = connectionString
  ? new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
  : new pg.Client({
      host: process.env.POSTGRES_HOST,
      port: 5432,
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE ?? 'postgres',
      ssl: { rejectUnauthorized: false },
    })

// Supabase pooler SSL workaround on Windows
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

try {
  await client.connect()
  console.log('Connected — applying schema...')
  await client.query(sql)
  console.log('Schema applied successfully.')
} catch (err) {
  console.error('Schema apply failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
