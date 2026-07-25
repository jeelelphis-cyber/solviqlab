import type { ContextSource, PartialContext } from '../llm/context-source'
import type { GraphRepository } from './repository'
import { GraphSummarizer } from './summarizer'

export class GraphContextSource implements ContextSource {
  readonly key = 'graph'

  private readonly summarizer = new GraphSummarizer()

  constructor(
    private readonly repo:   GraphRepository,
    private readonly lang:   () => string,
    private readonly userId: () => string,
  ) {}

  contribute(): PartialContext {
    const id    = this.userId()
    const graph = id ? this.repo.get(id) : null
    if (!graph) return { graphSummary: null }

    return {
      graphSummary:         this.summarizer.summarize(graph, this.lang()),
      userId:               graph.userId,
      userType:             graph.identity.userType,
      subscription:         graph.premium.tier,
      activeCluster:        graph.journey.activeCluster,
      currentPhase:         graph.journey.currentPhase,
      journeyProgress:      graph.journey.progress,
      assessmentScore:      graph.assessments.items[0]?.score ?? null,
      assessmentConfidence: graph.assessments.items[0]?.confidence ?? null,
      primaryGoal:          graph.goals.items.find(g => g.status === 'active' && g.priority === 'high')?.text
                            ?? graph.goals.items.find(g => g.status === 'active')?.text
                            ?? null,
      daysSinceActive:      graph.retention.daysSinceActive,
      dormancyLevel:        graph.retention.dormancyLevel,
    }
  }
}
