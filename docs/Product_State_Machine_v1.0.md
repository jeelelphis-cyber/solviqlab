# Product State Machine v1.0
## SolviqLab Coach Platform — Mia

**Document type:** Product Specification  
**Version:** 1.0  
**Date:** 2026-07-25  
**Status:** Foundational — governs all user lifecycle decisions  
**Author:** Product Architecture  
**Companion documents:** Product_Events_Bible_v1.0.md, UserGraph_Ownership_Matrix_v1.0.md

---

## Purpose

This document defines every state a user can occupy in the SolviqLab Coach Platform and the exact conditions that move them between states. It is the authoritative reference for product decisions, engineering implementations, and QA test cases.

Every state answers three questions:
1. What does this person understand about themselves right now?
2. What has the system earned the right to ask or offer?
3. What is the risk that this person leaves?

States are not screens. A state can persist across multiple page views, multiple days, and multiple sessions. The state machine is the backbone of product behavior; screens and messages are its expression.

---

## Architecture Notes

**State persistence:** States are derived from `UserGraph` (localStorage, `src/lib/graph/types.ts`). They are not stored as enum values — they are computed at runtime by reading graph fields. The `CoachStateMachine` interface (`src/lib/coach/state-machine/types.ts`) reads `journey.currentPhase` as the operational state.

**Transition authority:** Only the `CoachStateMachine.transition()` method may change state. UI components must call this method via the coach service — never write to `journey.currentPhase` directly.

**Event bus:** Transitions emit events on the `EventBus` (`src/lib/events/bus.ts`). All platform events follow the `platform:*` naming convention.

---

## State Transition Diagram (ASCII)

```
[anonymous_visitor]
        │
        │ uses calculator
        ▼
[calculator_user]
        │
        │ opens assessment / Mia intro
        ▼
[assessment_completed]
        │
        │ clicks "Meet Mia"
        ▼
[video_requested] ──── HeyGen API ────► [video_generated]
                                                │
                                                │ ≥80% watched
                                                ▼
                                        [video_watched]
                                                │
                                                │ quiz opens
                                                ▼
                                        [coach_quiz_started]
                                                │
                                                │ all questions answered
                                                ▼
                                        [coach_quiz_completed]
                                                │
                                                │ plan generated
                                                ▼
                                        [today_plan_delivered]
                                                │
                                                │ registration CTA
                                                ▼
                                        [registration_started]
                                                │
                                                │ form submitted
                                                ▼
                                          [registered]
                                                │
                                                │ day 1
                                                ▼
                                            [trial]
                                           /       \
                                  day 7+         payment
                                  expires        success
                                    │               │
                                    │               ▼
                                    │           [premium]
                                    │               │
                              [inactive_1d]         │
                                    │               │
                              [inactive_3d]         │
                                    │               │
                              [reactivated] ────────┘
                                    │
                              [daily_active]
                                (loops daily)
```

---

## State Persistence Rules

| State | Survives page reload | Survives browser close | Survives 7 days |
|-------|---------------------|----------------------|-----------------|
| `anonymous_visitor` | No (session-only) | No | No |
| `calculator_user` | Yes (localStorage) | Yes | Yes |
| `assessment_completed` | Yes | Yes | Yes |
| `video_requested` | Yes | Yes | Yes |
| `video_generated` | Yes | Yes | Yes |
| `video_watched` | Yes | Yes | Yes |
| `coach_quiz_started` | Yes | Yes | Yes |
| `coach_quiz_completed` | Yes | Yes | Yes |
| `today_plan_delivered` | Yes | Yes | Yes |
| `registration_started` | Yes | Yes | No (7-day TTL) |
| `registered` | Yes (cloud) | Yes | Yes |
| `trial` | Yes (cloud) | Yes | Yes |
| `premium` | Yes (cloud) | Yes | Yes |
| `daily_active` | Yes | Yes | No (resets daily) |
| `inactive_1d` | Yes | Yes | Upgrades to inactive_3d |
| `inactive_3d` | Yes | Yes | Degrades further |
| `reactivated` | Yes | Yes | Becomes daily_active |

