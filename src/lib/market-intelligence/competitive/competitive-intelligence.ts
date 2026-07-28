// ─────────────────────────────────────────────────────────────────────────────
// CompetitiveIntelligenceEngine — Stage 3.5 of Department 01
//
// Answers:
//   WHO is in TOP-10 and WHY?
//   WHERE are they weak?
//   WHAT do we need to build to beat them?
//   HOW LONG will it take?
//
// Flow:
//   SERP snapshot → Domain authority (DataForSEO) → LLM deep profiling
//   → LLM landscape synthesis → CompetitiveIntelligenceReport
// ─────────────────────────────────────────────────────────────────────────────

import type { ResearchLLM }    from '../llm/research-llm'
import type { CompetitorInsight } from '../types'
import type {
  DeepCompetitorProfile,
  DomainMetrics,
  CompetitiveIntelligenceReport,
  ContentType,
  ThreatLevel,
  LandscapeType,
  CIDecision,
} from './types'

const BASE_URL    = 'https://api.dataforseo.com/v3'
const US_LOCATION = 2840

// ── Domain authority fetcher ──────────────────────────────────────────────────

async function fetchDomainMetrics(
  apiKey:  string,
  domains: string[],
): Promise<Record<string, DomainMetrics>> {
  if (!apiKey || domains.length === 0) return {}

  try {
    const targets = [...new Set(domains)].slice(0, 10)
    const res = await fetch(`${BASE_URL}/dataforseo_labs/google/domain_rank_overview/live`, {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(targets.map(domain => ({
        target:        domain,
        location_code: US_LOCATION,
        language_code: 'en',
      }))),
    })

    if (!res.ok) return {}

    const data = await res.json() as {
      tasks?: Array<{
        result?: Array<{
          target:  string
          metrics?: {
            organic?: {
              count?: number
              etv?:   number
            }
          }
        }>
      }>
    }

    const result: Record<string, DomainMetrics> = {}
    for (const task of data.tasks ?? []) {
      for (const item of task.result ?? []) {
        const organicKW = item.metrics?.organic?.count ?? null
        const traffic   = item.metrics?.organic?.etv   ?? null

        // DR proxy: log scale normalised to 0-100
        let estimatedDR: number | null = null
        if (organicKW !== null) {
          estimatedDR = Math.min(100, Math.round(Math.log10(Math.max(1, organicKW)) * 16))
        }

        result[item.target] = {
          domain: item.target,
          organicKeywords: organicKW,
          estimatedDR,
          trafficEstimate: traffic,
        }
      }
    }
    return result
  } catch {
    return {}
  }
}

// ── LLM: deep profile each competitor ────────────────────────────────────────

const PROFILER_SYSTEM = `You are a senior competitive intelligence analyst.
You study competitors to find exactly where they are weak and how to beat them.
Be specific, not generic. Real analysis, not platitudes.
Respond with valid JSON only.`

