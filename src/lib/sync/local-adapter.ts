import type { StorageProvider } from '../user/storage'
import type { SyncRepository } from './types'

export class LocalSyncAdapter<T> implements SyncRepository<T> {
  private readonly pendingKeys = new Set<string>()

  constructor(
    private readonly storage: StorageProvider,
    private readonly namespace: string,
  ) {}

  private key(k: string): string {
    return `${this.namespace}:${k}`
  }

  get(key: string): T | null {
    return this.storage.get<T>(this.key(key))
  }

  set(key: string, value: T): void {
    this.storage.set(this.key(key), value)
    this.pendingKeys.add(key)
  }

  remove(key: string): void {
    this.storage.remove(this.key(key))
    this.pendingKeys.delete(key)
  }

  getPendingSyncKeys(): readonly string[] {
    return [...this.pendingKeys]
  }

  markSynced(key: string): void {
    this.pendingKeys.delete(key)
  }
}
