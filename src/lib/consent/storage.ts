import type { ConsentState } from './types'

const STORAGE_KEY = 'solviqlab_consent'
const TTL_MS = 365 * 24 * 60 * 60 * 1000 // 365 days

export function loadConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    // Reject stale or malformed entries
    if (parsed.v !== 1 || typeof parsed.ts !== 'number') return null
    if (Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or private-browsing restriction — fail silently.
  }
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
