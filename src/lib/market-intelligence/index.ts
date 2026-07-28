export type {
  ResearchQuery,
  ProductResearchPackage,
  ProblemSignal,
  ProductIntent,
  IntentType,
  KeywordEntry,
  KeywordCluster,
  CompetitorInsight,
  SERPAnalysis,
  SEOPotential,
  AICoachPotential,
  ProductRecommendation,
  PriorityScore,
  PriorityBreakdown,
  PriorityVerdict,
  TrendDirection,
} from './types'

export type { DataSource, SourceResult, KeywordSourceResult, CompetitorSourceResult, TrendSourceResult, CommunitySourceResult } from './sources/types'
export { DataSourceRegistry } from './sources/types'
export { MockKeywordSource, MockCompetitorSource, MockTrendSource, MockCommunitySource, UnavailableSource } from './sources/mock'
export { PriorityScorer }      from './scoring/priority-scorer'
export { ProductResearchPackageBuilder } from './package-builder'
export { MarketIntelligenceDepartment }  from './department'
