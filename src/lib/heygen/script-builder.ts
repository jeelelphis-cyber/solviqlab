// ─────────────────────────────────────────────────────────────────────────────
// MiaScriptBuilder — converts UserGraph into Mia's video script.
//
// Structure: Opening (empathy) → Insight (accountability) → Hook (CTA today)
// No actionLine. Mia speaks in first person. CTA → 3 questions → plan today.
// Supports A/B variant tracking via variantIds for GA4.
// ─────────────────────────────────────────────────────────────────────────────

import type { UserGraph }   from '../graph/types'
import type { ScriptContext } from './script-variants/types'
import { selectVariants }   from './script-variants'

export interface MiaScript {
  readonly text:       string
  readonly wordCount:  number
  readonly estSeconds: number
  readonly variantIds: {
    readonly opening: string
    readonly insight: string
    readonly hook:    string
  }
}

export class MiaScriptBuilder {
  build(graph: UserGraph, name: string, lang = 'en', userId?: string): MiaScript {
    const context = this.buildContext(graph, name, lang)
    const selected = selectVariants(context, userId)

    const wordCount  = selected.text.split(/\s+/).length
    const estSeconds = Math.round(wordCount / 2.5)

    return {
      text:       selected.text,
      wordCount,
      estSeconds,
      variantIds: selected.variantIds,
    }
  }

  private buildContext(graph: UserGraph, name: string, lang: string): ScriptContext {
    const assessment = graph.assessments.items
      .find(a => a.clusterId === graph.journey.activeCluster)
      ?? graph.assessments.items[0]

    const score   = assessment?.score ?? null
    const cluster = graph.journey.activeCluster ?? 'weight'

    const bmiFact = graph.coachMemory.facts.find(f => f.id === 'bmi-result')
    const bmiText = bmiFact?.text ?? null

    const resolvedLang: 'en' | 'uk' = lang === 'uk' ? 'uk' : 'en'

    return { name, cluster, bmiText, score, lang: resolvedLang }
  }
}
