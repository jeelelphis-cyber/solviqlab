// ─────────────────────────────────────────────────────────────────────────────
// GraphSummarizer — converts a UserGraph into a structured text block for LLM.
//
// The summary is injected into the system prompt so the model has full
// context about the user without relying only on conversation history.
// Kept concise to preserve context window budget.
// ─────────────────────────────────────────────────────────────────────────────

import type { UserGraph, GoalEntry, MemoryFact } from './types'

export class GraphSummarizer {
  summarize(graph: UserGraph, lang: string): string {
    if (lang === 'es') return this.summarizeES(graph)
    return this.summarizeEN(graph)
  }

  private summarizeEN(g: UserGraph): string {
    const lines: string[] = ['## User Graph']

    // Identity
    const tier = g.premium.tier !== 'free' ? g.premium.tier : 'Free'
    const namePart = g.identity.name ? ` | Name: ${g.identity.name}` : ''
    lines.push(`Identity: ${g.identity.userType === 'authenticated' ? 'Registered' : 'Anonymous'}${namePart} | ${tier} | ${g.identity.language.toUpperCase()}`)

    // Goals
    const activeGoals = g.goals.items.filter(gl => gl.status === 'active')
    if (activeGoals.length > 0) {
      lines.push(`Goals: ${activeGoals.map(g => this.goalText(g)).join(', ')}`)
    }

    // Habits
    const habits = g.habits.items
    if (habits.length > 0) {
      lines.push(`Habits: ${habits.map(h => `${h.name} (${h.frequency}, ${h.sentiment})`).join(', ')}`)
    }

    // Assessment
    const primaryAssessment = g.assessments.items.find(a => a.clusterId === g.journey.activeCluster)
      ?? g.assessments.items[0]
    if (primaryAssessment) {
      lines.push(`Assessment: ${primaryAssessment.clusterId}, Score ${primaryAssessment.score}/100 (${primaryAssessment.confidence})`)
    }

    // Journey
    if (g.journey.activeCluster) {
      const phase    = g.journey.currentPhase ? `, ${g.journey.currentPhase} phase` : ''
      const progress = g.journey.progress != null ? `, ${g.journey.progress}% complete` : ''
      lines.push(`Journey: ${g.journey.activeCluster}${phase}${progress}`)
    }

    // Coach Memory
    const highFacts = g.coachMemory.facts.filter(f => f.importance === 'high')
    if (highFacts.length > 0) {
      lines.push(`Coach Memory: ${highFacts.map(f => f.text).join('; ')}`)
    }
    if (g.coachMemory.communicationStyle) {
      lines.push(`Communication: ${g.coachMemory.communicationStyle} style preferred`)
    }

    // Retention
    if (g.retention.daysSinceActive > 0) {
      lines.push(`Engagement: ${g.retention.daysSinceActive} days since last active (${g.retention.dormancyLevel})`)
    } else {
      lines.push(`Engagement: Active`)
    }

    // Premium quota
    if (g.premium.tier === 'free') {
      lines.push(`Quota: ${g.premium.quotaUsedToday}/${g.premium.quotaLimit} daily messages used`)
    }

    return lines.join('\n')
  }

  private summarizeES(g: UserGraph): string {
    const lines: string[] = ['## Perfil del Usuario']

    const tier = g.premium.tier !== 'free' ? g.premium.tier : 'Gratuito'
    lines.push(`Identidad: ${g.identity.userType === 'authenticated' ? 'Registrado' : 'Anónimo'} | ${tier}`)

    const activeGoals = g.goals.items.filter(gl => gl.status === 'active')
    if (activeGoals.length > 0) {
      lines.push(`Objetivos: ${activeGoals.map(g => g.text).join(', ')}`)
    }

    if (g.journey.activeCluster) {
      lines.push(`Camino: ${g.journey.activeCluster}${g.journey.currentPhase ? `, fase ${g.journey.currentPhase}` : ''}`)
    }

    const primaryAssessment = g.assessments.items[0]
    if (primaryAssessment) {
      lines.push(`Evaluación: ${primaryAssessment.score}/100`)
    }

    return lines.join('\n')
  }

  private goalText(goal: GoalEntry): string {
    return goal.priority === 'high' ? `**${goal.text}**` : goal.text
  }

  estimateTokens(graph: UserGraph): number {
    return Math.ceil(this.summarizeEN(graph).length / 4)
  }
}
