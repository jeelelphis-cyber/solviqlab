// ─────────────────────────────────────────────────────────────────────────────
// UniverseMapper — Stage 1: Build the full market landscape.
//
// INPUT:  market domain ("health")
// OUTPUT: ResearchUniverse — hierarchical map of verticals, topics, sub-topics
//
// This is the "what do we even research?" question.
// LLM draws the full map BEFORE any keyword tool is touched.
//
// Example:
//   health
//   ├── sleep
//   │   ├── sleep quality
//   │   ├── sleep debt
//   │   ├── insomnia
//   │   └── sleep cycles
//   ├── weight
//   │   ├── bmi
//   │   ├── body composition
//   │   └── calorie deficit
//   └── ...
// ─────────────────────────────────────────────────────────────────────────────

import type { ResearchLLM } from '../llm/research-llm'

export interface UniverseNode {
  id:         string      // e.g. "sleep-debt"
  name:       string      // e.g. "Sleep Debt"
  description: string    // 1 sentence
  priority:   'high' | 'medium' | 'low'
  children:   UniverseNode[]
}

export interface ResearchUniverse {
  domain:    string
  verticals: UniverseNode[]
  builtAt:   string
}

const SYSTEM_PROMPT = `You are a senior Market Intelligence analyst.
Your job is to map complete market landscapes for digital products.
You think in PROBLEMS, not keywords.
Always respond with valid JSON only — no prose, no markdown fences.`

export class UniverseMapper {
  constructor(private readonly llm: ResearchLLM) {}

  async map(domain: string, focus?: string): Promise<ResearchUniverse> {
    const focusClause = focus ? ` Focus particularly on the "${focus}" area.` : ''

    const userPrompt = `Map the complete problem universe for the "${domain}" market.${focusClause}

For each vertical and sub-topic, think: "What are real problems people face here that a digital product could solve?"

Return JSON in this exact structure:
{
  "verticals": [
    {
      "id": "sleep",
      "name": "Sleep",
      "description": "Problems with sleep quality, duration, and disorders",
      "priority": "high",
      "children": [
        {
          "id": "sleep-debt",
          "name": "Sleep Debt",
          "description": "Accumulated sleep deficit affecting daily performance",
          "priority": "high",
          "children": []
        }
      ]
    }
  ]
}

Rules:
- Include 5-6 verticals for the domain
- Each vertical has 3-5 children (sub-topics)
- Priority: "high" = large market + clear product opportunity, "medium" = solid, "low" = niche
- Focus on problems that could have: calculator, quiz, planner, or AI coach solution
- For health: include sleep, weight, fitness, nutrition, mental health, pregnancy, stress, digestion`

    const result = await this.llm.callJSON<{ verticals: UniverseNode[] }>(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt },
      ],
      { temperature: 0.2, maxTokens: 4000 },
    )

    return {
      domain,
      verticals: result.verticals ?? [],
      builtAt:   new Date().toISOString(),
    }
  }
}