**Rule:** All states derived from `UserGraph.journey` survive page reload. `anonymous_visitor` is the only session-only state — it has no `UserGraph` entry.

---

## State: anonymous_visitor

**Name:** Anonymous Visitor  
**Description:** The user has no stored identity — this is their first interaction with SolviqLab, or they cleared storage/used private browsing.

### Entry conditions
- No `UserGraph` exists in localStorage for this session
- No authentication cookie or session token present
- First page load of the session

### What the user can do
- View any calculator page
- Read content (blog, landing pages)
- Complete a calculation (triggers transition)
- Cannot save results, create goals, or access any personalized feature

### Events fired on entry
- `page_viewed` → AnalyticsEngine (GA4 session start)

### Exit conditions
| To state | Trigger |
|----------|---------|
| `calculator_user` | User submits a calculator and receives a result |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| (none — UserGraph not yet created) | — | — |

### User emotion
**Primary:** Curiosity or task-focus. "I need to check my BMI."  
**Risk:** Immediate bounce if calculator takes too long to load or is unclear  
**Mia's response:** Silent. Mia does not appear in this state. The calculator must deliver value before any coaching layer appears.

---

## State: calculator_user

**Name:** Calculator User  
**Description:** The user has completed at least one calculation and received a result. The system has their first data point.

### Entry conditions
- User submitted a calculator form with valid inputs
- `ResultEvent` was dispatched on EventBus with `type: 'solviqlab:result'`
- EventBus pipeline (P10→P80) has completed
- `UserGraph` has been initialized with a `userId`

### What the user can do
- View their calculator result
- See the JourneyExperience component (Mia intro card)
- Use additional calculators
- Click "Meet Mia" (triggers transition if assessment available)
- Share result

### Events fired on entry
- `solviqlab:result` → EventBus (P10: UserEngine, P20: ProfileEngine, P40: RecommendationEngine, P80: AnalyticsEngine)
- `calculator_completed` → AnalyticsEngine, CoachBrain

### Exit conditions
| To state | Trigger |
|----------|---------|
| `assessment_completed` | User completes an assessment (weight/sleep/stress cluster) |
| `video_requested` | User clicks "Meet Mia" without completing formal assessment (shortcut path) |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `userId` | Generated UUID | UserEngine (P10) |
| `identity.userType` | `'anonymous'` | UserEngine |
| `identity.language` | Detected from URL locale | UserEngine |
| `identity.updatedAt` | ISO timestamp | UserEngine |
| `journey.completedSteps` | `+= ['calculator_viewed', 'calculator_{slug}_completed']` | JourneyEngine |
| `journey.activeCluster` | Inferred from calculator slug | JourneyEngine |
| `assessments.items` | Preliminary score from result | AssessmentEngine |
| `coachMemory.facts` | `+= miaFact` (e.g., "BMI 27.3 — Overweight") | CoachBrain |

### User emotion
**Primary:** Interested but uncommitted. "OK, that's my number. Now what?"  
**Risk:** If the result has no context or next step, the user leaves within 10 seconds  
**Mia's response:** JourneyExperience component appears with a personalized insight about the result. Mia's first line must reference the specific number from the calculation.

---

## State: assessment_completed

**Name:** Assessment Completed  
**Description:** The user has gone beyond a single calculation — they have completed a structured assessment that gives the system enough signal to build a real coaching plan.

### Entry conditions
- `platform:assessment_completed` event emitted
- `AssessmentsNode.items` has at least one entry with `confidence: 'established'`
- Assessment cluster score computed (0–100 scale)

### What the user can do
- View their assessment results
- See Mia's analysis of their profile
- Click "Meet Mia" to request personalized video
- Cannot yet access daily plan (requires video + quiz)

