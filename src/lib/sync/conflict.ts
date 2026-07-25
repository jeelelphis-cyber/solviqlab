// ─────────────────────────────────────────────────────────────────────────────
// ConflictResolver — strategy for local vs. remote divergence.
//
// Phase 1: LocalWinsResolver (device is always source of truth).
// Phase 3+: MergeUnionResolver for structured data (result_history, etc.).
// ─────────────────────────────────────────────────────────────────────────────

export interface ConflictContext {
  readonly key: string
  readonly localUpdatedAt: string
  readonly remoteUpdatedAt: string | null
}

export interface ConflictResolver {
  resolve<T>(local: T, remote: T | null, context: ConflictContext): T
}

// Default strategy: offline-first. Whatever the device has is correct.
export class LocalWinsResolver implements ConflictResolver {
  resolve<T>(local: T, _remote: T | null, _context: ConflictContext): T {
    return local
  }
}

// Placeholder for future merge strategies (union of arrays, etc.)
export class RemoteWinsResolver implements ConflictResolver {
  resolve<T>(_local: T, remote: T | null, _context: ConflictContext): T {
    if (remote === null) throw new Error('RemoteWinsResolver: no remote value to resolve to')
    return remote
  }
}
