export interface CoachPersonaConfig {
  id: string
  name: string
  role: string
  avatarGradient: string
  avatarLetter: string
  accentColor: string           // Tailwind color name e.g. 'blue', 'rose'
  clusters: string[]            // which result clusters trigger this coach
  steps: Array<{
    questionKey: string
    contextKey: string
    yesKey: string
  }>
  openingKey: string
  systemPromptTemplate: (name: string, lang: string, graphContext: string) => string
  planSystemPromptTemplate: (name: string, lang: string, graphContext: string) => string
}
