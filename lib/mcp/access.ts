import 'server-only'

import type { WorkspaceContext } from '@/lib/workspace/context'
import { resolveWorkspaceContext } from '@/lib/workspace/context'

export const CONTENTOPS_MCP_HEADER = 'x-contentops-mcp'

export function isContentOpsMcpRequest(request: Request): boolean {
  return request.headers.get(CONTENTOPS_MCP_HEADER) === '1'
}

export const CONTENTOPS_MCP_KEY_HEADER = 'x-contentops-mcp-key'

export type McpWorkspaceAccess = { allowAnonymous?: boolean }

function readMcpSecret(request: Request): string | null {
  const fromHeader = request.headers.get(CONTENTOPS_MCP_KEY_HEADER)
  if (fromHeader) return fromHeader
  const auth = request.headers.get('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  return null
}

/** True when the MCP bridge is allowed to use the tool workspace (no browser session). */
export function isAuthorizedMcpRequest(request: Request): boolean {
  if (!isContentOpsMcpRequest(request)) return false

  const expectedSecret = process.env.CONTENTOPS_MCP_SECRET?.trim()
  if (expectedSecret) {
    return readMcpSecret(request) === expectedSecret
  }

  if (process.env.CONTENTOPS_MCP_ALLOW_ANONYMOUS === 'true') return true
  if (process.env.NODE_ENV === 'development') return true

  return false
}

/** Allow demo workspace for TRAE MCP (local dev or verified secret on production). */
export function mcpWorkspaceAccess(request: Request): McpWorkspaceAccess {
  if (isAuthorizedMcpRequest(request)) {
    return { allowAnonymous: true }
  }
  return {}
}

export async function resolveMcpWorkspaceContext(request: Request): Promise<WorkspaceContext> {
  return resolveWorkspaceContext(mcpWorkspaceAccess(request))
}
