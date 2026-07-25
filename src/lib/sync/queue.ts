import type { StorageProvider } from '../user/storage'

const QUEUE_KEY   = 'sync:queue'
const MAX_ATTEMPTS = 5

function uuid(): string {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function now(): string { return new Date().toISOString() }

export interface SyncQueueEntry {
  readonly id: string
  readonly key: string
  readonly payload: unknown
  readonly attempts: number
  readonly created_at: string
  readonly last_attempt_at: string | null
}

export class SyncQueue {
  constructor(private readonly storage: StorageProvider) {}

  private read(): SyncQueueEntry[] {
    return this.storage.get<SyncQueueEntry[]>(QUEUE_KEY) ?? []
  }

  private write(entries: SyncQueueEntry[]): void {
    this.storage.set(QUEUE_KEY, entries)
  }

  // Upsert by key — newer payload replaces older pending write for same key.
  enqueue(key: string, payload: unknown): void {
    const entries = this.read()
    const idx     = entries.findIndex(e => e.key === key)
    if (idx >= 0) {
      entries[idx] = { ...entries[idx]!, payload }
      this.write(entries)
      return
    }
    entries.push({ id: uuid(), key, payload, attempts: 0, created_at: now(), last_attempt_at: null })
    this.write(entries)
  }

  // Entries still eligible for sync attempts.
  getRetryable(): readonly SyncQueueEntry[] {
    return this.read().filter(e => e.attempts < MAX_ATTEMPTS)
  }

  // Remove on success. Increment attempt counter on failure.
  markAttempted(id: string, success: boolean): void {
    const entries = this.read()
    if (success) {
      this.write(entries.filter(e => e.id !== id))
      return
    }
    const idx = entries.findIndex(e => e.id === id)
    if (idx < 0) return
    entries[idx] = { ...entries[idx]!, attempts: entries[idx]!.attempts + 1, last_attempt_at: now() }
    this.write(entries)
  }

  // Entries that exceeded MAX_ATTEMPTS — surfaced for error reporting.
  getDead(): readonly SyncQueueEntry[] {
    return this.read().filter(e => e.attempts >= MAX_ATTEMPTS)
  }

  size(): number { return this.read().length }

  clear(): void { this.write([]) }
}