async function profileCompetitors(
  llm:         ResearchLLM,
  topic:       string,
  competitors: CompetitorInsight[],
  metrics:     Record<string, DomainMetrics>,
): Promise<DeepCompetitorProfile[]> {
  const competitorList = competitors.slice(0, 10).map((c, i) => ({
    position:    i + 1,
    domain:      c.domain,
    url:         c.url,
    title:       c.title,
    description: c.title + ' ' + (c.strengths.join(' ')),
    organicKW:   metrics[c.domain]?.organicKeywords ?? null,
    estimatedDR: metrics[c.domain]?.estimatedDR    ?? null,
  }))

  const prompt = `Analyse these TOP-${competitorList.length} competitors for the topic "${topic}".

COMPETITORS:
${competitorList.map(c =>
  `[#${c.position}] ${c.domain} (DR≈${c.estimatedDR ?? '?'}, ~${c.organicKW?.toLocaleString() ?? '?'} KW)
  Title: ${c.title}
  URL: ${c.url}`
).join('\n\n')}

For EACH competitor return a deep profile. Be very specific about what they offer and where they fail users.

Return JSON array:
[
  {
    "domain": "example.com",
    "position": 1,
    "contentType": "calculator|article|tool|guide|quiz|mixed|ecommerce",
    "productFeatures": ["what feature 1 they have", "feature 2", "feature 3"],
    "userJourney": "User lands → enters data → sees result → (what happens next?)",
    "monetization": "how they make money: ads / affiliate / paid tool / SaaS",
    "uniqueAngle": "the one thing that makes them rank — their real differentiator",
    "weaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
    "gaps": ["user need not met 1", "user need not met 2"],
    "threatLevel": "fortress|high|medium|low",
    "threatReason": "one sentence why this threat level",
    "howToBeat": "specific: what exact product/feature combination beats this page"
  }
]

Rules:
- threatLevel 'fortress': DR > 60 AND deep content AND clear product
- threatLevel 'high': DR 35-60 OR strong product focus
- threatLevel 'medium': generic content, DR 15-35
- threatLevel 'low': thin content, DR < 15, or off-topic
- howToBeat must be SPECIFIC (not "build a better product" — say exactly what)
- gaps must be things users actually complain about (unmet needs, not features to add)`

  const profiles = await llm.callJSON<Array<{
    domain:          string
    position:        number
    contentType:     ContentType
    productFeatures: string[]
    userJourney:     string
    monetization:    string
    uniqueAngle:     string
    weaknesses:      string[]
    gaps:            string[]
    threatLevel:     ThreatLevel
    threatReason:    string
    howToBeat:       string
  }>>(
    [
      { role: 'system', content: PROFILER_SYSTEM },
      { role: 'user',   content: prompt },
    ],
    { temperature: 0.3, maxTokens: 6000, maxRetries: 1 },
  )

  return profiles.map((p, i) => {
    const original = competitors[p.position - 1] ?? competitors[i]
    const m = metrics[p.domain] ?? {}
    return {
      domain:           p.domain,
      url:              original?.url ?? '',
      position:         p.position,
      title:            original?.title ?? '',
      description:      original?.strengths?.join(', ') ?? '',
      estimatedDR:      m.estimatedDR    ?? null,
      organicKeywords:  m.organicKeywords ?? null,
      contentType:      p.contentType,
      productFeatures:  p.productFeatures ?? [],
      userJourney:      p.userJourney,
      monetization:     p.monetization,
      uniqueAngle:      p.uniqueAngle,
      weaknesses:       p.weaknesses ?? [],
      gaps:             p.gaps ?? [],
      threatLevel:      p.threatLevel,
      threatReason:     p.threatReason,
      howToBeat:        p.howToBeat,
    }
  })
}

// ── LLM: synthesise landscape ─────────────────────────────────────────────────

const SYNTHESIS_SYSTEM = `You are a Chief Strategy Officer analysing competitive landscapes.
You turn competitor data into actionable investment decisions.
Be direct. No hedging. Give exact numbers and specific actions.
Respond with valid JSON only.`

async function synthesiseLandscape(
  llm:         ResearchLLM,
  topic:       string,
  keyword:     string,
  profiles:    DeepCompetitorProfile[],
  featuredSnippetExists: boolean,
): Promise<Omit<CompetitiveIntelligenceReport, 'topic' | 'keyword' | 'analysedAt' | 'competitors' | 'avgEstimatedDR' | 'fortressCount' | 'weakCompetitorCount' | 'featuredSnippetExists'>> {

  const profileSummary = profiles.map(p =>
    `#${p.position} ${p.domain} (DR≈${p.estimatedDR ?? '?'}) [${p.threatLevel}]
  Features: ${p.productFeatures.slice(0, 3).join(', ')}
  Weakness: ${p.weaknesses.slice(0, 2).join('; ')}
  Gap: ${p.gaps.slice(0, 2).join('; ')}`
  ).join('\n\n')

  const prompt = `You've analysed the TOP-${profiles.length} competitors for "${topic}" (keyword: "${keyword}").

COMPETITOR SUMMARY:
${profileSummary}

Featured snippet exists: ${featuredSnippetExists}

Now synthesise the full competitive picture and investment decision.

Return JSON:
{
  "landscapeType": "fragmented|consolidated|mixed",
  "dominantContentType": "calculator|article|tool|guide|quiz|mixed|ecommerce",
  "winningFeatures": ["feature present in 3+ top pages", "another common feature"],
  "winningPattern": "the exact content/product pattern that dominates page 1",
  "marketGaps": ["specific gap 1 nobody fills", "specific gap 2", "specific gap 3"],
  "biggestGap": "the single most impactful unmet user need across all competitors",
  "winStrategy": "exactly what to build and which angle to take to reach TOP-3",
  "timeToTop3": {
    "optimistic": 8,
    "realistic": 14,
    "pessimistic": 24
  },
  "estimatedDRNeeded": 30,
  "executiveSummary": "3-4 sentences: what the landscape looks like, biggest opportunity, what to build, expected timeline",
  "decision": "enter_directly|find_gap|avoid",
  "decisionReason": "one clear sentence why this decision"
}

Decision rules:
- enter_directly: majority of competitors are medium/low threat, clear gap exists
- find_gap: 1-2 fortress competitors BUT clear gap where they're weak
- avoid: 3+ fortress competitors AND no clear gap AND DR needed > 60`

  return llm.callJSON<Omit<CompetitiveIntelligenceReport, 'topic' | 'keyword' | 'analysedAt' | 'competitors' | 'avgEstimatedDR' | 'fortressCount' | 'weakCompetitorCount' | 'featuredSnippetExists'>>(
    [
      { role: 'system', content: SYNTHESIS_SYSTEM },
      { role: 'user',   content: prompt },
    ],
    { temperature: 0.2, maxTokens: 3000, maxRetries: 1 },
  )
}

// ── Main engine ───────────────────────────────────────────────────────────────

export class CompetitiveIntelligenceEngine {
  constructor(
    private readonly llm:         ResearchLLM,
    private readonly dataforseoKey: string,
  ) {}

  async analyse(
    topic:       string,
    keyword:     string,
    competitors: CompetitorInsight[],
    featuredSnippetExists: boolean,
  ): Promise<CompetitiveIntelligenceReport> {
    if (competitors.length === 0) {
      return this.emptyReport(topic, keyword)
    }

    // Fetch domain authority for all competitors
    const domains  = [...new Set(competitors.map(c => c.domain))]
    const metrics  = await fetchDomainMetrics(this.dataforseoKey, domains)

    // Deep profile each competitor
    const profiles = await profileCompetitors(this.llm, topic, competitors, metrics)

    // Synthesise landscape
    const synthesis = await synthesiseLandscape(this.llm, topic, keyword, profiles, featuredSnippetExists)

    // Compute aggregate stats
    const DRs = profiles.map(p => p.estimatedDR).filter((d): d is number => d !== null)
    const avgEstimatedDR    = DRs.length > 0 ? Math.round(DRs.reduce((a, b) => a + b, 0) / DRs.length) : 0
    const fortressCount     = profiles.filter(p => p.threatLevel === 'fortress').length
    const weakCompetitorCount = profiles.filter(p => p.threatLevel === 'low').length

    return {
      topic,
      keyword,
      analysedAt: new Date().toISOString(),
      competitors: profiles,
      landscapeType:         synthesis.landscapeType         ?? 'mixed',
      dominantContentType:   synthesis.dominantContentType   ?? 'article',
      avgEstimatedDR,
      fortressCount,
      weakCompetitorCount,
      featuredSnippetExists,
      winningFeatures:       synthesis.winningFeatures       ?? [],
      winningPattern:        synthesis.winningPattern        ?? '',
      marketGaps:            synthesis.marketGaps            ?? [],
      biggestGap:            synthesis.biggestGap            ?? '',
      winStrategy:           synthesis.winStrategy           ?? '',
      timeToTop3:            synthesis.timeToTop3            ?? { optimistic: 12, realistic: 18, pessimistic: 24 },
      estimatedDRNeeded:     synthesis.estimatedDRNeeded     ?? 30,
      executiveSummary:      synthesis.executiveSummary      ?? '',
      decision:              synthesis.decision              ?? 'find_gap',
      decisionReason:        synthesis.decisionReason        ?? '',
    }
  }

  private emptyReport(topic: string, keyword: string): CompetitiveIntelligenceReport {
    return {
      topic, keyword,
      analysedAt:            new Date().toISOString(),
      competitors:           [],
      landscapeType:         'fragmented',
      dominantContentType:   'article',
      avgEstimatedDR:        0,
      fortressCount:         0,
      weakCompetitorCount:   0,
      featuredSnippetExists: false,
      winningFeatures:       [],
      winningPattern:        'No competitors found — likely a blue ocean opportunity',
      marketGaps:            ['entire market is unserved'],
      biggestGap:            'No existing solution found',
      winStrategy:           'First-mover advantage — build the best solution immediately',
      timeToTop3:            { optimistic: 3, realistic: 6, pessimistic: 12 },
      estimatedDRNeeded:     10,
      executiveSummary:      'No competitors found for this keyword. Potential blue ocean opportunity.',
      decision:              'enter_directly',
      decisionReason:        'No competition detected',
    }
  }
}
