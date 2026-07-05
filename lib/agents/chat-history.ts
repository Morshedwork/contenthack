import type { ChatMode } from '@/lib/agents/chat-messages'
import type {
  ChatActionExecuted,
  ChatAgentPlan,
  ChatArtifact,
  ChatMessage,
  ChatReference,
  ChatSuggestedAction,
} from '@/lib/agents/types'

export interface StoredChatMessage extends ChatMessage {
  actionsExecuted?: ChatActionExecuted[]
  artifacts?: ChatArtifact[]
  references?: ChatReference[]
  suggestedActions?: ChatSuggestedAction[]
  plan?: ChatAgentPlan
}

export interface StoredChatSession {
  id: string
  title: string
  mode: ChatMode
  messages: StoredChatMessage[]
  createdAt: string
  updatedAt: string
}

interface ChatHistoryStore {
  activeSessionId: string | null
  sessions: StoredChatSession[]
}

const STORAGE_KEY = 'contentops-chat-history'
const MAX_SESSIONS = 40
const MAX_MESSAGES = 80

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function emptyStore(): ChatHistoryStore {
  return { activeSessionId: null, sessions: [] }
}

export function readChatHistoryStore(): ChatHistoryStore {
  if (!isBrowser()) return emptyStore()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as ChatHistoryStore
    if (!parsed || !Array.isArray(parsed.sessions)) return emptyStore()
    return {
      activeSessionId: parsed.activeSessionId ?? null,
      sessions: parsed.sessions.filter((s) => s?.id && Array.isArray(s.messages)),
    }
  } catch {
    return emptyStore()
  }
}

function writeChatHistoryStore(store: ChatHistoryStore): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota exceeded — drop oldest sessions
    const trimmed = { ...store, sessions: store.sessions.slice(0, Math.floor(MAX_SESSIONS / 2)) }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      /* ignore */
    }
  }
}

export function deriveChatTitle(messages: StoredChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user' && m.content.trim())
  if (!firstUser) return 'New chat'
  const text = firstUser.content.trim().replace(/\s+/g, ' ')
  return text.length > 48 ? `${text.slice(0, 48)}…` : text
}

export function createChatSession(mode: ChatMode, messages: StoredChatMessage[]): StoredChatSession {
  const now = new Date().toISOString()
  return {
    id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: deriveChatTitle(messages),
    mode,
    messages: messages.slice(-MAX_MESSAGES),
    createdAt: now,
    updatedAt: now,
  }
}

export function upsertChatSession(session: StoredChatSession): ChatHistoryStore {
  const store = readChatHistoryStore()
  const trimmed: StoredChatSession = {
    ...session,
    title: deriveChatTitle(session.messages),
    messages: session.messages.slice(-MAX_MESSAGES),
    updatedAt: new Date().toISOString(),
  }

  const existingIdx = store.sessions.findIndex((s) => s.id === trimmed.id)
  if (existingIdx >= 0) {
    store.sessions[existingIdx] = trimmed
  } else {
    store.sessions.unshift(trimmed)
  }

  store.sessions.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
  store.sessions = store.sessions.slice(0, MAX_SESSIONS)
  store.activeSessionId = trimmed.id
  writeChatHistoryStore(store)
  return store
}

export function setActiveChatSession(sessionId: string): ChatHistoryStore {
  const store = readChatHistoryStore()
  if (!store.sessions.some((s) => s.id === sessionId)) return store
  store.activeSessionId = sessionId
  writeChatHistoryStore(store)
  return store
}

export function deleteChatSession(sessionId: string): ChatHistoryStore {
  const store = readChatHistoryStore()
  store.sessions = store.sessions.filter((s) => s.id !== sessionId)
  if (store.activeSessionId === sessionId) {
    store.activeSessionId = store.sessions[0]?.id ?? null
  }
  writeChatHistoryStore(store)
  return store
}

export function getChatSession(sessionId: string): StoredChatSession | undefined {
  return readChatHistoryStore().sessions.find((s) => s.id === sessionId)
}

export function formatChatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
