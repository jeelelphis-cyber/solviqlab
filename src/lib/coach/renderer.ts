import type { CoachRecommendation, CoachMessage } from './types'
import { getCoachCopy, interpolate } from './coach-copy'
import { getClusterLabel } from './coach-i18n'

export interface CoachRenderer {
  render(rec: CoachRecommendation, lang: string): CoachMessage | null
}

export class TextRenderer implements CoachRenderer {
  render(rec: CoachRecommendation, lang: string): CoachMessage | null {
    const copy     = getCoachCopy(lang)
    const template = copy[rec.template_id]
    if (!template) return null

    // Inject cluster_label from i18n — handlers never embed it
    const data: Record<string, unknown> = {
      ...rec.data,
      cluster_label: getClusterLabel(rec.cluster, lang),
    }

    return {
      message_id:    rec.recommendation_id,
      cluster:       rec.cluster,
      phase:         rec.phase,
      decision:      rec.decision,
      type:          rec.type,
      priority:      rec.priority,
      title:         interpolate(template.title, data),
      body:          interpolate(template.body, data),
      actions:       template.actions,
      generated_at:  rec.generated_at,
      data_snapshot: rec.data,
    }
  }
}

export const textRenderer = new TextRenderer()