### Events fired on entry
- `platform:assessment_completed` → CoachBrain, DecisionEngine, AnalyticsEngine
- `assessment_score_computed` → ProfileEngine, RecommendationEngine

### Exit conditions
| To state | Trigger |
|----------|---------|
| `video_requested` | User clicks "Meet Mia" CTA |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `assessments.items` | New entry: `{clusterId, score, confidence: 'established', assessedAt}` | AssessmentEngine |
| `assessments.confidence` | `'established'` | AssessmentEngine |
| `journey.currentPhase` | `'assessment'` | JourneyEngine |
| `journey.completedSteps` | `+= ['assessment_{cluster}_completed']` | JourneyEngine |
| `coachMemory.facts` | `+= assessment insight fact` | CoachBrain |

### User emotion
**Primary:** Engaged and slightly exposed. "She knows something about me."  
**Risk:** Over-engineering the assessment makes users feel judged, not helped  
**Mia's response:** Mia acknowledges the result with one precise observation. Not a list of problems — one specific, actionable insight that makes the user feel understood.

---

## State: video_requested

**Name:** Video Requested  
**Description:** The user clicked "Meet Mia" and HeyGen video generation has been initiated. The user is waiting for their personalized video.

### Entry conditions
- User clicked "Meet Mia" CTA button
- `mia_video_requested` event fired
- `HeyGenService.generate()` was called with user script
- HeyGen returned `videoId` (or request is queued)

### What the user can do
- View the waiting screen ("Mia is preparing your message...")
- See estimated wait time (1–2 minutes)
- Read Mia's brief bio/credentials while waiting
- Cannot cancel (cancellation UX is not built; it would increase confusion)

### Events fired on entry
- `mia_video_requested` → HeyGenService, AnalyticsEngine
- `mia_onboarding_started` → CoachBrain (logs that onboarding has begun)

### Exit conditions
| To state | Trigger |
|----------|---------|
| `video_generated` | HeyGen returns `videoId` with `status: 'completed'` |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `journey.completedSteps` | `+= ['mia_video_requested']` | JourneyEngine |
| `coachMemory.facts` | `+= 'User requested Mia video on {date}'` | CoachBrain |

### User emotion
**Primary:** Anticipation mixed with mild skepticism. "Let's see if this is actually personalized."  
**Risk:** If the wait screen is generic and the wait is long (>90 sec), the user abandons  
**Mia's response:** The waiting screen shows Mia "reading" the user's data. Dynamic copy like "Mia has reviewed your BMI of 27.3 and your sleep data. She's preparing your message..." — specific references maintain attention.

---

## State: video_generated

**Name:** Video Generated  
**Description:** HeyGen has returned the completed video. The system is ready to play Mia's personalized message.

### Entry conditions
- `HeyGenStatusResponse.status === 'completed'`
- `videoUrl` is non-null and accessible
- Player component has been initialized

### What the user can do
- Watch the video (player is ready and auto-starts)
- Pause/resume
- Cannot skip or fast-forward (enforced by player settings in this state)

### Events fired on entry
- `mia_video_generated` → AnalyticsEngine, SchedulerEngine

### Exit conditions
| To state | Trigger |
|----------|---------|
| `video_watched` | ≥80% of video duration elapsed (player `onTimeUpdate` event) |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `dailyHistory.entries[today].morningVideoWatched` | `false` (not yet, transitions on watch) | SchedulerEngine |

### User emotion
**Primary:** Curiosity converting to engagement. The video is loading — this is the critical moment.  
**Risk:** Buffering or playback failure destroys trust more than any other technical failure  
**Mia's response:** Player shows Mia's static thumbnail with "Play" button — not a black loading screen.

---

## State: video_watched

**Name:** Video Watched  
**Description:** The user has watched at least 80% of Mia's personalized video. The coaching relationship has begun.

### Entry conditions
- Player `onTimeUpdate` detected ≥80% of total duration
- `mia_video_watched` event fired

