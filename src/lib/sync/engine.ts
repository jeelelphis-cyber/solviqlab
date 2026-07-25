import type { CloudSyncAdapter } from './cloud-adapter'
import type { ConflictResolver } from './conflict'
import type { SyncQueueEntry } from './queue'
import { SyncQueue } from './queue'
import type { SyncState, SyncStatus } from './status'
import type { StorageProvider } from '../user/storage'

export class SyncEngine {
  private state: SyncState     = 'idle'
  private lastSyncedAt: string | null = null
  private lastError: string | null    = null

  readonly queue: SyncQueue

  constructor(
    storage: StorageProvider,
    private readonly adapter: CloudSyncAdapter,
    private readonly resolver: ConflictResolver,
  ) {
    this.queue = new SyncQueue(storage)
  }

  // Schedule a key+payload for background cloud sync.
  schedule(key: string, payload: unknown): void {
    this.queue.enqueue(key, payload)
  }

  // Process all retryable queue entries. No-op when adapter is offline.
  async flush(): Promise<void> {
    const available = await this.adapter.isAvailable()
    if (!available) {
      this.state = 'offline'
      return
    }

    this.state = 'syncing'
    const entries = this.queue.getRetryable()

    for (const entry of entries) {
      await this.processEntry(entry)
    }

    const remaining = this.queue.getRetryable().length
    this.lastSyncedAt = new Date().toISOString()
    this.state        = remaining > 0 ? 'error' : 'idle'
  }

  private async processEntry(entry: SyncQueueEntry): Promise<void> {
    const remote = await this.adapter.pull(entry.key)
    const value  = this.resolver.resolve(entry.payload, remote, {
      key:              entry.key,
      localUpdatedAt:   entry.last_attempt_at ?? entry.created_at,
      remoteUpdatedAt:  null,
    })
    const result = await this.adapter.push(entry.key, value)
    this.queue.markAttempted(entry.id, result.success)
    if (!result.success) {
      this.lastError = result.error ?? 'Sync failed'
    }
  }

  getStatus(): SyncStatus {
    return {
      state:        this.state,
      pendingCount: this.queue.size(),
      lastSyncedAt: this.lastSyncedAt,
      lastError:    this.lastError,
    }
  }

  // Start periodic background sync. Returns a cancel function.
  startBackgroundSync(intervalMs = 30_000): () => void {
    const handle = setInterval(() => { this.flush().catch(() => {}) }, intervalMs)
    return () => clearInterval(handle)
  }
}
