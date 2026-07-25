import type { StorageProvider } from '../user/storage'
import type { Conversation, ConversationTurn } from './types'

const STORAGE_KEY   = 'llm:conversations'
const MAX_TURNS     = 50
const MAX_STORED    = 20

function uuid(): string {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function now(): string { return new Date().toISOString() }

export class ConversationMemory {
  constructor(private readonly storage: StorageProvider) {}

  private readAll(): Conversation[] {
    return this.storage.get<Conversation[]>(STORAGE_KEY) ?? []
  }

  private writeAll(conversations: Conversation[]): void {
    // Keep only the most recent MAX_STORED conversations
    const pruned = conversations.slice(-MAX_STORED)
    this.storage.set(STORAGE_KEY, pruned)
  }

  startConversation(clusterId?: string): Conversation {
    const conversation: Conversation = {
      id:         uuid(),
      clusterId:  clusterId ?? null,
      turns:      [],
      created_at: now(),
      updated_at: now(),
    }
    const all = this.readAll()
    all.push(conversation)
    this.writeAll(all)
    return conversation
  }

  getConversation(id: string): Conversation | null {
    return this.readAll().find(c => c.id === id) ?? null
  }

  addTurn(conversationId: string, role: 'user' | 'assistant', content: string): void {
    const all  = this.readAll()
    const idx  = all.findIndex(c => c.id === conversationId)
    if (idx < 0) return

    const turn: ConversationTurn = { role, content, timestamp: now() }
    const conv                   = all[idx]!
    const updatedTurns           = [...conv.turns, turn].slice(-MAX_TURNS)
    all[idx] = { ...conv, turns: updatedTurns, updated_at: now() }
    this.writeAll(all)
  }

  getHistory(conversationId: string, maxTurns?: number): readonly ConversationTurn[] {
    const conv = this.getConversation(conversationId)
    if (!conv) return []
    return maxTurns ? conv.turns.slice(-maxTurns) : conv.turns
  }

  listConversations(): readonly Conversation[] {
    return this.readAll()
  }

  clear(conversationId: string): void {
    this.writeAll(this.readAll().filter(c => c.id !== conversationId))
  }

  clearAll(): void {
    this.writeAll([])
  }
}