### What the user can do
- Rewatch the video
- Proceed to Coach Quiz (primary CTA appears immediately after video ends)
- Close the player (does not reset state)

### Events fired on entry
- `mia_video_watched` → CoachBrain, AnalyticsEngine
- `mia_onboarding_completed` → JourneyEngine (video phase complete)

### Exit conditions
| To state | Trigger |
|----------|---------|
| `coach_quiz_started` | User clicks "Start Quiz" CTA or quiz auto-appears |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `dailyHistory.entries[today].morningVideoWatched` | `true` | SchedulerEngine |
| `dailyHistory.entries[today].videoWatchDuration` | seconds watched | SchedulerEngine |
| `journey.completedSteps` | `+= ['mia_video_watched']` | JourneyEngine |

### User emotion
**Primary:** Impressed or at minimum, curious. "She really did know my number."  
**Risk:** If Mia's video feels generic, the spell breaks immediately  
**Mia's response:** Video ends, Coach Quiz CTA slides in with Mia's voiceover-aligned text: "Before I build your plan, I have 3 questions."

---

## State: coach_quiz_started

**Name:** Coach Quiz Started  
**Description:** The user has opened the post-video quiz. The system is collecting the most important data for plan generation.

### Entry conditions
- User clicked "Start Quiz" CTA (or quiz auto-appeared after video)
- Quiz component is rendered with first question visible
- `coach_quiz_started` event fired

### What the user can do
- Answer quiz questions (3–5 questions)
- Navigate back to previous questions
- Cannot skip the quiz without losing the plan (enforced by gating logic)

### Events fired on entry
- `coach_quiz_started` → CoachBrain, AnalyticsEngine

### Exit conditions
| To state | Trigger |
|----------|---------|
| `coach_quiz_completed` | User answers all required questions and submits |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `journey.completedSteps` | `+= ['coach_quiz_started']` | JourneyEngine |

### User emotion
**Primary:** Engaged and willing. "She asked me real questions."  
**Risk:** Too many questions kills momentum. Maximum 5 questions. Each must feel purposeful.  
**Mia's response:** Questions are framed as Mia asking, not a form. "What's held you back before?" not "Previous attempts: □ tried dieting □ tried exercise."

---

## State: coach_quiz_completed

**Name:** Coach Quiz Completed  
**Description:** The user has answered all quiz questions. The system now has enough data to generate a meaningful first daily plan.

### Entry conditions
- All required quiz questions answered
- `coach_quiz_completed` event fired
- `CoachPlannerImpl` has been triggered to generate today's plan

### What the user can do
- See "Mia is building your plan..." loading state
- Cannot modify quiz answers (they are committed to UserGraph)

### Events fired on entry
- `coach_quiz_completed` → CoachPlannerImpl, AnalyticsEngine
- `today_plan_generated` → JourneyEngine (after planner completes)

### Exit conditions
| To state | Trigger |
|----------|---------|
| `today_plan_delivered` | `CoachPlannerImpl` returns first plan |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `goals.items` | New goal entries from quiz answers | CoachBrain |
| `habits.items` | Habits identified from quiz | CoachBrain |
| `coachMemory.communicationStyle` | Inferred from quiz response patterns | CoachBrain |
| `identity.name` | User's name (if asked in quiz) | IdentityEngine |

### User emotion
**Primary:** Anticipation. "What is she going to tell me?"  
**Risk:** If the plan generation takes >3 seconds without feedback, anxiety sets in  
**Mia's response:** "I'm putting your plan together based on what you told me. This will take about 10 seconds."

---

## State: today_plan_delivered

**Name:** Today's Plan Delivered  
**Description:** The user has received their first free daily plan — a concrete, personalized list of actions for today. This is the highest-value moment in the free tier.

### Entry conditions
- `CoachPlannerImpl` returned a valid plan
- Plan has been rendered in the UI
- `today_plan_viewed` event fired

