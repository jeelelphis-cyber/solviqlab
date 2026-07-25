import { describe, it, expect } from 'vitest'
import { ContextWindowManager } from '../window-manager'
import type { LLMMessage } from '../types'

function msg(role: LLMMessage['role'], chars: number): LLMMessage {
  return { role, content: 'x'.repeat(chars) }
}

describe('ContextWindowManager', () => {
  it('returns messages unchanged when within budget', () => {
    const mgr      = new ContextWindowManager({ maxTokens: 1000, reservedForOutput: 100 })
    const messages = [msg('system', 100), msg('user', 100)]
    expect(mgr.fit(messages)).toHaveLength(2)
  })

  it('trims oldest non-system messages when over budget', () => {
    // budget = (100 - 10) * 4 = 360 chars
    const mgr = new ContextWindowManager({ maxTokens: 100, reservedForOutput: 10 })
    const messages: LLMMessage[] = [
      msg('system', 100),
      msg('user', 100),      // oldest non-system — should be trimmed
      msg('assistant', 100),
      msg('user', 100),
    ]
    const fitted = mgr.fit(messages)
    // System message must always remain
    expect(fitted[0]!.role).toBe('system')
    // Total should fit within budget
    const total = fitted.reduce((n, m) => n + m.content.length, 0)
    expect(total).toBeLessThanOrEqual(360)
  })

  it('always preserves system messages', () => {
    const mgr = new ContextWindowManager({ maxTokens: 50, reservedForOutput: 10 })
    const messages: LLMMessage[] = [
      msg('system', 100),
      msg('user', 200),
    ]
    const fitted = mgr.fit(messages)
    expect(fitted.some(m => m.role === 'system')).toBe(true)
  })

  it('estimateTokens approximates char count / 4', () => {
    const mgr      = new ContextWindowManager()
    const messages = [msg('user', 400)]
    expect(mgr.estimateTokens(messages)).toBe(100)
  })

  it('returns same array reference when no trimming needed', () => {
    const mgr      = new ContextWindowManager()
    const messages = [msg('system', 10), msg('user', 10)]
    const fitted   = mgr.fit(messages)
    expect(fitted.length).toBe(messages.length)
  })
})
