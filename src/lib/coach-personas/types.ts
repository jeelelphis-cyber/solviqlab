export interface CoachPersonaConfig {
  id: string
  name: string
  role: string
  avatarGradient: string
  avatarLetter: string
  accentColor: string
  photoUrl?: string                        // HeyGen or static photo
  shortBio: string                         // 1-2 sentences for gallery card
  personalityTags: string[]                // e.g. ["warm", "direct", "nurturing"]
  specialties: string[]                    // e.g. ["weight loss", "sleep", "stress"]
  communicationStyle: 'supportive' | 'motivating' | 'analytical' | 'nurturing'
  clusters: string[]
  relevantSlugs: string[]
  steps: Array<{
    questionKey: string
    contextKey: string
    yesKey: string
  }>
  openingKey: string
  systemPromptTemplate: (name: string, lang: string, graphContext: string, memory?: CoachMemory) => string
  planSystemPromptTemplate: (name: string, lang: string, graphContext: string) => string
}

export interface CoachMemory {
  daysSinceLastVisit: number | null
  previousTopics: string[]
  activePlan: string | null
  source: 'direct' | 'email_day3' | 'email_day7' | 'email_day30' | null
}
