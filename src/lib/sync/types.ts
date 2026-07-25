// SyncRepository — local-first, sync-ready storage abstraction.
// Phase 1: LocalSyncAdapter (device-only, marks pending for future cloud sync).
// Phase 2+: Replace with CloudSyncAdapter — zero consumer changes.

export interface SyncRepository<T> {
  get(key: string): T | null
  set(key: string, value: T): void
  remove(key: string): void
  /** Keys written since last markSynced() — sent to cloud in Phase 2. */
  getPendingSyncKeys(): readonly string[]
  markSynced(key: string): void
}
