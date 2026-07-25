import { describe, it, expect, vi } from 'vitest'
import { IdentityService } from '../service'
import { LocalIdentityProvider } from '../provider'
import { UserEngine } from '../../user/engine'
import { MemoryProvider } from '../../user/storage'
import { ProfileEngine } from '../../profile/engine'

function makeService() {
  const storage  = new MemoryProvider()
  const profile  = new ProfileEngine(storage)
  const engine   = new UserEngine(storage, profile)
  const provider = new LocalIdentityProvider(engine)
  const identity = new IdentityService(provider)
  return { identity, engine, provider, storage }
}

describe('IdentityService', () => {
  it('init() creates anonymous user when none exists', () => {
    const { identity, engine } = makeService()
    identity.init()
    expect(engine.getUser()).not.toBeNull()
    expect(engine.getUser()?.type).toBe('anonymous')
  })

  it('init() is idempotent — same user after two calls', () => {
    const { identity, engine } = makeService()
    identity.init()
    const id1 = engine.getUserId()
    identity.init()
    const id2 = engine.getUserId()
    expect(id1).toBe(id2)
  })

  it('getSnapshot() returns anonymous snapshot after init', () => {
    const { identity } = makeService()
    identity.init()
    const snap = identity.getSnapshot()
    expect(snap.type).toBe('anonymous')
    expect(snap.userId).toBeTruthy()
    expect(snap.resultCount).toBe(0)
    expect(snap.journeyCount).toBe(0)
  })

  it('getSnapshot() returns empty snapshot before init', () => {
    const { identity } = makeService()
    const snap = identity.getSnapshot()
    expect(snap.userId).toBe('')
  })

  it('isAuthenticated() returns false for anonymous user', () => {
    const { identity } = makeService()
    identity.init()
    expect(identity.isAuthenticated()).toBe(false)
  })

  it('getSuggestion() returns shouldSuggest:false when no user', () => {
    const { identity } = makeService()
    const result = identity.getSuggestion('en')
    expect(result.shouldSuggest).toBe(false)
    expect(result.message).toBeNull()
  })

  it('getSuggestion() returns shouldSuggest:false for authenticated user', () => {
    const { identity } = makeService()
    identity.init()
    identity.upgrade({ email: 'a@b.com', display_name: null, auth_provider: 'email' })
    const result = identity.getSuggestion('en')
    expect(result.shouldSuggest).toBe(false)
  })

  it('getSuggestion() is pure — no analytics side effects', () => {
    const gtagSpy = vi.fn()
    // @ts-expect-error — node env, fake window
    globalThis.window = { gtag: gtagSpy }
    const { identity } = makeService()
    identity.init()
    identity.getSuggestion('en')
    expect(gtagSpy).not.toHaveBeenCalledWith('event', 'RegistrationSuggested', expect.any(Object))
    // @ts-expect-error
    globalThis.window = undefined
  })

  it('getSuggestion() triggers three_instruments and returns EN message', () => {
    const { identity, engine } = makeService()
    identity.init()
    // Use slugs that don't match any journey definition — no journey progress
    ;['unknown-tool-1', 'unknown-tool-2', 'unknown-tool-3'].forEach(slug => {
      engine.storeResult({ slug, name: slug, value: 1, label: null, category: null, unit: null, metadata: {} })
    })
    const result = identity.getSuggestion('en')
    expect(result.shouldSuggest).toBe(true)
    expect(result.reason).toBe('three_instruments')
    expect(result.message).toContain("You've completed 3 instruments")
  })

  it('getSuggestion() triggers three_instruments and returns ES message', () => {
    const { identity, engine } = makeService()
    identity.init()
    // Use slugs that don't match any journey — forces three_instruments (P4), not journey_progress_35 (P3)
    ;['unknown-tool-1', 'unknown-tool-2', 'unknown-tool-3'].forEach(slug => {
      engine.storeResult({ slug, name: slug, value: 1, label: null, category: null, unit: null, metadata: {} })
    })
    const result = identity.getSuggestion('es')
    expect(result.shouldSuggest).toBe(true)
    expect(result.reason).toBe('three_instruments')
    expect(result.message).toContain('cuenta')
  })

  it('getSuggestion() falls back to EN for unsupported lang', () => {
    const { identity, engine } = makeService()
    identity.init()
    ;['unknown-tool-1', 'unknown-tool-2', 'unknown-tool-3'].forEach(slug => {
      engine.storeResult({ slug, name: slug, value: 1, label: null, category: null, unit: null, metadata: {} })
    })
    const result = identity.getSuggestion('de')
    expect(result.shouldSuggest).toBe(true)
    expect(result.message).toContain("You've completed 3 instruments")
  })

  it('upgrade() converts anonymous to authenticated', () => {
    const { identity, engine } = makeService()
    identity.init()
    identity.upgrade({ email: 'user@test.com', display_name: 'Test User', auth_provider: 'email' })
    expect(engine.isAuthenticated()).toBe(true)
    expect((engine.getUser() as any).email).toBe('user@test.com')
  })

  it('upgrade() preserves result history (no data loss)', () => {
    const { identity, engine } = makeService()
    identity.init()
    engine.storeResult({ slug: 'bmi-calculator', name: 'BMI', value: 22, label: 'Normal', category: null, unit: null, metadata: {} })
    engine.storeResult({ slug: 'bmr-calculator', name: 'BMR', value: 1800, label: null, category: null, unit: null, metadata: {} })
    const countBefore = engine.getResultHistory().length
    identity.upgrade({ email: 'u@test.com', display_name: null, auth_provider: 'google' })
    expect(engine.isAuthenticated()).toBe(true)
    expect(engine.getResultHistory().length).toBe(countBefore)
  })

  it('upgrade() preserves journey states', () => {
    const { identity, engine } = makeService()
    identity.init()
    // Complete steps that trigger journey state creation
    engine.storeResult({ slug: 'bmi-calculator', name: 'BMI', value: 22, label: null, category: null, unit: null, metadata: {} })
    const journeysBefore = engine.getAllJourneyStates().length
    identity.upgrade({ email: 'u@test.com', display_name: null, auth_provider: 'email' })
    expect(engine.getAllJourneyStates().length).toBe(journeysBefore)
  })

  it('markSuggestionShown() fires RegistrationSuggested analytics', () => {
    const { identity } = makeService()
    identity.init()
    // Stub after init so UserCreated event does not pollute this assertion
    const gtagSpy = vi.fn()
    // @ts-expect-error — node env, fake window
    globalThis.window = { gtag: gtagSpy }
    identity.markSuggestionShown({
      shouldSuggest: true,
      reason: 'three_instruments',
      message: 'test',
      urgency: 'low',
    })
    expect(gtagSpy).toHaveBeenCalledWith('event', 'RegistrationSuggested', expect.any(Object))
    // @ts-expect-error
    globalThis.window = undefined
  })

  it('markSuggestionShown() is a no-op when shouldSuggest is false', () => {
    const { identity } = makeService()
    identity.init()
    // Stub after init so UserCreated event does not pollute this assertion
    const gtagSpy = vi.fn()
    // @ts-expect-error — node env, fake window
    globalThis.window = { gtag: gtagSpy }
    identity.markSuggestionShown({ shouldSuggest: false, reason: null, message: null, urgency: 'low' })
    expect(gtagSpy).not.toHaveBeenCalled()
    // @ts-expect-error
    globalThis.window = undefined
  })
})
