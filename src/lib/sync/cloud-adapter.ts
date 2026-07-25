// ─────────────────────────────────────────────────────────────────────────────
// CloudSyncAdapter — interface for cloud sync backends.
//
// Phase 1: NoOpCloudAdapter (always offline — data stays local).
// Phase 3+: SupabaseCloudAdapter, replacing NoOp here, zero other changes.
// ─────────────────────────────────────────────────────────────────────────────

export interface CloudPushResult {
  readonly success: boolean
  readonly error?: string
}

export interface CloudSyncAdapter {
  push<T>(key: string, value: T): Promise<CloudPushResult>
  pull<T>(key: string): Promise<T | null>
  isAvailable(): Promise<boolean>
}

export class NoOpCloudAdapter implements CloudSyncAdapter {
  async push<T>(_key: string, _value: T): Promise<CloudPushResult> {
    return { success: true }
  }

  async pull<T>(_key: string): Promise<T | null> {
    return null
  }

  async isAvailable(): Promise<boolean> {
    return false
  }
}
