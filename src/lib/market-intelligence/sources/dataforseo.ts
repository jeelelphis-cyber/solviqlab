// ─────────────────────────────────────────────────────────────────────────────
// DataForSEO Sources — real implementations of DataSource.
//
// Two sources:
//   DataForSEOKeywordSource  — keyword ideas + volumes (cheapest endpoints)
//   DataForSEOSERPSource     — top-10 organic results per keyword
//
// Cost per research() call:
//   keywords: ~$0.003–0.01 per seed
//   SERP:     ~$0.003 per keyword
// For a single cluster test: ~$0.10–0.20 total
// ─────────────────────────────────────────────────────────────────────────────

import type { DataSource, KeywordSourceResult, CompetitorSourceResult } from './types'
import type { ResearchQuery, KeywordEntry, CompetitorInsight } from '../types'

const BASE_URL = 'https://api.dataforseo.com/v3'
const US_LOCATION = 2840

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function post<T>(apiKey: string, endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DataForSEO ${endpoint} → ${res.status}: ${text.slice(0, 120)}`)
  }
  return res.json() as Promise<T>
}

// ── DataForSEO raw types ──────────────────────────────────────────────────────

interface DFSKeywordItem {
  keyword: string
  search_volume?: number
  competition_index?: number  // 0-100
  cpc?: number
  keyword_info?: {
    search_volume?: number
    competition_index?: number
    cpc?: number
  }
}

interface DFSSERPItem {
  type: string
  rank_absolute?: number
  url?: string
  domain?: string
  title?: string
  description?: string
}

interface DFSTask<R> {
  result?: R[]
  status_code?: number
  status_message?: string
}

interface DFSResponse<R> {
  tasks?: DFSTask<{ items?: R[] }>[]
}

// ── Keyword Source ────────────────────────────────────────────────────────────

export class DataForSEOKeywordSource implements DataSource {
  readonly id         = 'dataforseo-keywords'
  readonly name       = 'DataForSEO Keyword Ideas'
  readonly resultType = 'keywords' as const

  constructor(private readonly apiKey: string) {}

  isAvailable(): boolean { return Boolean(this.apiKey) }

  async fetch(query: ResearchQuery): Promise<KeywordSourceResult> {
    const seed = query.problem

    // Endpoint: keyword ideas for seed — returns related keywords with metrics
    let rawItems: DFSKeywordItem[] = []
    try {
      const res = await post<DFSResponse<DFSKeywordItem>>(
        this.apiKey,
        '/dataforseo_labs/google/keyword_ideas/live',
        [{
          keywords:      [seed],
          location_code: US_LOCATION,
          language_code: 'en',
          limit:         100,
        }],
      )
      rawItems = res.tasks?.[0]?.result?.[0]?.items ?? []
    } catch (err) {
      console.warn(`[DataForSEO] keyword_ideas failed for "${seed}":`, (err as Error).message)
    }

    // Also fetch direct volume for the seed keyword itself
    try {
      // search_volume returns items directly in result[], not nested under items[]
      interface VolResponse { tasks?: Array<{ result?: DFSKeywordItem[] }> }
      const volRes = await post<VolResponse>(
        this.apiKey,
        '/keywords_data/google_ads/search_volume/live',
        [{
          keywords:      [seed],
          location_code: US_LOCATION,
          language_code: 'en',
        }],
      )
      const seedItems = volRes.tasks?.[0]?.result ?? []
      rawItems.unshift(...seedItems)
    } catch {
      // non-fatal
    }

    // Map to KeywordEntry
    const seen  = new Set<string>()
    const keywords: KeywordEntry[] = []
    const questions: string[] = []

    for (const item of rawItems) {
      const kw = item.keyword?.toLowerCase().trim()
      if (!kw || seen.has(kw)) continue
      seen.add(kw)

      const volume = item.keyword_info?.search_volume ?? item.search_volume ?? null
      const ci     = item.keyword_info?.competition_index ?? item.competition_index ?? null
      const cpc    = item.keyword_info?.cpc ?? item.cpc ?? null

      const entry: KeywordEntry = {
        keyword:    kw,
        volume,
        difficulty: ci,
        cpc,
        intent:     detectKeywordIntent(kw),
        source:     'dataforseo',
        hasSnippet: false,
      }

      if (/^(how|why|what|when|where|is|can|does|should|will|do)\b/.test(kw)) {
        questions.push(kw)
      } else {
        keywords.push(entry)
      }
    }

    const related = keywords
      .filter(k => !k.keyword.includes(seed))
      .slice(0, 20)
      .map(k => k.keyword)

    return {
      type:      'keywords',
      sourceId:  this.id,
      keywords,
      questions,
      related,
    }
  }
}

// ── SERP Source ────────────────────────────────────────────────────────────────

export class DataForSEOSERPSource implements DataSource {
  readonly id         = 'dataforseo-serp'
  readonly name       = 'DataForSEO SERP Analysis'
  readonly resultType = 'competitors' as const

  constructor(private readonly apiKey: string) {}

  isAvailable(): boolean { return Boolean(this.apiKey) }

  async fetch(query: ResearchQuery): Promise<CompetitorSourceResult> {
    const keyword = query.problem

    let items: DFSSERPItem[] = []
    let adCount = 0

    try {
      const res = await post<DFSResponse<DFSSERPItem>>(
        this.apiKey,
        '/serp/google/organic/live/regular',
        [{
          keyword:        keyword,
          location_code:  US_LOCATION,
          language_code:  'en',
          depth:          10,
        }],
      )
      items = res.tasks?.[0]?.result?.[0]?.items ?? []
    } catch (err) {
      console.warn(`[DataForSEO] SERP failed for "${keyword}":`, (err as Error).message)
    }

    const organic = items.filter(i => i.type === 'organic')
    const paid    = items.filter(i => i.type === 'paid')
    adCount = paid.length

    const competitors: CompetitorInsight[] = organic.slice(0, 10).map(item => {
      const url    = item.url    ?? ''
      const domain = item.domain ?? extractDomain(url)
      const title  = item.title  ?? ''
      const desc   = item.description ?? ''

      const content = `${title} ${desc}`.toLowerCase()

      const hasCalculator    = content.includes('calculator') || content.includes('calculate')
      const hasPersonalised  = content.includes('personal') || content.includes('your')
      const hasAI            = content.includes('ai') || content.includes('artificial') || content.includes('smart')
      const hasPlan          = content.includes('plan') || content.includes('schedule')

      const weaknesses: string[] = []
      const gaps: string[]       = []

      if (!hasCalculator)   { weaknesses.push('no interactive tool'); gaps.push('calculator') }
      if (!hasPersonalised) { weaknesses.push('generic advice');       gaps.push('personalised results') }
      if (!hasAI)           { weaknesses.push('no AI coach');          gaps.push('AI coaching') }
      if (!hasPlan)         { weaknesses.push('no follow-up plan');    gaps.push('recovery planner') }

      return {
        url,
        domain,
        title,
        position: item.rank_absolute ?? null,
        da:       null,
        strengths: ['established page', 'existing traffic'],
        weaknesses: weaknesses.length > 0 ? weaknesses : ['no obvious weakness'],
        gaps,
      }
    })

    const featuredSnippetExists = items.some(i =>
      i.type === 'featured_snippet' || i.type === 'answer_box'
    )

    return {
      type:                  'competitors',
      sourceId:              this.id,
      competitors,
      featuredSnippetExists,
      adCount,
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function detectKeywordIntent(kw: string): KeywordEntry['intent'] {
  if (kw.includes('buy') || kw.includes('price') || kw.includes('cost') || kw.includes('cheap')) return 'transactional'
  if (kw.includes('best') || kw.includes('top') || kw.includes('review'))                        return 'commercial'
  if (kw.includes('.com') || kw.match(/^[a-z]+ (site|app|tool|login)$/))                         return 'navigational'
  return 'informational'
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url.split('/')[2]?.replace('www.', '') ?? url }
}
