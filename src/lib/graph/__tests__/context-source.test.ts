import { describe, it, expect } from 'vitest'
import { GraphContextSource } from '../context-source'
import { GraphRepository } from '../repository'
import { GraphUpdater } from '../updater'
import { MemoryProvider } from '../../user/storage'

function makeSource(userId = 'u1', lang = 'en') {
  const repo    = new GraphRepository(new MemoryProvider())
  const updater = new GraphUpdater(repo)
  return { source: new GraphContextSource(repo, () => lang, () => userId), repo, updater }
}

describe('GraphContextSource', () => {
  it('key is "graph"', () => {
    expect(makeSource().source.key).toBe('graph')
  })

  it('returns null graphSummary when no graph exists', () => {
    const { source } = makeSource('nobody')
    expect(source.contribute().graphSummary).toBeNull()
  })

  it('returns graphSummary when graph exists', () => {
    const { source, repo } = makeSource()
    repo.getOrCreate('u1')
    const ctx = source.contribute()
    expect(ctx.graphSummary).toContain('## User Graph')
  })

  it('contributes identity fields from graph', () => {
    const { source, repo, updater } = makeSource()
    repo.getOrCreate('u1')
    updater.updateIdentity('u1', { userType: 'authenticated' })
    updater.updatePremium('u1', { tier: 'pro' })
    const ctx = source.contribute()
    expect(ctx.userType).toBe('authenticated')
    expect(ctx.subscription).toBe('pro')
  })

  it('contributes primaryGoal from highest-priority active goal', () => {
    const { source, repo, updater } = makeSource()
    repo.getOrCreate('u1')
    updater.upsertGoal('u1', { id: 'g1', text: 'Lose 5kg', status: 'active', priority: 'high', addedAt: '' })
    updater.upsertGoal('u1', { id: 'g2', text: 'Run 5k', status: 'active', priority: 'low', addedAt: '' })
    expect(source.contribute().primaryGoal).toBe('Lose 5kg')
  })

  it('contributes journey fields', () => {
    const { source, repo, updater } = makeSource()
    repo.getOrCreate('u1')
    updater.updateJourney('u1', { activeCluster: 'weight', currentPhase: 'planning', progress: 40 })
    const ctx = source.contribute()
    expect(ctx.activeCluster).toBe('weight')
    expect(ctx.currentPhase).toBe('planning')
    expect(ctx.journeyProgress).toBe(40)
  })

  it('contributes retention fields', () => {
    const { source, repo, updater } = makeSource()
    repo.getOrCreate('u1')
    updater.updateRetention('u1', { daysSinceActive: 7, dormancyLevel: 'mild' })
    const ctx = source.contribute()
    expect(ctx.daysSinceActive).toBe(7)
    expect(ctx.dormancyLevel).toBe('mild')
  })
})
