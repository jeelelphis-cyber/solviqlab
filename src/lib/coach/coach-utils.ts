import type { CoachPersonaConfig } from '@/lib/coach-personas/types'
import type { getT } from '@/lib/i18n/ui'
import { GraphRepository } from '@/lib/graph/repository'
import { createStorageProvider } from '@/lib/user/storage'

type TFn = ReturnType<typeof getT>

function getGraphRepo(): GraphRepository {
  return new GraphRepository(createStorageProvider())
}

export function readPersonalizedFacts(relevantSlugs: string[], userId: string | null): string[] {
  if (!userId || typeof window === 'undefined') return []
  try {
    const graph = getGraphRepo().get(userId)
    if (!graph) return []
    const facts = graph.coachMemory.facts
    return relevantSlugs
      .map(slug => facts.find(f => f.id === `fact-${slug}`)?.text)
      .filter((text): text is string => Boolean(text))
  } catch { return [] }
}

export function buildPersonalizedOpening(
  name: string,
  lang: string,
  persona: CoachPersonaConfig,
  t: TFn,
  userId: string | null = null,
): string {
  const facts = readPersonalizedFacts(persona.relevantSlugs, userId)
  if (facts.length > 0) {
    const data = facts.slice(0, 3).join('. ')
    return t(`${persona.id}.chat.opening_data`, { name, data })
  }
  return t(persona.openingKey, { name })
}
