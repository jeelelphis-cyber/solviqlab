// ─────────────────────────────────────────────────────────────────────────────
// ProfileEngine — Core
//
// Maintains the user's Personal Health Profile.
// Receives raw calculator results, extracts signals, updates domain confidence,
// detects contradictions, and produces a structured profile for AI consumption.
//
// AI INTEGRATION (V3-08):
//   AI Coach receives PersonalHealthProfile, not raw history.
//   Profile shape:
//     domains       → what we know about the user per category
//     contradictions → inconsistencies to investigate
//     missing_insights → gaps to fill for a complete picture
//     timeline      → chronological signal history
//   This prevents AI from hallucinating data it doesn't have.
//
// DevOS path: moves to packages/profile-engine unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  PersonalHealthProfile,
  DomainProfile,
  HealthSignal,
  ProfileDomain,
  TimelineEntry,
  TimelineRange,
  MissingInsight,
} from './types'
import {
  ALL_DOMAINS,
  HEALTH_DOMAINS,
  DOMAIN_META_MAP,
  emptyDomainProfile,
  computeDomainStatus,
  INSTRUMENT_PROFILE_MAP,
} from './domains'
import { extractSignals } from './signals'
import { detectContradictions } from './contradictions'
import { emitProfileEvent } from './events'
import type { StorageProvider } from '../user/storage'

const PROFILE_KEY = 'health_profile'
const ENGINE_SCHEMA: 1 = 1

// ── Timeline Range Helper ─────────────────────────────────────────────────────

function getTimelineRange(iso: string): TimelineRange {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < 1)  return 'today'
  if (diffDays < 7)  return 'this_week'
  if (diffDays < 30) return 'this_month'
  return 'older'
}

// ── Missing Insights ──────────────────────────────────────────────────────────

function computeMissingInsights(
  domains: Readonly<Record<ProfileDomain, DomainProfile>>,
  completedSlugs: readonly string[]
): readonly MissingInsight[] {
  const insights: MissingInsight[] = []

  for (const domain of HEALTH_DOMAINS) {
    const meta = DOMAIN_META_MAP[domain]
    const profile = domains[domain]

    // Only suggest for domains with low confidence
    if (profile.confidence >= 70) continue

    for (const slug of meta.primary_instruments) {
      if (completedSlugs.includes(slug)) continue

      const config = INSTRUMENT_PROFILE_MAP[slug]
      if (!config) continue

      const domainConfig = config.domains.find(d => d.domain === domain)
      if (!domainConfig) continue

      insights.push({
        domain,
        domain_label: meta.label,
        instrument_slug: slug,
        instrument_name: config.name,
        reason: `Complete this to ${profile.confidence === 0 ? 'establish' : 'strengthen'} your ${meta.label} profile`,
        confidence_gain: domainConfig.confidence_contribution,
        priority: domainConfig.confidence_contribution >= 40 ? 'high'
          : domainConfig.confidence_contribution >= 20 ? 'medium' : 'low',
      })
    }
  }

  // Sort by confidence_gain descending
  return insights.sort((a, b) => b.confidence_gain - a.confidence_gain)
}

// ── Overall Confidence ────────────────────────────────────────────────────────

function computeOverallConfidence(domains: Readonly<Record<ProfileDomain, DomainProfile>>): number {
  const healthDomainProfiles = HEALTH_DOMAINS.map(d => domains[d])
  const active = healthDomainProfiles.filter(d => d.confidence > 0)
  if (active.length === 0) return 0
  const sum = active.reduce((acc, d) => acc + d.confidence, 0)
  return Math.round(sum / active.length)
}

// ── Profile Completeness ──────────────────────────────────────────────────────

const HIGH_PRIORITY_INSTRUMENTS = [
  'bmi-calculator', 'bmr-calculator', 'tdee-calculator',
  'calorie-calculator', 'sleep-calculator', 'body-fat-calculator',
]

function computeProfileCompleteness(completedSlugs: readonly string[]): number {
  const completed = HIGH_PRIORITY_INSTRUMENTS.filter(s => completedSlugs.includes(s))
  return Math.round((completed.length / HIGH_PRIORITY_INSTRUMENTS.length) * 100)
}

// ── ProfileEngine ─────────────────────────────────────────────────────────────

export class ProfileEngine {
  constructor(private readonly storage: StorageProvider) {}

  // ── Get or Create ────────────────────────────────────────────────────────────

