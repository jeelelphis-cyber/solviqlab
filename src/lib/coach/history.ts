import type { IntentCluster } from '../assessment/types'
import type { StorageProvider } from '../user/storage'
import type { CoachTrigger, CoachReason, CoachMessageType, CoachPriority, CoachMessage } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// CoachHistory — append-only log of every Coach message shown to the user.
//
// Persists across sessions. Used for:
//   • Journey History UI (future)
//   • Retention analytics
//   • LLM context (Premium)
//   • Anti-spam cross-session
//
// Storage key: coach:history (single list, capped at MAX_ENTRIES)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY    = 'coach:history'
const MAX_ENTRIES    = 200

export interface CoachHistoryEntry {
  readonly message_id:     string
  readonly cluster:        IntentCluster
  readonly trigger:        CoachTrigger
  readonly reason:         CoachReason
  readonly type:           CoachMessageType
  readonly priority:       CoachPriority
  readonly title:          string       // rendered snapshot (for display in history)
  readonly body:           string       // rendered snapshot
  readonly shown_at:       string       // ISO timestamp
  readonly lang:           string
  readonly coach_version:  string
        clicked:           boolean      // mutable: updated when user taps CTA
        dismissed:         boolean      // mutable: updated when user closes
        action_clicked:    string | null  // actionId of CTA tapped
}

export class CoachHistoryRepository {
  constructor(private readonly storage: StorageProvider) {}

  // ── Write ──────────────────────────────────────────────────────────────────

  append(entry: CoachHistoryEntry): void {
    const all    = this.loadAll()
    const pruned = all.length >= MAX_ENTRIES ? all.slice(-(MAX_ENTRIES - 1)) : all
    this.save([...pruned, entry])
  }

  markClicked(messageId: string, actionId: string): void {
    const all     = this.loadAll()
    const updated = all.map(e =>
      e.message_id === messageId
        ? { ...e, clicked: true, action_clicked: actionId }
        : e
    )
    this.save(updated)
  }

  markDismissed(messageId: string): void {
    const all     = this.loadAll()
    const updated = all.map(e =>
      e.message_id === messageId ? { ...e, dismissed: true } : e
    )
    this.save(updated)
  }

  // ── Read (History API) ────────────────────────────────────────────────────

  getAll(): readonly CoachHistoryEntry[] {
    return this.loadAll()
  }

  getForCluster(cluster: IntentCluster): readonly CoachHistoryEntry[] {
    return this.loadAll().filter(e => e.cluster === cluster)
  }

  getRecent(limit: number): readonly CoachHistoryEntry[] {
    const all = this.loadAll()
    return all.slice(-Math.max(0, limit))
  }

  getByTrigger(trigger: CoachTrigger): readonly CoachHistoryEntry[] {
    return this.loadAll().filter(e => e.trigger === trigger)
  }

  getTotalShown(): number {
    return this.loadAll().length
  }

  getClickRate(): number {
    const all     = this.loadAll()
    if (all.length === 0) return 0
    const clicked = all.filter(e => e.clicked).length
    return Math.round((clicked / all.length) * 100) / 100
  }

  clear(): void {
    this.storage.remove(STORAGE_KEY)
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private loadAll(): CoachHistoryEntry[] {
    return this.storage.get<CoachHistoryEntry[]>(STORAGE_KEY) ?? []
  }

  private save(entries: CoachHistoryEntry[]): void {
    this.storage.set(STORAGE_KEY, entries)
  }
}

// ── Factory helper ────────────────────────────────────────────────────────────

export function buildHistoryEntry(
  message: CoachMessage,
  lang:    string,
  coachVersion: string,
): CoachHistoryEntry {
  return {
    message_id:    message.message_id,
    cluster:       message.cluster,
    trigger:       message.decision.trigger,
    reason:        message.decision.reason,
    type:          message.type,
    priority:      message.priority,
    title:         message.title,
    body:          message.body,
    shown_at:      new Date().toISOString(),
    lang,
    coach_version: coachVersion,
    clicked:       false,
    dismissed:     false,
    action_clicked: null,
  }
}
