import { describe, it, expect } from 'vitest'
import { GraphSummarizer } from '../summarizer'
import { GraphRepository } from '../repository'
import { GraphUpdater } from '../updater'
import { MemoryProvider } from '../../user/storage'

function makeGraph() {
  const repo    = new GraphRepository(new MemoryProvider())
  const updater = new GraphUpdater(repo)
  updater.updateIdentity('u1', { userType: 'authenticated', language: 'en' })
  updater.upsertGoal('u1', { id: 'g1', text: 'Lose 5kg', status: 'active', priority: 'high', addedAt: '' })
  updater.upsertHabit('u1', { id: 'h1', name: 'Walk 10k', frequency: 'daily', sentiment: 'positive' })
  updater.upsertAssessment('u1', { clusterId: 'weight', score: 72, confidence: 'established', assessedAt: '' })
  updater.updateJourney('u1', { activeCluster: 'weight', currentPhase: 'planning', progress: 35 })
  updater.addMemoryFact('u1', { id: 'f1', text: 'Prefers morning workouts', category: 'preference', importance: 'high', addedAt: '' })
  updater.setCommunicationStyle('u1', 'direct')
  return repo.get('u1')!
}

describe('GraphSummarizer', () => {
  const summarizer = new GraphSummarizer()

  it('produces EN summary with all key sections', () => {
    const text = summarizer.summarize(makeGraph(), 'en')
    expect(text).toContain('## User Graph')
    expect(text).toContain('Registered')
    expect(text).toContain('Lose 5kg')
    expect(text).toContain('Walk 10k')
    expect(text).toContain('72/100')
    expect(text).toContain('planning')
    expect(text).toContain('35%')
    expect(text).toContain('Prefers morning workouts')
    expect(text).toContain('direct style preferred')
    expect(text).toContain('Active')
  })

  it('produces ES summary', () => {
    const text = summarizer.summarize(makeGraph(), 'es')
    expect(text).toContain('## Perfil del Usuario')
    expect(text).toContain('Registrado')
    expect(text).toContain('72/100')
  })

  it('marks high-priority goals in bold (EN)', () => {
    const text = summarizer.summarize(makeGraph(), 'en')
    expect(text).toContain('**Lose 5kg**')
  })

  it('includes quota for free tier', () => {
    const repo    = new GraphRepository(new MemoryProvider())
    const graph   = repo.getOrCreate('u1')
    const text    = summarizer.summarize(graph, 'en')
    expect(text).toContain('0/5 daily messages used')
  })

  it('estimateTokens returns positive integer', () => {
    const tokens = summarizer.estimateTokens(makeGraph())
    expect(tokens).toBeGreaterThan(0)
  })
})
