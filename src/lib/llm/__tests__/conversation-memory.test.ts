import { describe, it, expect, beforeEach } from 'vitest'
import { ConversationMemory } from '../conversation-memory'
import { MemoryProvider } from '../../user/storage'

describe('ConversationMemory', () => {
  let memory: ConversationMemory

  beforeEach(() => {
    memory = new ConversationMemory(new MemoryProvider())
  })

  it('startConversation() creates a new conversation', () => {
    const conv = memory.startConversation('weight')
    expect(conv.id).toBeTruthy()
    expect(conv.clusterId).toBe('weight')
    expect(conv.turns).toHaveLength(0)
  })

  it('startConversation() without clusterId creates generic conversation', () => {
    const conv = memory.startConversation()
    expect(conv.clusterId).toBeNull()
  })

  it('getConversation() returns the conversation by id', () => {
    const conv = memory.startConversation()
    expect(memory.getConversation(conv.id)).not.toBeNull()
    expect(memory.getConversation(conv.id)?.id).toBe(conv.id)
  })

  it('getConversation() returns null for unknown id', () => {
    expect(memory.getConversation('nonexistent')).toBeNull()
  })

  it('addTurn() appends turns to conversation', () => {
    const conv = memory.startConversation()
    memory.addTurn(conv.id, 'user', 'Hello')
    memory.addTurn(conv.id, 'assistant', 'Hi there!')
    const history = memory.getHistory(conv.id)
    expect(history).toHaveLength(2)
    expect(history[0]?.role).toBe('user')
    expect(history[0]?.content).toBe('Hello')
    expect(history[1]?.role).toBe('assistant')
  })

  it('addTurn() is a no-op for unknown conversation id', () => {
    expect(() => memory.addTurn('nonexistent', 'user', 'test')).not.toThrow()
  })

  it('getHistory() with maxTurns limits returned turns', () => {
    const conv = memory.startConversation()
    for (let i = 0; i < 5; i++) {
      memory.addTurn(conv.id, 'user', `message ${i}`)
    }
    expect(memory.getHistory(conv.id, 3)).toHaveLength(3)
  })

  it('getHistory() returns empty array for unknown id', () => {
    expect(memory.getHistory('nonexistent')).toHaveLength(0)
  })

  it('listConversations() returns all started conversations', () => {
    memory.startConversation('weight')
    memory.startConversation('sleep')
    expect(memory.listConversations()).toHaveLength(2)
  })

  it('clear() removes a specific conversation', () => {
    const conv = memory.startConversation()
    memory.clear(conv.id)
    expect(memory.getConversation(conv.id)).toBeNull()
  })

  it('clearAll() removes all conversations', () => {
    memory.startConversation()
    memory.startConversation()
    memory.clearAll()
    expect(memory.listConversations()).toHaveLength(0)
  })

  it('persists turns across instances with same storage', () => {
    const storage = new MemoryProvider()
    const mem1    = new ConversationMemory(storage)
    const mem2    = new ConversationMemory(storage)
    const conv    = mem1.startConversation()
    mem1.addTurn(conv.id, 'user', 'Hello')
    expect(mem2.getHistory(conv.id)).toHaveLength(1)
  })
})
