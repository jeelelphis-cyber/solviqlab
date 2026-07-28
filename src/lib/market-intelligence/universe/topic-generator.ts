// ─────────────────────────────────────────────────────────────────────────────
// TopicGenerator — Stage 2: Expand one universe node into search seeds.
//
// INPUT:  UniverseNode (e.g. "Sleep Debt")
// OUTPUT: TopicExpansion — all search angles BEFORE touching DataForSEO
//
// Example for "Sleep Debt":
//   Problems:   "can't catch up on sleep", "always tired despite 8h sleep"
//   Calculators: "sleep debt calculator", "sleep hours needed calculator"
//   Quizzes:    "am I sleep deprived quiz", "sleep deprivation test"
//   Planners:   "sleep recovery schedule", "how to fix sleep debt"
//   Questions:  "how much sleep to recover", "does sleep debt accumulate"
//
// This list goes to DataForSEO as seeds — not a single word, but 30-50 angles.
// ─────────────────────────────────────────────────────────────────────────────

import type { ResearchLLM } from '../llm/research-llm'
import type { UniverseNode } from './universe-mapper'

export interface TopicExpansion {
  nodeId:        string
  nodeName:      string
  problems:      string[]   // exact phrases users type when frustrated
  calculators:   string[]   // "[topic] calculator" variations
  quizzes:       string[]   // "am I...?", "[topic] test/quiz"
  planners:      string[]   // "[topic] plan/schedule/routine"
  questions:     string[]   // "how to...", "why do I...", "what is..."
  symptoms:      string[]   // physical/emotional symptoms people search
  allSeeds:      string[]   // flat list for DataForSEO — the only output it needs
}

const SYSTEM_PROMPT = `You are a search behavior expert who understands exactly how real people search for health and wellness information.
You think in user psychology: what do they type when frustrated, confused, or seeking help?
Respond with valid JSON only.`

export class TopicGenerator {
  constructor(private readonly llm: ResearchLLM) {}

  async expand(node: UniverseNode, parentContext?: string): Promise<TopicExpansion> {
    const context = parentContext ? ` (within ${parentContext})` : ''

    const prompt = `Expand the topic "${node.name}"${context} into all search angles a real person might use.

Think about:
- What do people TYPE when they have this problem? (not what they should search — what they actually type)
- What tools would they want? (calculator, quiz, planner, tracker, test)
- What questions are they asking? (how to fix it, why it happens, what it means)
- What symptoms do they search? (feeling tired, can't focus, wake up exhausted)

Return JSON:
{
  "problems": ["exact frustrated phrases", "can't fall asleep no matter what", "always exhausted even after 8 hours"],
  "calculators": ["sleep debt calculator", "how many hours of sleep do I need calculator"],
  "quizzes": ["am I sleep deprived quiz", "sleep quality test", "do I have insomnia test"],
  "planners": ["sleep recovery plan", "how to fix sleep debt schedule", "sleep routine builder"],
  "questions": ["how to pay off sleep debt", "why am I always tired", "how long to recover from sleep deprivation"],
  "symptoms": ["brain fog", "can't concentrate tired", "falling asleep at desk"]
}

Rules:
- Each array: 5-10 items minimum
- Use REAL user language — informal, imperfect, emotional
- Include long-tail phrases (4-7 words) — these are the gold
- Include question-form searches
- Cover the full problem arc: awareness → understanding → solution → tool → results`

    const result = await this.llm.callJSON<Omit<TopicExpansion, 'nodeId' | 'nodeName' | 'allSeeds'>>(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
      { temperature: 0.4, maxTokens: 2000 },
    )

    const allSeeds = [
      ...result.problems,
      ...result.calculators,
      ...result.quizzes,
      ...result.planners,
      ...result.questions,
      ...result.symptoms,
    ].filter(Boolean)

    return {
      nodeId:      node.id,
      nodeName:    node.name,
      problems:    result.problems    ?? [],
      calculators: result.calculators ?? [],
      quizzes:     result.quizzes     ?? [],
      planners:    result.planners     ?? [],
      questions:   result.questions   ?? [],
      symptoms:    result.symptoms    ?? [],
      allSeeds,
    }
  }
}