### What the user can do
- View today's plan (full access, no gate yet)
- Mark tasks as complete
- Read Mia's explanation for each task
- See the Registration CTA (soft, not blocking)

### Events fired on entry
- `today_plan_generated` → AnalyticsEngine
- `today_plan_viewed` → CoachBrain (tracks first plan delivery)

### Exit conditions
| To state | Trigger |
|----------|---------|
| `registration_started` | User clicks "Save My Plan" or "Sign Up" CTA |
| `daily_active` | User marks their first task complete (if already registered — skip path) |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `journey.currentPhase` | `'active_coaching'` | JourneyEngine |
| `journey.progress` | `5` (5% — plan delivered) | JourneyEngine |
| `dailyHistory.entries[today].tasksAssigned` | Task IDs from plan | CoachPlannerImpl |

### User emotion
**Primary:** Motivated and slightly overwhelmed. "This is real. This is about me."  
**Risk:** If the plan feels generic ("drink water, sleep 8 hours"), trust collapses permanently  
**Mia's response:** Plan introduction: "Based on your BMI of 27.3 and the sleep pattern you described, your first priority is not diet — it's this:" [specific first action].

---

## State: registration_started

**Name:** Registration Started  
**Description:** The user clicked a registration CTA and the registration form is visible. They have not yet completed registration.

### Entry conditions
- User clicked "Save My Plan," "Sign Up," or "Keep My Progress" CTA
- Registration form is rendered
- `registration_started` event fired

### What the user can do
- Fill in registration form (email + password)
- Continue with OAuth (if implemented)
- Close form and return to plan (plan is still accessible — no hard gate)

### Events fired on entry
- `registration_started` → AnalyticsEngine

### Exit conditions
| To state | Trigger |
|----------|---------|
| `registered` | Form submitted successfully, account created |
| `today_plan_delivered` | User dismisses form (stays anonymous with plan) |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `journey.completedSteps` | `+= ['registration_started']` | JourneyEngine |

### User emotion
**Primary:** Motivated but cautious. "Do I really need an account?"  
**Risk:** Asking for too much information (phone, DOB, address) kills conversion at this step  
**Mia's response:** "Your plan is ready. To access it tomorrow and track your progress, I need one thing from you: your email." Simple, clear, specific.

---

## State: registered

**Name:** Registered  
**Description:** The user has a verified account. Their data is now persisted in the cloud (or cloud-ready). Trial begins automatically.

### Entry conditions
- Registration form submitted with valid email + password (or OAuth callback received)
- Account created in backend
- `registration_completed` event fired
- `trial_started` event fired immediately after

### What the user can do
- Access personal cabinet / dashboard
- View today's plan (now saved to their account)
- Set notification preferences
- Begin 7-day trial

### Events fired on entry
- `registration_completed` → IdentityEngine, AnalyticsEngine
- `trial_started` → PremiumEngine, SchedulerEngine

### Exit conditions
| To state | Trigger |
|----------|---------|
| `trial` | Auto-transition (trial begins on registration) |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `identity.userType` | `'authenticated'` | IdentityEngine |
| `identity.name` | From registration form | IdentityEngine |
| `premium.tier` | `'free'` (trial not yet activated) | PremiumEngine |
| `journey.completedSteps` | `+= ['registered']` | JourneyEngine |

### User emotion
**Primary:** Committed but also evaluating. "OK, I'm in. Show me it's worth it."  
**Risk:** If the post-registration screen is a blank dashboard, the user questions their decision  
**Mia's response:** Post-registration confirmation from Mia: "Welcome, [name]. Your first plan is already waiting. Let's make day 1 count." — then redirect to today's plan, not to a generic dashboard.

---

## State: trial

**Name:** Trial  
**Description:** The user is within their first 7 days as a registered user. They have full Pro-level access to evaluate the product.

### Entry conditions
- `registered` state completed
- `trial_started` event fired
- `premium.tier` = `'free'` with trial active
- Trial end date = registration date + 7 days

