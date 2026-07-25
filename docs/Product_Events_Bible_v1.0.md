# Product Events Bible v1.0
## SolviqLab Coach Platform — Mia

**Document type:** Product Specification  
**Version:** 1.0  
**Date:** 2026-07-25  
**Status:** Foundational — complete event vocabulary for the Coach Platform  
**Author:** Product Architecture  
**Companion documents:** Product_State_Machine_v1.0.md, UserGraph_Ownership_Matrix_v1.0.md

---

## Purpose

This document is the authoritative dictionary of every event in the SolviqLab Coach Platform. It extends the existing `EventBus` (`src/lib/events/bus.ts`) and its `ResultEvent` / `PlatformEvent` types (`src/lib/events/types.ts`) with the full product-level vocabulary.

**Two levels of events exist in this system:**

1. **Instrument Events** (`solviqlab:result`) — emitted by calculators, assessed by the P10→P80 pipeline. Defined in `src/lib/events/types.ts`. Single event type, identified by `slug`.

2. **Platform Events** (`platform:*`) — emitted by pipeline handlers after processing. Defined in `src/lib/events/types.ts`. Listened to by UI components.

3. **Product Events** (`coach:*`, `daily:*`, `user:*`, `plan:*`) — defined in this document. The full vocabulary above the existing infrastructure. These are the semantic events that represent user behavior and system decisions.

**Rule:** Every event in this document has exactly one producer. Consumers are listed, not authoritative — new consumers can register without modifying this document.

---

## Event Categories

| Category | Prefix | Description |
|----------|--------|-------------|
| `user_action` | `user:` | User did something intentionally |
| `system` | `platform:`, `daily:` | System detected a condition |
| `coach` | `coach:` | Coach brain made a decision |
| `analytics` | (all emit to GA4) | Tracked in analytics |

---

## CALCULATOR EVENTS

---

## Event: calculator_completed

**Category:** user_action  
**Description:** A user submitted a calculator and received a valid result. This is the entry point for all personalization.

### Producer
- Component/Engine: Any calculator component (`/apps/web/src/app/[lang]/calculators/[slug]/`)
- Trigger: User clicks "Calculate" and the engine returns a non-null value

### Consumers
| Consumer | What it does |
|----------|-------------|
| `EventBus` (P10 UserEngine) | Initializes `UserGraph` if not exists, writes `userId` |
| `EventBus` (P20 ProfileEngine) | Updates `assessments` node with preliminary score |
| `EventBus` (P40 RecommendationEngine) | Selects next recommended calculator |
| `EventBus` (P80 AnalyticsEngine) | Sends to GA4 |
| `CoachBrain` | Extracts `miaFact` from `ResultEvent.miaFact` if present |

### Payload
```typescript
interface CalculatorCompletedPayload {
  type: 'solviqlab:result'
  eventId: string          // UUID — idempotency key
  slug: string             // e.g. 'bmi-calculator'
  name: string             // e.g. 'BMI Calculator'
  value: number | null     // primary numeric result
  label: string | null     // e.g. 'Overweight'
  category: string | null  // e.g. 'overweight'
  unit: string | null      // e.g. 'kg/m²'
  miaFact?: string | null  // e.g. 'BMI 27.3 — Overweight'
  metadata: Record<string, unknown>
  timestamp: number
  sessionId?: string
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= ['calculator_{slug}_completed']` |
| `assessments.items` | Preliminary entry for cluster |
| `coachMemory.facts` | `+= miaFact` (if present) |

### Analytics (GA4)
- Event name: `calculator_completed`
- Parameters: `{ calculator_slug, result_value, result_label, result_category, session_id }`

### Side effects
- JourneyExperience component re-renders with updated recommendations
- If this is user's first calculator: `anonymous_visitor` → `calculator_user` state transition

---

## Event: mia_fact_stored

**Category:** system  
**Description:** A `miaFact` string from a `ResultEvent` has been extracted and written to `coachMemory.facts`. Signals that Mia's context has been enriched.

### Producer
- Component/Engine: `CoachBrain` (`src/lib/coach/brain/`)
- Trigger: `ResultEvent.miaFact` is non-null after pipeline execution

### Consumers
| Consumer | What it does |
|----------|-------------|
| `CoachBrain` | Uses updated facts in next recommendation cycle |
| `AnalyticsEngine` | Tracks fact count (quality signal) |