  getOrCreateProfile(userId: string | null): PersonalHealthProfile {
    const stored = this.storage.get<PersonalHealthProfile>(PROFILE_KEY)
    if (stored?.schema_version === ENGINE_SCHEMA) return stored

    const now = new Date().toISOString()
    const domains = Object.fromEntries(
      ALL_DOMAINS.map(d => [d, emptyDomainProfile(d)])
    ) as Record<ProfileDomain, DomainProfile>

    const profile: PersonalHealthProfile = {
      user_id: userId,
      schema_version: ENGINE_SCHEMA,
      domains,
      contradictions: [],
      timeline: [],
      missing_insights: computeMissingInsights(domains, []),
      overall_confidence: 0,
      total_signals: 0,
      profile_completeness: 0,
      created_at: now,
      updated_at: now,
    }

    this.storage.set(PROFILE_KEY, profile)
    return profile
  }

  // ── Process a Calculator Result ───────────────────────────────────────────────

  processResult(params: {
    userId: string | null
    slug: string
    value: number | null
    label: string | null
    unit: string | null
    completedSlugs: readonly string[]
  }): PersonalHealthProfile {
    const { userId, slug, value, label, unit, completedSlugs } = params
    const now = new Date().toISOString()

    const current = this.getOrCreateProfile(userId)

    // Extract signals from this result
    const newSignals = extractSignals({ slug, value, label, unit, recorded_at: now })
    if (newSignals.length === 0) return current  // utility calculator, no profile impact

    // Collect all signals (existing + new)
    const allSignals: HealthSignal[] = []
    for (const d of ALL_DOMAINS) {
      allSignals.push(...current.domains[d].signals)
    }

    // Deduplicate by metric: keep only the most recent signal per (slug, metric)
    const signalMap = new Map<string, HealthSignal>()
    for (const s of allSignals) {
      signalMap.set(`${s.instrument_slug}:${s.metric}`, s)
    }
    for (const s of newSignals) {
      signalMap.set(`${s.instrument_slug}:${s.metric}`, s)
    }
    const mergedSignals = Array.from(signalMap.values())

    // Rebuild domain profiles
    const domainSignalMap = new Map<ProfileDomain, HealthSignal[]>()
    for (const s of mergedSignals) {
      const arr = domainSignalMap.get(s.domain) ?? []
      arr.push(s)
      domainSignalMap.set(s.domain, arr)
    }

    const updatedDomains: Record<ProfileDomain, DomainProfile> = { ...current.domains }
    const affectedDomains: ProfileDomain[] = []

    for (const domain of ALL_DOMAINS) {
      const domainSignals = domainSignalMap.get(domain) ?? []
      if (domainSignals.length === 0) continue

      const meta = DOMAIN_META_MAP[domain]
      // Confidence = sum of contributions, capped at 100
      const confidence = Math.min(
        domainSignals.reduce((acc, s) => acc + s.confidence_contribution, 0),
        100
      )
      const prevConf = updatedDomains[domain].confidence
      const status = computeDomainStatus(confidence, meta)
      const completedInDomain = domainSignals.map(s => s.instrument_slug)
      const missing = meta.primary_instruments.filter(
        i => !completedInDomain.includes(i)
      ) as string[]

      updatedDomains[domain] = {
        domain,
        confidence,
        status,
        signals: domainSignals,
        last_updated: now,
        missing_instruments: missing,
      }
      affectedDomains.push(domain)

      if (prevConf !== confidence) {
        emitProfileEvent({
          type: 'ConfidenceChanged',
          user_id: userId,
          domain,
          previous_confidence: prevConf,
          new_confidence: confidence,
          timestamp: now,
        })
      }
    }

    // Detect contradictions
    const contradictions = detectContradictions(mergedSignals)
    if (contradictions.length > current.contradictions.length) {
      const newOnes = contradictions.filter(
        c => !current.contradictions.some(e => e.id === c.id)
      )
      for (const c of newOnes) {
        emitProfileEvent({
          type: 'ContradictionDetected',
          user_id: userId,
          contradiction_id: c.id,
          severity: c.severity,
          domains: c.domains,
          timestamp: now,
        })
      }
    }

    // Build timeline entries for new signals
    const config = INSTRUMENT_PROFILE_MAP[slug]
    const newTimelineEntries: TimelineEntry[] = newSignals.map(s => ({
      instrument_slug: s.instrument_slug,
      instrument_name: config?.name ?? s.instrument_slug,
      domain: s.domain,
      metric: s.metric,
      value: s.value,
      label: s.label,
      status: s.status,
      recorded_at: s.recorded_at,
      range: getTimelineRange(s.recorded_at),
    }))

    // Merge timeline (dedup by slug+metric, keep newest)
    const timelineMap = new Map<string, TimelineEntry>()
    for (const e of current.timeline) {
      timelineMap.set(`${e.instrument_slug}:${e.metric}`, e)
    }
    for (const e of newTimelineEntries) {
      timelineMap.set(`${e.instrument_slug}:${e.metric}`, e)
    }
    const timeline = Array.from(timelineMap.values())
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())

