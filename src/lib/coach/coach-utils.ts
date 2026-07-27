import type { CoachPersonaConfig } from '@/lib/coach-personas/types'
import type { getT } from '@/lib/i18n/ui'

type TFn = ReturnType<typeof getT>

function readGraphFromLocalStorage(): Record<string, unknown> | null {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('graph:'))
    if (!keys.length) return null
    return JSON.parse(localStorage.getItem(keys[0]) ?? '{}')
  } catch { return null }
}

export function readPersonalizedFacts(relevantSlugs: string[]): string[] {
  const graph = readGraphFromLocalStorage()
  if (!graph) return []
  const facts = (graph as { coachMemory?: { facts?: Array<{ id: string; text: string }> } })
    .coachMemory?.facts ?? []
  return relevantSlugs
    .map(slug => facts.find(f => f.id === `fact-${slug}`)?.text)
    .filter((text): text is string => Boolean(text))
}

export function buildPersonalizedOpening(
  name: string,
  lang: string,
  persona: CoachPersonaConfig,
  t: TFn,
): string {
  const facts = readPersonalizedFacts(persona.relevantSlugs)
  if (facts.length > 0) {
    const data = facts.slice(0, 3).join('. ')
    return t(`${persona.id}.chat.opening_data`, { name, data })
  }
  return t(persona.openingKey, { name })
}
