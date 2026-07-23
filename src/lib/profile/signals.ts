// ─────────────────────────────────────────────────────────────────────────────
// Signal Extraction
//
// Converts a raw calculator result into typed HealthSignals.
// One calculator result may produce signals for multiple domains.
// ─────────────────────────────────────────────────────────────────────────────

import type { HealthSignal, SignalStatus } from './types'
import { INSTRUMENT_PROFILE_MAP } from './domains'

// ── Status Inference ───────────────────────────────────────────────────────────

function inferStatus(
  label: string | null,
  statusMap: Readonly<Record<string, SignalStatus>> | undefined
): SignalStatus {
  if (!label || !statusMap) return 'unknown'
  return statusMap[label] ?? 'normal'
}

// ── Deterministic Signal ID ────────────────────────────────────────────────────

function makeSignalId(slug: string, metric: string, timestamp: string): string {
  const raw = `${slug}:${metric}:${timestamp}`
  return raw.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    .toString(36).replace('-', 'n')
}

// ── Signal Extractor ──────────────────────────────────────────────────────────

export interface RawResult {
  readonly slug: string
  readonly value: number | null
  readonly label: string | null
  readonly unit: string | null
  readonly recorded_at: string
}

/**
 * Extract all signals from a calculator result.
 * Returns [] for utility calculators (area, currency, etc.).
 */
export function extractSignals(result: RawResult): readonly HealthSignal[] {
  const config = INSTRUMENT_PROFILE_MAP[result.slug]
  if (!config) return []

  return config.domains.map(domainConfig => ({
    id: makeSignalId(result.slug, domainConfig.metric, result.recorded_at),
    instrument_slug: result.slug,
    domain: domainConfig.domain,
    metric: domainConfig.metric,
    value: result.value,
    label: result.label,
    unit: result.unit,
    status: inferStatus(result.label, domainConfig.status_map),
    confidence_contribution: domainConfig.confidence_contribution,
    recorded_at: result.recorded_at,
  }))
}
