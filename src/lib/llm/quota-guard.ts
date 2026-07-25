// ─────────────────────────────────────────────────────────────────────────────
// QuotaGuard — daily request limits per subscription tier.
//
// Persisted in StorageProvider as a daily counter (resets at midnight UTC).
// Prevents free-tier users from exhausting LLM budget.
// ─────────────────────────────────────────────────────────────────────────────

import type { StorageProvider } from '../user/storage'

export interface QuotaConfig {
  readonly free:       number
  readonly pro:        number
  readonly enterprise: number
}

const DEFAULT_QUOTA: QuotaConfig = {
  free:       5,
  pro:        50,
  enterprise: 500,
}

interface QuotaRecord {
  date:  string   // 'YYYY-MM-DD' UTC
  count: number
}

const STORAGE_KEY = 'llm:quota'

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export class QuotaGuard {
  private readonly quota: QuotaConfig

  constructor(
    private readonly storage: StorageProvider,
    quota?: Partial<QuotaConfig>,
  ) {
    this.quota = { ...DEFAULT_QUOTA, ...quota }
  }

  check(tier: string): boolean {
    const limit  = this.limitFor(tier)
    const record = this.readRecord()
    return record.count < limit
  }

  increment(): void {
    const record = this.readRecord()
    this.storage.set(STORAGE_KEY, { date: todayUTC(), count: record.count + 1 })
  }

  remaining(tier: string): number {
    return Math.max(0, this.limitFor(tier) - this.readRecord().count)
  }

  private limitFor(tier: string): number {
    if (tier === 'pro')        return this.quota.pro
    if (tier === 'enterprise') return this.quota.enterprise
    return this.quota.free
  }

  private readRecord(): QuotaRecord {
    const stored = this.storage.get<QuotaRecord>(STORAGE_KEY)
    const today  = todayUTC()
    if (!stored || stored.date !== today) return { date: today, count: 0 }
    return stored
  }
}
