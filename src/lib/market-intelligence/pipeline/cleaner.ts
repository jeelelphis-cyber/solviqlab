// ─────────────────────────────────────────────────────────────────────────────
// KeywordCleaner — removes noise from raw keyword lists.
//
// Stage 2 of the pipeline: Raw Data → Cleaning
// Removes: duplicates, brand queries, single-word noise, navigational clutter.
// ─────────────────────────────────────────────────────────────────────────────

import type { KeywordEntry } from '../types'

// Known brand/navigational noise words
const BRAND_TERMS = new Set([
  'google', 'apple', 'amazon', 'reddit', 'youtube', 'wikipedia',
  'facebook', 'twitter', 'instagram', 'pinterest', 'quora',
  'webmd', 'mayo clinic', 'healthline', 'medical news today',
])

const NOISE_PATTERNS = [
  /^\d+$/,                          // pure numbers
  /^[a-z]$/,                        // single characters
  /\b(login|signup|account|app|download|free download|apk)\b/,
  /\b(near me|in my area|local)\b/, // local intent — not our market
]

export class KeywordCleaner {
  clean(keywords: KeywordEntry[], seed: string): KeywordEntry[] {
    const seen = new Set<string>()

    return keywords.filter(kw => {
      const k = kw.keyword.toLowerCase().trim()

      // Deduplicate
      if (seen.has(k)) return false
      seen.add(k)

      // Remove single words (unless the seed itself is one word)
      if (!k.includes(' ') && k !== seed.toLowerCase()) return false

      // Remove brand terms
      if (BRAND_TERMS.has(k)) return false
      if ([...BRAND_TERMS].some(b => k.startsWith(b + ' ') || k.endsWith(' ' + b))) return false

      // Remove noise patterns
      if (NOISE_PATTERNS.some(p => p.test(k))) return false

      // Remove zero-volume (keep unknowns — null is ok)
      if (kw.volume !== null && kw.volume < 50) return false

      return true
    })
  }
}
