import 'server-only'

import { isDemoMode } from '@/lib/demo/mode'
import { mcpWorkspaceAccess } from '@/lib/mcp/access'
import { resolveWorkspaceContext, type WorkspaceContext } from '@/lib/workspace/context'

/** Resolve workspace for dashboard API routes (session user, or MCP / demo when allowed). */
export async function resolveApiWorkspaceContext(request: Request): Promise<WorkspaceContext> {
  if (isDemoMode()) {
    return resolveWorkspaceContext({ allowAnonymous: true })
  }
  return resolveWorkspaceContext(mcpWorkspaceAccess(request))
}

/** Options for agent engine — anonymous demo/MCP only; production requires sign-in. */
export function resolveAgentWorkspaceOptions(request: Request): { allowAnonymous?: boolean } {
  if (isDemoMode()) return { allowAnonymous: true }
  const mcp = mcpWorkspaceAccess(request)
  if (mcp.allowAnonymous) return { allowAnonymous: true }
  return {}
}
