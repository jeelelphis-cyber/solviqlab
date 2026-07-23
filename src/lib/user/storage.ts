// ─────────────────────────────────────────────────────────────────────────────
// Storage Provider Pattern
//
// The StorageProvider interface decouples the UserEngine from any specific
// storage implementation. The engine never calls localStorage directly.
//
// Current implementation: LocalStorageProvider
//
// Future implementations (require zero engine changes):
//   IndexedDBProvider     — for larger result histories (>10MB)
//   SupabaseProvider      — for authenticated users post-V3-04
//   CloudSyncProvider     — multi-device sync
//   MemoryProvider        — for tests and SSR no-ops
// ─────────────────────────────────────────────────────────────────────────────

export interface StorageProvider {
  /** Read a value. Returns null if key missing or parse fails. */
  get<T>(key: string): T | null

  /** Write a value. Silent fail on storage error (quota exceeded, etc.). */
  set<T>(key: string, value: T): void

  /** Remove a key. No-op if missing. */
  remove(key: string): void

  /** Remove all keys managed by this provider. */
  clear(): void

  /** Returns true if this provider is available in the current environment. */
  isAvailable(): boolean
}

// ── Local Storage Provider ─────────────────────────────────────────────────────

const PREFIX = 'solviqlab:user:'

export class LocalStorageProvider implements StorageProvider {
  isAvailable(): boolean {
    try {
      const test = '__solviqlab_test__'
      localStorage.setItem(test, '1')
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Quota exceeded or private mode — degrade gracefully
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {}
  }

  clear(): void {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(PREFIX)) keysToRemove.push(key)
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    } catch {}
  }
}

// ── Memory Provider (SSR / Tests) ─────────────────────────────────────────────

export class MemoryProvider implements StorageProvider {
  private readonly store = new Map<string, string>()

  isAvailable() { return true }

  get<T>(key: string): T | null {
    const raw = this.store.get(key)
    if (!raw) return null
    try { return JSON.parse(raw) as T } catch { return null }
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value))
  }

  remove(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

// ── Provider Factory ──────────────────────────────────────────────────────────

export function createStorageProvider(): StorageProvider {
  if (typeof window === 'undefined') {
    return new MemoryProvider()
  }
  const ls = new LocalStorageProvider()
  return ls.isAvailable() ? ls : new MemoryProvider()
}