### What the user can do
- Access all features (equivalent to `premium` tier during trial)
- Complete daily check-ins
- Receive morning and evening Mia routines
- Build streak (shown prominently to motivate conversion)

### Events fired on entry
- `trial_started` → SchedulerEngine (schedules first morning routine), PremiumEngine, AnalyticsEngine

### Exit conditions
| To state | Trigger |
|----------|---------|
| `premium` | User subscribes before trial ends |
| `inactive_1d` | No activity for 1 day |
| `daily_active` | User completes daily check-in |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `premium.tier` | `'free'` with trial flag | PremiumEngine |
| `premium.quotaLimit` | Pro-level (unlimited during trial) | PremiumEngine |
| `retention.daysSinceActive` | `0` | RetentionEngine |

### User emotion
**Primary:** Excitement mixed with "I'll see if this is really different."  
**Risk:** Trial inertia — user thinks "I'll do it later" and the 7 days expire unused  
**Mia's response:** Day 1 morning message immediately after registration: "Your first day starts now, not tomorrow. I've set up your check-in for [time]. One task. That's all I need from you today."

---

## State: premium

**Name:** Premium Subscriber  
**Description:** The user is a paying subscriber. The relationship has been commercially confirmed — they believe the product is worth paying for.

### Entry conditions
- Payment processed successfully
- `premium_started` event fired
- `premium.tier` = `'pro'` or `'enterprise'`

### What the user can do
- All features without limitation
- Evening video check-ins (Pro)
- Multi-cluster journeys (Pro)
- Data export (Pro)
- Priority support

### Events fired on entry
- `premium_started` → PremiumEngine, AnalyticsEngine, CoachBrain

### Exit conditions
| To state | Trigger |
|----------|---------|
| `daily_active` | Continues daily cycle |
| `inactive_1d` | Misses one day |
| `inactive_3d` | Missed 3 days (re-engagement triggered) |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `premium.tier` | `'pro'` | PremiumEngine |
| `premium.quotaLimit` | Unlimited | PremiumEngine |
| `coachMemory.facts` | `+= 'User became premium on {date}'` | CoachBrain |

### User emotion
**Primary:** Investment + accountability. "I paid for this. I need to use it."  
**Risk:** Buyer's remorse if the first premium experience is identical to trial  
**Mia's response:** Immediate post-payment message: "You just made this real. Here's what changes starting today:" [list 2–3 specific new capabilities, not generic "full access"].

---

## State: daily_active

