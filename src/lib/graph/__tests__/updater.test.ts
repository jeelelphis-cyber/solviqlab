import { describe, it, expect } from 'vitest'
import { GraphUpdater } from '../updater'
import { GraphRepository } from '../repository'
import { MemoryProvider } from '../../user/storage'

function makeUpdater() {
  const repo = new GraphRepository(new MemoryProvider())
  return { updater: new GraphUpdater(repo), repo }
}

describe('GraphUpdater', () => {
  it('updateIdentity patches identity node', () => {
    const { updater, repo } = makeUpdater()
    updater.updateIdentity('u1', { language: 'es', userType: 'authenticated' })
    const g = repo.get('u1')!
    expect(g.identity.language).toBe('es')
    expect(g.identity.userType).toBe('authenticated')
  })

  it('upsertGoal adds a goal', () => {
    const { updater, repo } = makeUpdater()
    updater.upsertGoal('u1', { id: 'g1', text: 'Lose 5kg', status: 'active', priority: 'high', addedAt: new Date().toISOString() })
    expect(repo.get('u1')!.goals.items).toHaveLength(1)
  })

  it('upsertGoal replaces an existing goal with same id', () => {
    const { updater, repo } = makeUpdater()
    const base = { id: 'g1', status: 'active' as const, priority: 'low' as const, addedAt: '' }
    updater.upsertGoal('u1', { ...base, text: 'Old' })
    updater.upsertGoal('u1', { ...base, text: 'New', priority: 'high' })
    const goals = repo.get('u1')!.goals.items
    expect(goals).toHaveLength(1)
    expect(goals[0]!.text).toBe('New')
  })

  it('removeGoal deletes by id', () => {
    const { updater, repo } = makeUpdater()
    updater.upsertGoal('u1', { id: 'g1', text: 'Lose 5kg', status: 'active', priority: 'high', addedAt: '' })
    updater.removeGoal('u1', 'g1')
    expect(repo.get('u1')!.goals.items).toHaveLength(0)
  })

  it('upsertHabit adds a habit', () => {
    const { updater, repo } = makeUpdater()
    updater.upsertHabit('u1', { id: 'h1', name: 'Walk 10k steps', frequency: 'daily', sentiment: 'positive' })
    expect(repo.get('u1')!.habits.items).toHaveLength(1)
  })

  it('removeHabit removes by id', () => {
    const { updater, repo } = makeUpdater()
    updater.upsertHabit('u1', { id: 'h1', name: 'Walk', frequency: 'daily', sentiment: 'positive' })
    updater.removeHabit('u1', 'h1')
    expect(repo.get('u1')!.habits.items).toHaveLength(0)
  })

  it('upsertAssessment stores assessment', () => {
    const { updater, repo } = makeUpdater()
    updater.upsertAssessment('u1', { clusterId: 'weight', score: 72, confidence: 'established', assessedAt: '' })
    expect(repo.get('u1')!.assessments.items[0]?.score).toBe(72)
  })

  it('upsertAssessment replaces same clusterId', () => {
    const { updater, repo } = makeUpdater()
    updater.upsertAssessment('u1', { clusterId: 'weight', score: 60, confidence: 'preliminary', assessedAt: '' })
    updater.upsertAssessment('u1', { clusterId: 'weight', score: 80, confidence: 'confirmed', assessedAt: '' })
    expect(repo.get('u1')!.assessments.items).toHaveLength(1)
    expect(repo.get('u1')!.assessments.items[0]!.score).toBe(80)
  })

  it('updateJourney sets activeCluster and progress', () => {
    const { updater, repo } = makeUpdater()
    updater.updateJourney('u1', { activeCluster: 'weight', currentPhase: 'planning', progress: 35 })
    const j = repo.get('u1')!.journey
    expect(j.activeCluster).toBe('weight')
    expect(j.progress).toBe(35)
  })

  it('updateJourney accumulates completedSteps without duplicates', () => {
    const { updater, repo } = makeUpdater()
    updater.updateJourney('u1', { completedStep: 'step1' })
    updater.updateJourney('u1', { completedStep: 'step1' })
    updater.updateJourney('u1', { completedStep: 'step2' })
    expect(repo.get('u1')!.journey.completedSteps).toEqual(['step1', 'step2'])
  })

  it('addMemoryFact + removeMemoryFact work', () => {
    const { updater, repo } = makeUpdater()
    updater.addMemoryFact('u1', { id: 'f1', text: 'Prefers direct comms', category: 'preference', importance: 'high', addedAt: '' })
    expect(repo.get('u1')!.coachMemory.facts).toHaveLength(1)
    updater.removeMemoryFact('u1', 'f1')
    expect(repo.get('u1')!.coachMemory.facts).toHaveLength(0)
  })

  it('setCommunicationStyle sets style', () => {
    const { updater, repo } = makeUpdater()
    updater.setCommunicationStyle('u1', 'analytical')
    expect(repo.get('u1')!.coachMemory.communicationStyle).toBe('analytical')
  })

  it('addPreferredTopic deduplicates', () => {
    const { updater, repo } = makeUpdater()
    updater.addPreferredTopic('u1', 'nutrition')
    updater.addPreferredTopic('u1', 'nutrition')
    updater.addPreferredTopic('u1', 'sleep')
    expect(repo.get('u1')!.coachMemory.preferredTopics).toEqual(['nutrition', 'sleep'])
  })

  it('updateRetention sets dormancyLevel', () => {
    const { updater, repo } = makeUpdater()
    updater.updateRetention('u1', { daysSinceActive: 10, dormancyLevel: 'moderate' })
    const r = repo.get('u1')!.retention
    expect(r.daysSinceActive).toBe(10)
    expect(r.dormancyLevel).toBe('moderate')
  })

  it('updatePremium sets tier and quota', () => {
    const { updater, repo } = makeUpdater()
    updater.updatePremium('u1', { tier: 'pro', quotaLimit: 100 })
    const p = repo.get('u1')!.premium
    expect(p.tier).toBe('pro')
    expect(p.quotaLimit).toBe(100)
  })
})
