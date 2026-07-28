// ─────────────────────────────────────────────────────────────────────────────
// ProblemDiscovery — Stage 3: Find the real human problems behind topics.
//
// INPUT:  TopicExpansion (what people search)
// OUTPUT: DiscoveredProblem[] — structured problems with emotional context
//
// The key question: what is the underlying problem people are really trying to solve?
// "sleep debt calculator" → user's real problem: "I feel exhausted and don't know how to fix it"
// "BMI calculator" → user's real problem: "I don't know if my weight is affecting my health"
//
// These problems become the CORE of the Mia coaching experience.
// ─────────────────────────────────────────────────────────────────────────────

import type { ResearchLLM } from '../llm/research-llm'
import type { TopicExpansion } from '../universe/topic-generator'

export interface DiscoveredProblem {
  id:            string
  headline:      string          // "Sleep Debt Recovery" — clean product name
  coreProblem:   string          // what the user actually feels: "I'm exhausted and can't function"
  trigger:       string          // what made them search today: "woke up tired for the 5th day in a row"
  desiredOutcome:string          // what they want: "to wake up energised and know exactly how to fix my sleep"
  currentSolution:string         // what they're doing now (and why it's failing)
  emotionalState: 'frustrated' | 'anxious' | 'curious' | 'motivated' | 'desperate'
  urgency:       'immediate' | 'ongoing' | 'planning'
  miaOpportunity:string          // how Mia specifically helps
  productTypes:  string[]        // ['calculator', 'planner', 'ai_coach']
  searchFormulations: string[]   // 3-5 exact phrases they'd search
}

const SYSTEM_PROMPT = `You are a behavioral psychologist and product strategist.
You understand WHY people search for things — the underlying emotion, problem, and desired outcome.
This insight drives product design: if you understand the real problem, you build the right product.
Respond with valid JSON only.`

export class ProblemDiscovery {
  constructor(private readonly llm: ResearchLLM) {}

  async discover(expansion: TopicExpansion): Promise<DiscoveredProblem[]> {
    const sampleSearches = [
      ...expansion.problems.slice(0, 5),
      ...expansion.symptoms.slice(0, 3),
      ...expansion.calculators.slice(0, 3),
    ].join('\n')

    const prompt = `People are searching for things related to "${expansion.nodeName}". Here are their actual searches:

${sampleSearches}

Identify 3-5 distinct underlying human problems these searches reveal.
For each problem, go deep: what is this person REALLY experiencing? What triggered their search today?
What outcome do they want? What would an AI coach specifically help them with?

Return JSON array:
[
  {
    "id": "sleep-debt-exhaustion",
    "headline": "Sleep Debt & Exhaustion",
    "coreProblem": "I've been chronically under-sleeping and now I feel like I can't function normally",
    "trigger": "Woke up exhausted again after 7 hours — something has to change",
    "desiredOutcome": "Wake up feeling rested and have a concrete plan to fix my sleep pattern",
    "currentSolution": "Going to bed earlier but it's not working — they don't understand the compounding effect",
    "emotionalState": "frustrated",
    "urgency": "immediate",
    "miaOpportunity": "Mia can calculate their actual sleep debt, build a personalised recovery schedule, and check in daily to keep them on track — turning a vague feeling into a concrete 2-week plan",
    "productTypes": ["calculator", "planner", "ai_coach"],
    "searchFormulations": ["sleep debt calculator", "how to fix sleep debt", "why am I always tired even after sleeping"]
  }
]`

    const problems = await this.llm.callJSON<DiscoveredProblem[]>(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
      { temperature: 0.3, maxTokens: 5000, maxRetries: 1 },
    )

    return Array.isArray(problems) ? problems : []
  }
}