**Name:** Daily Active  
**Description:** The user has completed at least one meaningful interaction today (morning check-in, task completion, or video watch). This state resets daily at midnight (user's timezone).

### Entry conditions
- User completes morning check-in (`morning_checkin_completed` fired)
- OR user marks at least one task complete (`today_plan_task_completed` fired)
- OR user watches today's morning video
- Date is current calendar day in user's timezone (from `identity.timezone`)

### What the user can do
- Complete remaining daily tasks
- View progress
- Access evening check-in (if Pro)
- Interact with Mia in chat

### Events fired on entry
- `daily_streak_updated` → CoachBrain, AnalyticsEngine

### Exit conditions
| To state | Trigger |
|----------|---------|
| `inactive_1d` | No activity by midnight + next morning without check-in |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `dailyHistory.entries[today]` | Updated with tasks, mood, energy | CoachBrain |
| `retention.daysSinceActive` | `0` | RetentionEngine |
| `retention.dormancyLevel` | `'none'` | RetentionEngine |

### User emotion
**Primary:** Momentum and habit formation. "I'm doing this."  
**Risk:** If today's plan feels identical to yesterday's, momentum breaks  
**Mia's response:** Mia's morning message references yesterday's completion: "You hit your step goal yesterday. Today I'm raising it slightly."

---

## State: inactive_1d

**Name:** Inactive — 1 Day  
**Description:** The user missed one day. This is normal and expected. The system takes no alarming action — it simply notes the absence and prepares a gentle return message.

### Entry conditions
- `SchedulerEngine` detects no `daily_active` events in the past 24 hours
- `inactivity_detected` event fired with `days: 1`

### What the user can do
- Still access everything normally
- Resume at any point (returns to `daily_active`)

### Events fired on entry
- `inactivity_detected` (days: 1) → RetentionEngine, AnalyticsEngine

### Exit conditions
| To state | Trigger |
|----------|---------|
| `daily_active` | User completes any check-in |
| `inactive_3d` | No activity for 3 total days |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `retention.daysSinceActive` | `1` | RetentionEngine |
| `retention.dormancyLevel` | `'mild'` | RetentionEngine |

### User emotion
**Primary:** Distracted but not gone. Life happened.  
**Risk:** A pushy notification ("You missed a day!") activates guilt and avoidance  
**Mia's response:** No push yet at 1 day. System is silent. Return is organic.

---

## State: inactive_3d

**Name:** Inactive — 3 Days (Re-engagement Active)  
**Description:** Three days without activity. The system now actively attempts to bring the user back. Mia reaches out.

### Entry conditions
- `SchedulerEngine` detects no activity for 3+ calendar days
- `inactivity_detected` event fired with `days: 3`
- `reengagement_triggered` event fired

### What the user can do
- Receive re-engagement message (push notification or email)
- Click CTA to return to app
- Ignore (system notes this and adjusts future strategy)

### Events fired on entry
- `inactivity_detected` (days: 3) → RetentionEngine
- `reengagement_triggered` → RetentionEngine, AnalyticsEngine

### Exit conditions
| To state | Trigger |
|----------|---------|
| `reactivated` | User opens app within 48h of re-engagement message |
| `inactive_3d` | No response to re-engagement (state persists, cooldown resets) |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `retention.daysSinceActive` | `3` | RetentionEngine |
| `retention.dormancyLevel` | `'moderate'` | RetentionEngine |
| `retention.lastReminderFiredAt` | ISO timestamp | RetentionEngine |

### User emotion
**Primary:** Guilt and avoidance. "I know I should go back. I don't want to see how much I've missed."  
**Risk:** Making the user feel shame guarantees they don't return  
**Mia's response:** "I haven't sent this to guilt you. I saved your progress. Everything is exactly where you left it. Come back when you're ready — I'll adjust the plan to today." No streak mention. No count of days missed.

---

## State: reactivated

**Name:** Reactivated  
**Description:** The user returned after a period of inactivity. They are re-engaging. The most delicate state — the product must not punish the return.

### Entry conditions
- User opens app after `inactive_3d` state
- `user_reactivated` event fired
- App was opened within the re-engagement window

### What the user can do
- View a "Welcome back" screen from Mia
- See their updated plan (automatically adjusted)
- Choose to resume or reset their journey

### Events fired on entry
- `user_reactivated` → CoachBrain, RetentionEngine, AnalyticsEngine
- `plan_adapted` → CoachPlannerImpl (plan adjusted for gap period)

### Exit conditions
| To state | Trigger |
|----------|---------|
| `daily_active` | User completes morning check-in or first task |

### UserGraph writes
| Field | Value | Owner |
|-------|-------|-------|
| `retention.daysSinceActive` | `0` | RetentionEngine |
| `retention.dormancyLevel` | `'none'` | RetentionEngine |
| `journey.progress` | Adjusted (gap period accounted for) | JourneyEngine |
| `coachMemory.facts` | `+= 'User reactivated after {n} days on {date}'` | CoachBrain |

### User emotion
**Primary:** Cautious hope. "Maybe I can actually pick this back up."  
**Risk:** If the plan is unchanged from when they left, the user knows the system doesn't actually adapt  
**Mia's response:** "You were gone for 5 days. I've adjusted your plan — we don't pick up exactly where we left off, we pick up where you actually are today. The goal is the same. The path is updated."