    const overallConfidence = computeOverallConfidence(updatedDomains)

    const updated: PersonalHealthProfile = {
      ...current,
      domains: updatedDomains,
      contradictions,
      timeline,
      missing_insights: computeMissingInsights(updatedDomains, completedSlugs),
      overall_confidence: overallConfidence,
      total_signals: mergedSignals.length,
      profile_completeness: computeProfileCompleteness(completedSlugs),
      updated_at: now,
    }

    this.storage.set(PROFILE_KEY, updated)

    // Emit events for new signals
    for (const s of newSignals) {
      emitProfileEvent({
        type: 'SignalAdded',
        user_id: userId,
        instrument_slug: s.instrument_slug,
        domain: s.domain,
        metric: s.metric,
        timestamp: now,
      })
    }

    emitProfileEvent({
      type: 'ProfileUpdated',
      user_id: userId,
      instrument_slug: slug,
      domains_affected: affectedDomains,
      overall_confidence: overallConfidence,
      timestamp: now,
    })

    return updated
  }

  // ── Direct Signal Write (used by Assessment Engine) ──────────────────────────
  // Writes pre-built signals directly, bypassing extractSignals().
  // Used when Assessment Engine writes output signals back to Profile.

  writeSignalsDirect(params: {
    userId: string | null
    signals: readonly HealthSignal[]
    completedSlugs: readonly string[]
  }): PersonalHealthProfile {
    const { userId, signals: newSignals, completedSlugs } = params
    const now = new Date().toISOString()
    const current = this.getOrCreateProfile(userId)

    if (newSignals.length === 0) return current

    // Merge with existing signals
    const allSignals: HealthSignal[] = []
    for (const d of ALL_DOMAINS) {
      allSignals.push(...current.domains[d].signals)
    }
    const signalMap = new Map<string, HealthSignal>()
    for (const s of allSignals) {
      signalMap.set(`${s.instrument_slug}:${s.metric}`, s)
    }
    for (const s of newSignals) {
      signalMap.set(`${s.instrument_slug}:${s.metric}`, s)
    }
    const mergedSignals = Array.from(signalMap.values())

    const domainSignalMap = new Map<ProfileDomain, HealthSignal[]>()
    for (const s of mergedSignals) {
      const arr = domainSignalMap.get(s.domain) ?? []
      arr.push(s)
      domainSignalMap.set(s.domain, arr)
    }

    const updatedDomains: Record<ProfileDomain, DomainProfile> = { ...current.domains }
    for (const domain of ALL_DOMAINS) {
      const domainSignals = domainSignalMap.get(domain) ?? []
      if (domainSignals.length === 0) continue
      const meta = DOMAIN_META_MAP[domain]
      const confidence = Math.min(
        domainSignals.reduce((acc, s) => acc + s.confidence_contribution, 0),
        100
      )
      const missing = meta.primary_instruments.filter(
        i => !domainSignals.some(s => s.instrument_slug === i)
      ) as string[]
      updatedDomains[domain] = {
        domain,
        confidence,
        status: computeDomainStatus(confidence, meta),
        signals: domainSignals,
        last_updated: now,
        missing_instruments: missing,
      }
    }

    const overallConfidence = computeOverallConfidence(updatedDomains)
    const updated: PersonalHealthProfile = {
      ...current,
      domains: updatedDomains,
      missing_insights: computeMissingInsights(updatedDomains, completedSlugs),
      overall_confidence: overallConfidence,
      total_signals: mergedSignals.length,
      profile_completeness: computeProfileCompleteness(completedSlugs),
      updated_at: now,
    }
    this.storage.set(PROFILE_KEY, updated)
    return updated
  }

  // ── Read ──────────────────────────────────────────────────────────────────────

  getProfile(userId: string | null): PersonalHealthProfile {
    return this.getOrCreateProfile(userId)
  }

  clearProfile(): void {
    this.storage.remove(PROFILE_KEY)
  }
}
