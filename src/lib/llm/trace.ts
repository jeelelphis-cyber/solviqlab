// ─────────────────────────────────────────────────────────────────────────────
// TraceContext — correlates a single user request through the entire pipeline.
//
// One trace per ask() / askStream() call. Propagated to MetricsCollector so
// every CallMetric can be joined by traceId for debugging and OTel export.
// ─────────────────────────────────────────────────────────────────────────────

export interface TraceContext {
  readonly traceId:   string
  readonly startedAt: string
}

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function createTrace(): TraceContext {
  return { traceId: generateId(), startedAt: new Date().toISOString() }
}

export function elapsedMs(trace: TraceContext): number {
  return Date.now() - new Date(trace.startedAt).getTime()
}
