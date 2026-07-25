import { describe, it, expect } from 'vitest'
import {
  DefaultCoachStrategy,
  MotivatorStrategy,
  ConsultantStrategy,
  ExplainerStrategy,
} from '../prompt-strategy'
import { PromptComposer } from '../prompt-composer'
import type { LLMContext } from '../types'

function makeContext(overrides?: Partial<LLMContext>): LLMContext {
  return {
    userId: 'u1', userType: 'anonymous', subscription: 'free',
    activeCluster: 'weight', assessmentScore: 72, assessmentConfidence: 'established',
    currentPhase: 'planning', primaryGoal: 'Lose 5kg', daysSinceActive: 0,
    dormancyLevel: 'none', recentCoachMessages: [], journeyProgress: 42,
    ...overrides,
  }
}

const history = [
  { role: 'user' as const, content: 'Hi', timestamp: new Date().toISOString() },
  { role: 'assistant' as const, content: 'Hello', timestamp: new Date().toISOString() },
]

describe('DefaultCoachStrategy', () => {
  const s = new DefaultCoachStrategy()

  it('has id "default_coach"', () => {
    expect(s.id).toBe('default_coach')
  })

  it('buildSystemMessage returns non-empty string', () => {
    expect(s.buildSystemMessage(makeContext(), 'en').length).toBeGreaterThan(0)
  })

  it('buildHistory trims to maxTurns', () => {
    const msgs = s.buildHistory(history, 1)
    expect(msgs).toHaveLength(1)
    expect(msgs[0]!.content).toBe('Hello')  // last turn
  })

  it('buildUserMessage returns message unchanged', () => {
    expect(s.buildUserMessage('hello', makeContext())).toBe('hello')
  })
})

describe('MotivatorStrategy', () => {
  const s = new MotivatorStrategy()

  it('has id "motivator"', () => {
    expect(s.id).toBe('motivator')
  })

  it('buildUserMessage includes journey progress', () => {
    const msg = s.buildUserMessage('How am I doing?', makeContext())
    expect(msg).toContain('42%')
    expect(msg).toContain('How am I doing?')
  })

  it('buildUserMessage handles null journeyProgress', () => {
    const msg = s.buildUserMessage('hello', makeContext({ journeyProgress: null }))
    expect(msg).not.toContain('%')
  })
})

describe('ConsultantStrategy', () => {
  const s = new ConsultantStrategy()

  it('has id "consultant"', () => {
    expect(s.id).toBe('consultant')
  })

  it('buildSystemMessage appends advisory framing', () => {
    const msg = s.buildSystemMessage(makeContext(), 'en')
    expect(msg).toContain('professional wellness consultant')
  })
})

describe('ExplainerStrategy', () => {
  const s = new ExplainerStrategy()

  it('has id "explainer"', () => {
    expect(s.id).toBe('explainer')
  })

  it('buildUserMessage appends reasoning request', () => {
    const msg = s.buildUserMessage('What should I eat?', makeContext())
    expect(msg).toContain('What should I eat?')
    expect(msg).toContain('explain your reasoning')
  })
})

describe('PromptComposer with strategies', () => {
  it('PromptComposer respects injected strategy', () => {
    const strategy = new MotivatorStrategy()
    const composer = new PromptComposer(strategy)
    const ctx      = makeContext()
    const messages = composer.compose(ctx, 'hello', 'en', [])
    const userMsg  = messages.find(m => m.role === 'user')
    expect(userMsg?.content).toContain('42%')
  })
})
