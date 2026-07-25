// ─────────────────────────────────────────────────────────────────────────────
// Variant selector — deterministic A/B selection based on userId hash.
// Same user always sees the same variant (consistent experience + GA4 tracking).
// Falls back to simple hash of name if no userId.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScriptContext, ScriptVariant, SelectedScript } from './types'
import { OPENING_VARIANTS }                                   from './opening'
import { INSIGHT_VARIANTS, INSIGHT_FALLBACK }                 from './insight'
import { HOOK_VARIANTS }                                      from './hook'

export function selectVariants(context: ScriptContext, userId?: string): SelectedScript {
  const lang    = context.lang
  const cluster = context.cluster

  // Opening: hash(seed) % 3
  const openingPool  = OPENING_VARIANTS[lang] ?? OPENING_VARIANTS['en']!
  const openingPicked = pickVariant(openingPool, (userId ?? context.name) + '0')

  // Insight: hash(seed+1) % 2, fallback if cluster unknown
  const insightPool  = INSIGHT_VARIANTS[lang]?.[cluster]
    ?? INSIGHT_VARIANTS['en']?.[cluster]
  const insightPicked: ScriptVariant = insightPool
    ? pickVariant(insightPool, (userId ?? context.name) + '1')
    : (INSIGHT_FALLBACK[lang] ?? INSIGHT_FALLBACK['en']!)

  // Hook: hash(seed+2) % 4
  const hookPool    = HOOK_VARIANTS[lang] ?? HOOK_VARIANTS['en']!
  const hookPicked  = pickVariant(hookPool, (userId ?? context.name) + '2')

  const openingText = interpolate(openingPicked.text, context)
  const insightText = interpolate(insightPicked.text, context)
  const hookText    = interpolate(hookPicked.text, context)

  return {
    text: [openingText, insightText, hookText].join(' '),
    variantIds: {
      opening: openingPicked.id,
      insight: insightPicked.id,
      hook:    hookPicked.id,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/** Simple deterministic hash: sum of char codes modulo variants length. */
function pickVariant<T extends ScriptVariant>(variants: T[], seed: string): T {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash += seed.charCodeAt(i)
  }
  return variants[hash % variants.length]!
}

/**
 * Replace [name] and [bmiText or score] placeholders with actual context values.
 * - [name]               → context.name
 * - [bmiText or score]   → context.bmiText if present, else context.score as string, else omitted
 */
function interpolate(text: string, context: ScriptContext): string {
  let result = text.replace(/\[name\]/g, context.name)

  const dataPoint = context.bmiText
    ?? (context.score !== null ? String(context.score) : null)

  if (dataPoint) {
    result = result.replace(/\[bmiText or score\]/g, dataPoint)
  } else {
    // Remove the placeholder and tidy up surrounding punctuation/spaces
    result = result.replace(/\s*\[bmiText or score\]\s*/g, ' ').trim()
  }

  return result
}