### Payload
```typescript
interface MiaFactStoredPayload {
  userId: string
  factId: string        // UUID of the new MemoryFact
  factText: string      // e.g. 'BMI 27.3 — Overweight'
  category: 'fact'
  importance: 'high' | 'medium' | 'low'
  sourceSlug: string    // which calculator produced it
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `coachMemory.facts` | New `MemoryFact` entry |
| `coachMemory.updatedAt` | ISO timestamp |

### Analytics (GA4)
- Event name: `mia_fact_stored`
- Parameters: `{ source_slug, importance, fact_count_total }`

### Side effects
- Triggers `CoachBrain` re-evaluation for updated recommendations

---

## ASSESSMENT EVENTS

---

## Event: assessment_started

**Category:** user_action  
**Description:** The user began a formal assessment flow (weight, sleep, or stress cluster assessment). Distinct from calculator use — assessment is intentional and structured.

### Producer
- Component/Engine: Assessment component / JourneyEngine
- Trigger: User clicks "Start Assessment" CTA after seeing assessment unlock prompt

### Consumers
| Consumer | What it does |
|----------|-------------|
| `JourneyEngine` | Writes `journey.currentPhase = 'assessment'` |
| `AnalyticsEngine` | Tracks funnel entry |

### Payload
```typescript
interface AssessmentStartedPayload {
  userId: string
  clusterId: string      // e.g. 'weight_loss', 'sleep_quality'
  triggerReason: 'threshold_met' | 'instruments_complete' | 'user_requested'
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.currentPhase` | `'assessment'` |
| `journey.completedSteps` | `+= ['assessment_{clusterId}_started']` |

### Analytics (GA4)
- Event name: `assessment_started`
- Parameters: `{ cluster_id, trigger_reason }`

### Side effects
- Assessment UI renders, calculator session pauses

---

## Event: assessment_completed

**Category:** system  
**Description:** The user has answered all required assessment questions and the system has computed a cluster score. This is `platform:assessment_completed` in the existing EventBus.

### Producer
- Component/Engine: `AssessmentEngine` via EventBus (already implemented)
- Trigger: All required instruments completed AND threshold met

### Consumers
| Consumer | What it does |
|----------|-------------|
| `CoachBrain` | Reads score, generates first recommendation |
| `DecisionEngine` | Evaluates decision rules against new score |
| `ProfileEngine` | Recalculates domain confidence |
| `AnalyticsEngine` | Tracks assessment completion rate |

### Payload
```typescript
interface AssessmentCompletedPayload {  // maps to platform:assessment_completed
  type: 'platform:assessment_completed'
  eventId: string
  userId: string
  cluster: IntentCluster
  score: number               // 0–100
  confidence: 'preliminary' | 'established' | 'confirmed'
  phase: 'awareness' | 'planning' | 'action' | 'maintenance'
  graphUpdatedFields: readonly string[]
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `assessments.items` | New entry: `{clusterId, score, confidence: 'established', assessedAt}` |
| `journey.currentPhase` | `'planning'` |

### Analytics (GA4)
- Event name: `assessment_completed`
- Parameters: `{ cluster_id, score, confidence, phase }`

### Side effects
- State transition: `calculator_user` → `assessment_completed`
- "Meet Mia" CTA becomes available

---

## Event: assessment_score_computed

**Category:** system  
**Description:** The scoring algorithm produced a numerical result for a cluster. Fired synchronously after `assessment_completed` — carries the computed value.

### Producer
- Component/Engine: `ProfileEngine` / `AssessmentEngine`
- Trigger: After `platform:assessment_completed` is processed

### Consumers
| Consumer | What it does |
|----------|-------------|
| `RecommendationEngine` | Adjusts next calculator recommendations |
| `CoachBrain` | Reads score to select appropriate coaching strategy |

### Payload
```typescript
interface AssessmentScoreComputedPayload {
  userId: string
  clusterId: string
  score: number
  previousScore: number | null
  scoreDelta: number | null
  confidence: 'preliminary' | 'established' | 'confirmed'
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `assessments.items[n].score` | Computed score |
| `assessments.items[n].confidence` | Updated confidence level |

### Analytics (GA4)
- Event name: `assessment_score_computed`
- Parameters: `{ cluster_id, score, confidence, score_delta }`

### Side effects
- ProfileRecalculated event follows

---

## MIA / VIDEO EVENTS

---

## Event: mia_intro_viewed

**Category:** user_action  
**Description:** The user saw the Mia introduction card (JourneyExperience component) that appears after a calculator result. Not yet a click — just the impression.

### Producer
- Component/Engine: `JourneyExperience` component
- Trigger: Component mounts and becomes visible in viewport (IntersectionObserver)

### Consumers
| Consumer | What it does |
|----------|-------------|
| `AnalyticsEngine` | Tracks impression-to-click rate |

### Payload
```typescript
interface MiaIntroViewedPayload {
  userId: string
  calculatorSlug: string
  assessmentScore: number | null
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= ['mia_intro_viewed']` |

### Analytics (GA4)
- Event name: `mia_intro_viewed`
- Parameters: `{ calculator_slug, has_assessment_score, user_type }`

### Side effects
- None; impression only

---

## Event: mia_onboarding_started

**Category:** user_action  
**Description:** The user clicked "Meet Mia" — they have expressed intent to engage with the coaching layer. HeyGen video generation is initiated.

### Producer
- Component/Engine: `JourneyExperience` component / CTA handler
- Trigger: "Meet Mia" button click

### Consumers
| Consumer | What it does |
|----------|-------------|
| `HeyGenService` | Initiates video generation |
| `ScriptBuilder` | Assembles personalized script from UserGraph |
| `JourneyEngine` | Writes `video_requested` to `completedSteps` |
| `AnalyticsEngine` | Tracks CTA conversion |

### Payload
```typescript
interface MiaOnboardingStartedPayload {
  userId: string
  triggeredFrom: string    // which page / component
  assessmentScore: number | null
  factCount: number        // how many miaFacts are available
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= ['mia_onboarding_started']` |

### Analytics (GA4)
- Event name: `mia_onboarding_started`
- Parameters: `{ triggered_from, has_assessment, fact_count }`

### Side effects
- User sees "Mia is preparing your message..." waiting screen
- Name input may appear (if `identity.name` is null)

---

## Event: mia_onboarding_completed

**Category:** system  
**Description:** The full Mia onboarding sequence (intro → video → quiz) has been completed. User is ready to receive their first plan.

### Producer
- Component/Engine: `JourneyEngine`
- Trigger: `coach_quiz_completed` fires and all onboarding steps are in `completedSteps`

### Consumers
| Consumer | What it does |
|----------|-------------|
| `CoachPlannerImpl` | Triggers first plan generation |
| `SchedulerEngine` | Sets up morning/evening schedule |
| `AnalyticsEngine` | Marks funnel completion |

### Payload
```typescript
interface MiaOnboardingCompletedPayload {
  userId: string
  onboardingDurationMs: number    // total time from start to completion
  quizAnswersCount: number
  videoWatched: boolean
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= ['mia_onboarding_completed']` |
| `journey.currentPhase` | `'active_coaching'` |

### Analytics (GA4)
- Event name: `mia_onboarding_completed`
- Parameters: `{ duration_ms, quiz_answers_count, video_watched }`

### Side effects
- State transition: `coach_quiz_completed` → `today_plan_delivered`
- Registration CTA prepared

---

## Event: mia_video_requested

**Category:** user_action  
**Description:** The system has initiated a HeyGen API call to generate the user's personalized video. Maps to `video_requested` product state.

### Producer
- Component/Engine: `HeyGenService` (`src/lib/heygen/service.ts`)
- Trigger: `HeyGenService.generate()` called after script assembly

### Consumers
| Consumer | What it does |
|----------|-------------|
| `JourneyEngine` | Updates state to `video_requested` |
| `AnalyticsEngine` | Tracks generation initiation rate |

### Payload
```typescript
interface MiaVideoRequestedPayload {
  userId: string
  avatarId: string         // MIA_AVATAR_ID
  voiceId: string          // MIA_VOICE_ID
  scriptLength: number     // character count
  factCount: number        // miaFacts used in script
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= ['mia_video_requested']` |

### Analytics (GA4)
- Event name: `mia_video_requested`
- Parameters: `{ script_length, fact_count, avatar_id }`

### Side effects
- Polling begins for `HeyGenStatusResponse.status`

---

## Event: mia_video_generated

**Category:** system  
**Description:** HeyGen completed video processing. `videoUrl` is available and the player is ready to initialize.

### Producer
- Component/Engine: `HeyGenService` polling loop
- Trigger: `HeyGenStatusResponse.status === 'completed'` AND `videoUrl` is non-null

### Consumers
| Consumer | What it does |
|----------|-------------|
| `VideoPlayer` | Loads `videoUrl` and prepares player |
| `JourneyEngine` | Updates state to `video_generated` |
| `AnalyticsEngine` | Tracks generation success rate and duration |

### Payload
```typescript
interface MiaVideoGeneratedPayload {
  userId: string
  videoId: string
  videoUrl: string
  generationDurationMs: number   // from request to completion
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= ['mia_video_generated']` |

### Analytics (GA4)
- Event name: `mia_video_generated`
- Parameters: `{ video_id, generation_duration_ms }`

### Side effects
- Waiting screen replaced by video player
- Player auto-starts

---

## Event: mia_video_watched

**Category:** user_action  
**Description:** The user watched at least 80% of Mia's personalized video. The coaching relationship has been initiated.

### Producer
- Component/Engine: Video player component (`onTimeUpdate` handler)
- Trigger: `currentTime / duration >= 0.80`

### Consumers
| Consumer | What it does |
|----------|-------------|
| `JourneyEngine` | Updates state to `video_watched` |
| `CoachBrain` | Marks video phase as complete, prepares quiz prompt |
| `SchedulerEngine` | Logs today's video as watched |
| `AnalyticsEngine` | Tracks completion rate and watch duration |

### Payload
```typescript
interface MiaVideoWatchedPayload {
  userId: string
  videoId: string
  watchedPercent: number       // 0.80–1.00
  watchDurationSeconds: number
  isFirstWatch: boolean
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `dailyHistory.entries[today].morningVideoWatched` | `true` |
| `dailyHistory.entries[today].videoWatchDuration` | seconds watched |
| `journey.completedSteps` | `+= ['mia_video_watched']` |

### Analytics (GA4)
- Event name: `mia_video_watched`
- Parameters: `{ video_id, watch_percent, duration_seconds, is_first_watch }`

### Side effects
- Coach Quiz CTA appears immediately (slide-in animation)
- State transition: `video_generated` → `video_watched`

---

## Event: mia_video_rewatched

**Category:** user_action  
**Description:** User clicked replay on a video they had already watched ≥80% previously. Signals high engagement or confusion.

### Producer
- Component/Engine: Video player component (replay button)
- Trigger: User clicks replay AND `journey.completedSteps` already contains `'mia_video_watched'`

### Consumers
| Consumer | What it does |
|----------|-------------|
| `AnalyticsEngine` | Tracks rewatch rate as engagement quality signal |
| `CoachBrain` | Notes high engagement; factors into communication style inference |

### Payload
```typescript
interface MiaVideoRewatchedPayload {
  userId: string
  videoId: string
  rewatchCount: number
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `coachMemory.facts` | `+= 'User rewatched Mia intro video'` (if count > 1) |

### Analytics (GA4)
- Event name: `mia_video_rewatched`
- Parameters: `{ video_id, rewatch_count }`

### Side effects
- None; quiz CTA remains visible during rewatch

---

## COACH QUIZ EVENTS

---

## Event: coach_quiz_started

**Category:** user_action  
**Description:** The Coach Quiz became visible and the user saw the first question. Onboarding funnel active.

### Producer
- Component/Engine: Coach Quiz component
- Trigger: Component mounts after `video_watched` state, user clicks "Start Quiz"

### Consumers
| Consumer | What it does |
|----------|-------------|
| `JourneyEngine` | Writes `coach_quiz_started` to `completedSteps` |
| `AnalyticsEngine` | Tracks quiz start rate vs. video watch rate |

### Payload
```typescript
interface CoachQuizStartedPayload {
  userId: string
  quizVersion: string       // A/B test version identifier
  questionCount: number
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= ['coach_quiz_started']` |

### Analytics (GA4)
- Event name: `coach_quiz_started`
- Parameters: `{ quiz_version, question_count }`

### Side effects
- Quiz UI enters first question

---

## Event: coach_quiz_question_answered

**Category:** user_action  
**Description:** User answered one question in the Coach Quiz. Fires for each individual answer.

### Producer
- Component/Engine: Coach Quiz component (individual question handler)
- Trigger: User selects an answer and clicks "Next" or answer is auto-advancing

### Consumers
| Consumer | What it does |
|----------|-------------|
| `CoachBrain` | Accumulates answer data for plan generation |
| `AnalyticsEngine` | Tracks per-question completion rate (identifies drop-off questions) |

### Payload
```typescript
interface CoachQuizQuestionAnsweredPayload {
  userId: string
  questionId: string
  questionIndex: number       // 0-based
  totalQuestions: number
  answerValue: string | string[]
  timeToAnswerMs: number
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| (Buffered until quiz_completed — not written per-question) | — |

### Analytics (GA4)
- Event name: `coach_quiz_question_answered`
- Parameters: `{ question_id, question_index, time_to_answer_ms }`

### Side effects
- None until quiz completion

---

## Event: coach_quiz_completed

**Category:** user_action  
**Description:** The user answered all quiz questions. Data is committed to UserGraph and plan generation begins.

### Producer
- Component/Engine: Coach Quiz component (submit handler)
- Trigger: Last question answered AND user confirms submission

### Consumers
| Consumer | What it does |
|----------|-------------|
| `CoachBrain` | Processes all answers, writes goals/habits/style to UserGraph |
| `CoachPlannerImpl` | Triggers first plan generation |
| `JourneyEngine` | Updates `completedSteps`, triggers `today_plan_generated` |
| `AnalyticsEngine` | Tracks quiz completion rate |

### Payload
```typescript
interface CoachQuizCompletedPayload {
  userId: string
  quizVersion: string
  answers: readonly { questionId: string; answerValue: string | string[] }[]
  totalDurationMs: number
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `goals.items` | Goals extracted from quiz answers |
| `habits.items` | Habits identified from answers |
| `coachMemory.communicationStyle` | Inferred from answer patterns |
| `identity.name` | If name question was included |
| `journey.completedSteps` | `+= ['coach_quiz_completed']` |

### Analytics (GA4)
- Event name: `coach_quiz_completed`
- Parameters: `{ quiz_version, duration_ms, goals_count, habits_count }`

### Side effects
- State transition: `coach_quiz_started` → `coach_quiz_completed`
- "Mia is building your plan..." loading state appears

---

## PLAN EVENTS

---

## Event: today_plan_generated

**Category:** system  
**Description:** `CoachPlannerImpl` has produced the user's first (or daily) coaching plan. Plan is ready to be displayed.

### Producer
- Component/Engine: `CoachPlannerImpl` (`src/lib/coach/planner/coach-planner.ts`)
- Trigger: Quiz completion (first plan) or SchedulerEngine daily morning trigger

### Consumers
| Consumer | What it does |
|----------|-------------|
| `JourneyEngine` | Updates `journey.progress`, writes `today_plan_generated` step |
| `DailyHistoryEngine` | Writes `tasksAssigned` to today's entry |
| `AnalyticsEngine` | Tracks plan generation success rate |

### Payload
```typescript
interface TodayPlanGeneratedPayload {
  userId: string
  planId: string
  taskCount: number
  clusterIds: string[]
  isFirstPlan: boolean
  planDate: string         // 'YYYY-MM-DD'
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `dailyHistory.entries[today].tasksAssigned` | Task IDs |
| `journey.progress` | Updated progress percentage |
| `journey.completedSteps` | `+= ['today_plan_generated']` |

### Analytics (GA4)
- Event name: `today_plan_generated`
- Parameters: `{ plan_id, task_count, is_first_plan, cluster_ids }`

### Side effects
- Today's plan UI renders
- Registration CTA prepared

---

## Event: today_plan_viewed

**Category:** user_action  
**Description:** User saw today's plan. The plan was rendered and visible. Distinct from `today_plan_generated` — the plan could be generated but not viewed (e.g. browser closed).

### Producer
- Component/Engine: Today's Plan component
- Trigger: Component mounts and is visible in viewport

### Consumers
| Consumer | What it does |
|----------|-------------|
| `AnalyticsEngine` | Tracks view rate |
| `RetentionEngine` | Marks today as active if plan is viewed |

### Payload
```typescript
interface TodayPlanViewedPayload {
  userId: string
  planId: string
  taskCount: number
  isFirstView: boolean
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `retention.daysSinceActive` | `0` |

### Analytics (GA4)
- Event name: `today_plan_viewed`
- Parameters: `{ plan_id, task_count, is_first_view }`

### Side effects
- State transition to `today_plan_delivered`

---

## Event: today_plan_task_completed

**Category:** user_action  
**Description:** User marked a specific task in today's plan as done. The most atomic unit of progress.

### Producer
- Component/Engine: Task item component in Today's Plan
- Trigger: User taps/clicks the task completion checkbox

### Consumers
| Consumer | What it does |
|----------|-------------|
| `DailyHistoryEngine` | Appends task ID to `tasksCompleted` |
| `CoachBrain` | Checks if all tasks done → triggers celebration |
| `RetentionEngine` | Marks today as active |
| `AnalyticsEngine` | Tracks task completion rate |

### Payload
```typescript
interface TodayPlanTaskCompletedPayload {
  userId: string
  planId: string
  taskId: string
  taskIndex: number
  totalTasks: number
  allTasksComplete: boolean
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `dailyHistory.entries[today].tasksCompleted` | `+= [taskId]` |
| `retention.daysSinceActive` | `0` |

### Analytics (GA4)
- Event name: `plan_task_completed`
- Parameters: `{ plan_id, task_id, tasks_remaining, all_complete }`

### Side effects
- If `allTasksComplete`: `goal_completed` event fires
- Task UI shows completed state

---

## Event: plan_adapted

**Category:** system  
**Description:** `CoachPlannerImpl` adapted an existing plan — either due to user return after inactivity, score change, or explicit user request.

### Producer
- Component/Engine: `CoachPlannerImpl`
- Trigger: Reactivation event, or `coach:plan_adapt` trigger in CoachStateMachine

### Consumers
| Consumer | What it does |
|----------|-------------|
| `JourneyEngine` | Notes plan adaptation in `completedSteps` |
| `AnalyticsEngine` | Tracks adaptation triggers and frequency |

### Payload
```typescript
interface PlanAdaptedPayload {
  userId: string
  planId: string
  previousPlanId: string
  adaptationReason: 'reactivation' | 'score_change' | 'user_request' | 'milestone_reached'
  gapDays: number          // days since last activity (if reactivation)
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= ['plan_adapted']` |
| `dailyHistory.entries[today].tasksAssigned` | New task IDs |

### Analytics (GA4)
- Event name: `plan_adapted`
- Parameters: `{ adaptation_reason, gap_days }`

### Side effects
- User sees updated plan with Mia's explanation of changes

---

## REGISTRATION EVENTS

---

## Event: registration_started

**Category:** user_action  
**Description:** User clicked a registration CTA and the form is visible.

### Producer
- Component/Engine: Registration CTA component
- Trigger: "Save My Plan," "Sign Up," or any registration button click

### Consumers
| Consumer | What it does |
|----------|-------------|
| `JourneyEngine` | Writes step |
| `AnalyticsEngine` | Tracks CTA click rate and source |

### Payload
```typescript
interface RegistrationStartedPayload {
  userId: string            // anonymous userId at this point
  triggerSource: string     // which CTA triggered it: 'plan_delivery' | 'gate_2' | 'gate_3'
  currentState: string      // product state at trigger time
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= ['registration_started']` |

### Analytics (GA4)
- Event name: `registration_started`
- Parameters: `{ trigger_source, current_state }`

### Side effects
- Registration form / modal appears

---

## Event: registration_completed

**Category:** user_action  
**Description:** User completed registration successfully. Account created. Anonymous UserGraph merged with authenticated profile.

### Producer
- Component/Engine: Registration form submit handler / auth service
- Trigger: API call to create account returns success

### Consumers
| Consumer | What it does |
|----------|-------------|
| `IdentityEngine` | Updates `identity.userType` to `'authenticated'` |
| `PremiumEngine` | Initializes trial |
| `SchedulerEngine` | Sets up morning/evening delivery schedule |
| `AnalyticsEngine` | Tracks registration conversion |

### Payload
```typescript
interface RegistrationCompletedPayload {
  userId: string            // now authenticated userId
  anonymousId: string       // previous anonymous userId (for graph merge)
  registrationMethod: 'email' | 'google' | 'apple'
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `identity.userType` | `'authenticated'` |
| `identity.name` | From registration form |
| `journey.completedSteps` | `+= ['registered']` |

### Analytics (GA4)
- Event name: `sign_up`
- Parameters: `{ method: registration_method }`

### Side effects
- Trial begins immediately (`trial_started` fires)
- Redirect to personal dashboard

---

## SUBSCRIPTION EVENTS

---

## Event: trial_started

**Category:** system  
**Description:** 7-day trial period has begun. User gets full Pro access.

### Producer
- Component/Engine: `PremiumEngine`
- Trigger: `registration_completed` fires

### Consumers
| Consumer | What it does |
|----------|-------------|
| `SchedulerEngine` | Enables evening video (Pro feature) |
| `AnalyticsEngine` | Starts trial conversion tracking |

### Payload
```typescript
interface TrialStartedPayload {
  userId: string
  trialEndDate: string    // ISO date
  featuresUnlocked: string[]
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `premium.tier` | `'free'` with trial active flag |
| `premium.quotaLimit` | Pro-level limit |

### Analytics (GA4)
- Event name: `trial_started`
- Parameters: `{ trial_end_date, features_count }`

---

## Event: premium_started

**Category:** user_action  
**Description:** User completed payment. Now a paying subscriber.

### Producer
- Component/Engine: Payment confirmation handler / Stripe webhook
- Trigger: Payment processed successfully

### Consumers
| Consumer | What it does |
|----------|-------------|
| `PremiumEngine` | Sets `premium.tier = 'pro'` |
| `CoachBrain` | Triggers premium welcome message |
| `SchedulerEngine` | Unlocks evening video schedule |
| `AnalyticsEngine` | Tracks revenue event |

### Payload
```typescript
interface PremiumStartedPayload {
  userId: string
  tier: 'pro' | 'enterprise'
  billingCycle: 'monthly' | 'annual'
  priceUSD: number
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `premium.tier` | `'pro'` |
| `premium.quotaLimit` | Unlimited |

### Analytics (GA4)
- Event name: `purchase`
- Parameters: `{ currency: 'USD', value: priceUSD, billing_cycle }`

---

## Event: premium_cancelled

**Category:** user_action / system  
**Description:** Subscription cancelled. User returns to free tier at end of billing period.

### Producer
- Component/Engine: Subscription management / Stripe webhook
- Trigger: Cancellation confirmed

### Consumers
| Consumer | What it does |
|----------|-------------|
| `PremiumEngine` | Schedules tier downgrade at period end |
| `CoachBrain` | Prepares winback messaging |
| `AnalyticsEngine` | Tracks churn |

### Payload
```typescript
interface PremiumCancelledPayload {
  userId: string
  cancellationReason: string | null
  accessUntil: string    // ISO date — when pro access ends
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `coachMemory.facts` | `+= 'User cancelled premium on {date}'` |

### Analytics (GA4)
- Event name: `premium_cancelled`
- Parameters: `{ cancellation_reason, days_as_premium }`

---

## DAILY ROUTINE EVENTS

---

## Event: morning_checkin_completed

**Category:** user_action  
**Description:** User completed their morning check-in — they answered mood/energy questions and acknowledged today's tasks. This is the daily anchor behavior.

### Producer
- Component/Engine: Morning check-in component
- Trigger: User submits morning check-in form

### Consumers
| Consumer | What it does |
|----------|-------------|
| `DailyHistoryEngine` | Writes `moodValue`, `energyValue`, `moodContext: 'morning'` |
| `CoachBrain` | Adjusts today's coaching tone based on mood |
| `RetentionEngine` | Marks user as `daily_active`, resets `daysSinceActive` |
| `SchedulerEngine` | Confirms morning delivery received |
| `AnalyticsEngine` | Tracks daily active rate |

### Payload
```typescript
interface MorningCheckinCompletedPayload {
  userId: string
  moodValue: number       // 1–5
  energyValue: number     // 1–5
  notes: string | null
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `dailyHistory.entries[today].moodValue` | Submitted mood (1–5) |
| `dailyHistory.entries[today].energyValue` | Submitted energy (1–5) |
| `dailyHistory.entries[today].moodContext` | `'morning'` |
| `retention.daysSinceActive` | `0` |
| `retention.dormancyLevel` | `'none'` |

### Analytics (GA4)
- Event name: `morning_checkin_completed`
- Parameters: `{ mood_value, energy_value, streak_length }`

### Side effects
- State transition: any inactive state → `daily_active`
- `daily_streak_updated` fires

---

## Event: evening_checkin_completed

**Category:** user_action  
**Description:** User completed their evening check-in — they reported on tasks completed, mood at end of day, and key wins or blockers.

### Producer
- Component/Engine: Evening check-in component
- Trigger: User submits evening form

### Consumers
| Consumer | What it does |
|----------|-------------|
| `DailyHistoryEngine` | Writes `eveningCheckinDone = true`, updates mood context |
| `CoachBrain` | Reads day summary for tomorrow's plan adjustment |
| `AnalyticsEngine` | Tracks evening engagement rate |

### Payload
```typescript
interface EveningCheckinCompletedPayload {
  userId: string
  tasksCompletedCount: number
  tasksAssignedCount: number
  moodValue: number       // 1–5
  energyValue: number     // 1–5
  notes: string | null
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `dailyHistory.entries[today].eveningCheckinDone` | `true` |
| `dailyHistory.entries[today].moodValue` | Evening mood (overwrites if higher priority) |
| `dailyHistory.entries[today].energyContext` | `'evening'` |

### Analytics (GA4)
- Event name: `evening_checkin_completed`
- Parameters: `{ tasks_completion_rate, mood_value }`

---

## Event: daily_streak_updated

**Category:** system  
**Description:** The user's consecutive daily activity streak has changed (increased or reset).

### Producer
- Component/Engine: `RetentionEngine` / `DailyHistoryEngine`
- Trigger: After `morning_checkin_completed` or `today_plan_task_completed`

### Consumers
| Consumer | What it does |
|----------|-------------|
| `CoachBrain` | Uses streak length to calibrate celebration messages |
| `AnalyticsEngine` | Tracks streak distribution |

### Payload
```typescript
interface DailyStreakUpdatedPayload {
  userId: string
  currentStreak: number
  previousStreak: number
  streakBroken: boolean
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `retention.daysSinceActive` | `0` |

### Analytics (GA4)
- Event name: `daily_streak_updated`
- Parameters: `{ current_streak, streak_broken }`

### Side effects
- If streak hits 3: Gate 2 evaluation triggered
- If streak hits 7: Milestone celebration prepared

---

## Event: goal_completed

**Category:** system  
**Description:** All tasks for the current day have been marked complete. Day's goal achieved.

### Producer
- Component/Engine: `CoachBrain` / `DailyHistoryEngine`
- Trigger: `tasksCompleted.length === tasksAssigned.length` for today

### Consumers
| Consumer | What it does |
|----------|-------------|
| `CoachBrain` | Prepares celebration message |
| `AnalyticsEngine` | Tracks daily goal completion rate |

### Payload
```typescript
interface GoalCompletedPayload {
  userId: string
  planId: string
  tasksCompleted: string[]
  completionTime: string    // ISO timestamp
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.progress` | Incremented |

### Analytics (GA4)
- Event name: `daily_goal_completed`
- Parameters: `{ plan_id, tasks_count }`

### Side effects
- Mia sends completion acknowledgment: specific, not generic

---

## Event: milestone_reached

**Category:** system  
**Description:** User has reached a significant journey milestone (Week 1 complete, first measurable result, etc.).

### Producer
- Component/Engine: `CoachBrain` / `JourneyEngine`
- Trigger: Milestone condition evaluated as true (Week 1 complete, 7-day streak, first goal achieved)

### Consumers
| Consumer | What it does |
|----------|-------------|
| `CoachBrain` | Triggers milestone celebration message |
| `JourneyEngine` | Writes milestone to `completedSteps` |
| `AnalyticsEngine` | Tracks milestone reach rates |

### Payload
```typescript
interface MilestoneReachedPayload {
  userId: string
  milestoneId: string    // 'week_1_complete', 'first_goal', 'streak_7', etc.
  milestoneLabel: string
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `journey.completedSteps` | `+= [milestoneId]` |
| `coachMemory.facts` | `+= 'Milestone reached: {milestoneLabel} on {date}'` |

### Analytics (GA4)
- Event name: `milestone_reached`
- Parameters: `{ milestone_id, milestone_label, days_to_reach }`

### Side effects
- Gate 3 evaluated if milestone is "Week 1 complete"

---

## RE-ENGAGEMENT EVENTS

---

## Event: inactivity_detected

**Category:** system  
**Description:** `RetentionEngine` / `SchedulerEngine` detected that the user has not been active for 1 or more days.

### Producer
- Component/Engine: `RetentionEngine` (`src/lib/retention/engine.ts`)
- Trigger: Scheduled check (nightly) finds no `daily_active` event in past N days

### Consumers
| Consumer | What it does |
|----------|-------------|
| `RetentionEngine` | Evaluates `RetentionRule` matrix for appropriate response |
| `AnalyticsEngine` | Tracks inactivity events by day count |

### Payload
```typescript
interface InactivityDetectedPayload {
  userId: string
  daysSinceActive: number    // 1, 3, 7, 14...
  dormancyLevel: 'mild' | 'moderate' | 'severe' | 'critical'
  lastActiveDate: string
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `retention.daysSinceActive` | Updated count |
| `retention.dormancyLevel` | Updated level |

### Analytics (GA4)
- Event name: `inactivity_detected`
- Parameters: `{ days_since_active, dormancy_level }`

### Side effects
- If `daysSinceActive >= 3`: `reengagement_triggered` fires

---

## Event: reengagement_triggered

**Category:** system  
**Description:** The system has decided to send a re-engagement message to an inactive user. Message channel and content selected by `RetentionEngine`.

### Producer
- Component/Engine: `RetentionEngine`
- Trigger: `inactivity_detected` with `days >= 3` AND cooldown period elapsed

### Consumers
| Consumer | What it does |
|----------|-------------|
| `NotificationEngine` | Sends push notification or email |
| `AnalyticsEngine` | Tracks re-engagement send rate |

### Payload
```typescript
interface ReengagementTriggeredPayload {
  userId: string
  ruleId: string         // RetentionRule.id
  channel: 'push' | 'email' | 'in_app'
  messageTitle: string
  messageBody: string
  urgency: 'high' | 'medium' | 'low'
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `retention.lastReminderFiredAt` | ISO timestamp |

### Analytics (GA4)
- Event name: `reengagement_triggered`
- Parameters: `{ rule_id, channel, days_inactive, urgency }`

### Side effects
- Message delivered to user
- 48-hour window opened for `user_reactivated`

---

## Event: user_reactivated

**Category:** user_action  
**Description:** An inactive user returned to the app after receiving a re-engagement message or organically. The system must immediately adapt their plan.

### Producer
- Component/Engine: App session start handler
- Trigger: App opened by user who was in `inactive_3d` state

### Consumers
| Consumer | What it does |
|----------|-------------|
| `CoachBrain` | Generates reactivation message |
| `CoachPlannerImpl` | Adapts plan for gap period |
| `RetentionEngine` | Resets dormancy counters |
| `AnalyticsEngine` | Tracks reactivation rate |

### Payload
```typescript
interface UserReactivatedPayload {
  userId: string
  daysSinceLastActive: number
  reactivationSource: 'push' | 'email' | 'organic'
  timestamp: number
}
```

### UserGraph writes
| Field | Value |
|-------|-------|
| `retention.daysSinceActive` | `0` |
| `retention.dormancyLevel` | `'none'` |
| `coachMemory.facts` | `+= 'Reactivated after {n} days on {date}'` |

### Analytics (GA4)
- Event name: `user_reactivated`
- Parameters: `{ days_inactive, source }`

### Side effects
- `plan_adapted` fires immediately
- Welcome-back screen from Mia displayed
