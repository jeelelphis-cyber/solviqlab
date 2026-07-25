export type SyncState = 'idle' | 'syncing' | 'error' | 'offline'

export interface SyncStatus {
  readonly state: SyncState
  readonly pendingCount: number
  readonly lastSyncedAt: string | null
  readonly lastError: string | null
}
