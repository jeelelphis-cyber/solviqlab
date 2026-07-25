import type { LLMContext } from './types'

export function buildSystemPrompt(context: LLMContext, lang: string): string {
  if (lang === 'es') return buildSystemPromptES(context)
  return buildSystemPromptEN(context)
}

function buildSystemPromptEN(ctx: LLMContext): string {
  const lines: string[] = [
    'You are a personal AI coach for SolviqLab, a science-based health and wellness platform.',
    'Your role is to provide personalized, evidence-based guidance based on the user\'s real data.',
    '',
    '## Guidelines',
    '- Be encouraging, empathetic, and data-driven.',
    '- Reference the user\'s actual journey data when relevant.',
    '- Never provide specific medical diagnoses or prescribe treatments.',
    '- Keep responses concise (2-4 sentences unless the user asks for detail).',
    '- Ask one focused follow-up question at the end when appropriate.',
    '',
    '## User Context',
    `- Account type: ${ctx.userType === 'authenticated' ? 'Authenticated' : 'Anonymous'}`,
    `- Subscription: ${ctx.subscription}`,
  ]

  if (ctx.activeCluster) {
    lines.push(`- Active journey: ${ctx.activeCluster}`)
  }
  if (ctx.currentPhase) {
    lines.push(`- Current phase: ${ctx.currentPhase}`)
  }
  if (ctx.assessmentScore !== null) {
    lines.push(`- Assessment score: ${ctx.assessmentScore}/100 (${ctx.assessmentConfidence ?? 'measured'})`)
  }
  if (ctx.primaryGoal) {
    lines.push(`- Primary goal: ${ctx.primaryGoal}`)
  }
  if (ctx.journeyProgress !== null) {
    lines.push(`- Plan progress: ${ctx.journeyProgress}% through active plan`)
  }
  if (ctx.daysSinceActive > 0) {
    lines.push(`- Days since last active: ${ctx.daysSinceActive}`)
  }
  if (ctx.graphSummary) {
    lines.push('', ctx.graphSummary)
  }
  if (ctx.recentCoachMessages.length > 0) {
    lines.push('', '## Recent Coach Messages', ...ctx.recentCoachMessages.map(m => `- ${m}`))
  }

  return lines.join('\n')
}

function buildSystemPromptES(ctx: LLMContext): string {
  const lines: string[] = [
    'Eres un coach de IA personal para SolviqLab, una plataforma de bienestar y salud basada en ciencia.',
    'Tu función es proporcionar orientación personalizada y basada en evidencia según los datos reales del usuario.',
    '',
    '## Pautas',
    '- Sé alentador, empático y basado en datos.',
    '- Haz referencia a los datos reales del camino del usuario cuando sea relevante.',
    '- Nunca proporciones diagnósticos médicos específicos ni prescribas tratamientos.',
    '- Mantén las respuestas concisas (2-4 frases, a menos que el usuario pida más detalle).',
    '',
    '## Contexto del Usuario',
    `- Tipo de cuenta: ${ctx.userType === 'authenticated' ? 'Autenticado' : 'Anónimo'}`,
  ]

  if (ctx.activeCluster) lines.push(`- Camino activo: ${ctx.activeCluster}`)
  if (ctx.assessmentScore !== null) lines.push(`- Puntuación de evaluación: ${ctx.assessmentScore}/100`)
  if (ctx.primaryGoal) lines.push(`- Objetivo principal: ${ctx.primaryGoal}`)
  if (ctx.graphSummary) lines.push('', ctx.graphSummary)

  return lines.join('\n')
}
