// ─────────────────────────────────────────────────────────────────────────────
// GapFinder — Stage 5: Find what the market is missing.
//
// INPUT:  DiscoveredProblems + competitor data (from SERP validation)
// OUTPUT: MarketGap[] — specific opportunities competitors are not addressing
//
// The question: people are asking X, but nobody is giving them Y.
// "sleep recovery planner" → everyone has calculators, NOBODY has a day-by-day plan.
// "BMI emotional context" → calculators give a number, nobody explains what it means for THEIR life.
//
// Gaps = Product Ideas no one has built yet (or built poorly).
// This is where SolviqLAB wins.
// ─────────────────────────────────────────────────────────────────────────────

import type { ResearchLLM } from '../llm/research-llm'
import type { DiscoveredProblem } from './problem-discovery'
import type { CompetitorInsight } from '../types'

export interface MarketGap {
  id:           string
  title:        string          // "Personalised Sleep Recovery Planner"
  gap:          string          // what's missing: "calculators exist but no follow-up plan"
  evidence:     string          // why we know this: "people search 'how to fix sleep debt' but get generic articles"
  competitorFail: string        // what competitors do wrong
  ourAdvantage: string          // specifically what SolviqLAB + Mia can do better
  productIdea:  string          // concrete product recommendation
  aiPotential:  number          // 0-100 — how much Mia amplifies this gap solution
  priority:     'P0' | 'P1' | 'P2'  // P0 = build immediately
}

const SYSTEM_PROMPT = `You are a product strategist who finds market gaps — specific user needs that existing products fail to address.
You think about what's MISSING, not what exists.
You look for opportunities where AI coaching specifically creates unfair advantage.
Respond with valid JSON only.`

export class GapFinder {
  constructor(private readonly llm: ResearchLLM) {}

  async findGaps(
    problems:    DiscoveredProblem[],
    competitors: CompetitorInsight[],
    topicName:   string,
  ): Promise<MarketGap[]> {

    const problemSummary = problems.map(p =>
      `- ${p.headline}: "${p.coreProblem}" → wants: "${p.desiredOutcome}"`
    ).join('\n')

    const competitorSummary = competitors.slice(0, 5).map(c =>
      `- ${c.domain}: weaknesses: ${c.weaknesses.join(', ')} | gaps: ${c.gaps.join(', ')}`
    ).join('\n')

    const prompt = `We're analyzing the "${topicName}" market.

WHAT USERS ACTUALLY WANT:
${problemSummary}

WHAT COMPETITORS CURRENTLY OFFER (and their failures):
${competitorSummary.length > 0 ? competitorSummary : '(competitors not yet analyzed — use your knowledge of typical health/wellness websites)'}

Find 3-5 specific market gaps — places where user needs are NOT being met by current solutions.
For each gap, explain specifically how an AI coaching platform (like ours, with "Mia" as AI coach) could fill it better than anyone else.

Return JSON array:
[
  {
    "id": "sleep-recovery-planner-gap",
    "title": "Day-by-Day Sleep Recovery Planner",
    "gap": "Everyone provides a calculator that says 'you have X hours of sleep debt'. Nobody provides an actionable recovery plan.",
    "evidence": "Users search 'how to fix sleep debt' and 'sleep debt recovery plan' but find only generic articles — no personalised tool",
    "competitorFail": "Sleep calculators stop at the number. No competitor connects the result to a daily action plan.",
    "ourAdvantage": "Mia takes the calculated debt, builds a personalised 2-week recovery schedule, adjusts it based on user lifestyle, and checks in daily — turning a number into a completed journey",
    "productIdea": "Sleep Debt Calculator → auto-generates personalised recovery planner → Mia daily check-ins",
    "aiPotential": 95,
    "priority": "P0"
  }
]`

    const gaps = await this.llm.callJSON<MarketGap[]>(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
      { temperature: 0.4, maxTokens: 5000, maxRetries: 1 },
    )

    if (!Array.isArray(gaps)) return []

    // Normalize LLM priority (could return 'p0', 'P0', 'HIGH', etc.)
    const normalized = gaps.map(g => ({
      ...g,
      priority: (['P0', 'P1', 'P2'].includes(String(g.priority).toUpperCase())
        ? String(g.priority).toUpperCase()
        : 'P2') as 'P0' | 'P1' | 'P2',
      aiPotential: Math.min(100, Math.max(0, Number(g.aiPotential) || 50)),
    }))

    const order = { P0: 0, P1: 1, P2: 2 }
    return normalized.sort((a, b) => order[a.priority] - order[b.priority])
  }
}
