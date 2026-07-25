# Customer Journey Engine v1.0
## SolviqLab Coach Platform — Mia

**Document type:** Product Architecture  
**Version:** 1.0  
**Date:** 2026-07-25  
**Status:** Foundational — governs all Mia UX decisions  
**Companion document:** Coach_Communication_System_v1.0.md

---

## Purpose

This document defines all user journeys through the SolviqLab Coach Platform. It is the single source of truth for how users enter, progress, and stay in the Mia coaching loop. Every engineering decision about screens, state transitions, and system writes must align with the flows defined here.

This is not a wireframe document. It defines the logic, emotion, and data contracts behind each step.

---

## Architecture Foundations

### What the system knows about a user (UserGraph)

All personalization and coaching decisions are driven by data written to `UserGraph` — the localStorage-backed persistent graph defined in `src/lib/graph/types.ts`. The graph has 10 nodes:

| Node | Key fields | Who writes it |
|------|-----------|---------------|
| `identity` | name, userType (anonymous/authenticated), language, timezone, age | Registration, onboarding quiz |
| `goals` | items[] (text, status, priority, addedAt) | Coach quiz, chat, planner |
| `habits` | items[] (name, frequency, sentiment) | Coach quiz, assessment |
| `assessments` | items[] (clusterId, score, confidence, assessedAt) | Assessment flows |
| `journey` | activeCluster, currentPhase, progress, completedSteps | Every flow transition |
| `coachMemory` | facts[], communicationStyle, preferredTopics | Every Mia interaction |
| `preferences` | language, responseLength, notificationsEnabled | Settings, inferred from behavior |
| `retention` | daysSinceActive, dormancyLevel, lastReminderFiredAt | SchedulerEngine |
| `premium` | tier, quotaUsedToday, quotaLimit | Payment flow |
| `dailyHistory` | entries[] — 90-day rolling window: tasks, mood, energy, video watch | Check-in, coach brain |

**Confidence levels on all nodes:**
- `inferred` — derived from behavior (e.g., dormancy from timestamps)
- `stated` — user explicitly told us (e.g., entered a goal)
- `confirmed` — verified by repeated assessment

### System components referenced in this document

| Component | Location | Role |
|-----------|----------|------|
| `CoachBrain` | `src/lib/coach/brain/coach-brain.ts` | Analyzes graph, makes coaching decisions |
| `DecisionEngine` | `src/lib/coach/brain/decision-engine.ts` | Evaluates decision rules against UserGraph |
| `CoachPlannerImpl` | `src/lib/coach/planner/coach-planner.ts` | Creates and adapts coaching plans |
| `SchedulerEngine` | `src/lib/coach/scheduler/scheduler-engine.ts` | Timezone-aware morning/evening triggers |
| `RetentionEngine` | `src/lib/retention/engine.ts` | Detects dormancy, triggers re-engagement |
| `HeyGenService` | `src/lib/heygen/service.ts` | Generates personalized videos via HeyGen API |
| `ScriptBuilder` | `src/lib/heygen/script-builder.ts` | Assembles video scripts from variants |
| `GraphRepository` | `src/lib/graph/repository.ts` | Reads UserGraph from localStorage |
| `GraphUpdater` | `src/lib/graph/updater.ts` | Writes to UserGraph nodes |
| `RetentionEngine` | `src/lib/retention/engine.ts` | Manages re-engagement logic |

---

## The 7 User Flows

---

## Flow 1 — Calculator Entry

**The most common entry point.** A user finds a health or finance calculator via Google, gets a result, and is introduced to Mia.

**Entry:** Google organic search  
**Trigger:** User arrives at `/[lang]/calculators/[slug]` and completes a calculation

**Volume hypothesis:** 70%+ of new users enter through this flow.

---

### Steps

| # | Step | What user sees | What user feels | What Mia does | System records |
|---|------|---------------|-----------------|---------------|----------------|
| 1 | **Calculator page** | Calculator form (e.g., BMI, TDEE, BMR, calorie deficit). Clean interface, no distractions. | Curiosity. "Let me check my numbers." Task-oriented, not emotionally invested yet. | Nothing yet. System is silent. | `journey.completedSteps` += `'calculator_viewed'`. First-visit timestamp inferred. |
| 2 | **Result display** | Their calculated result (e.g., BMI: 27.4 — Overweight). Numeric badge with contextual label. | Mild shock, recognition, or validation. The number lands. This is the emotional hook moment. | Nothing directly. But result page triggers JourneyExperience section load. | `assessments.items` += entry with `clusterId`, `score`, `confidence: 'preliminary'`. `journey.activeCluster` set. |
| 3 | **JourneyExperience section** | Below the result: a warm section titled something like "What this means for you." Soft background. Mia's avatar photo (not yet video). Text: "I've looked at your numbers. I want to show you something." CTA button: "See what Mia found." | Transition from task mode to emotional mode. User is curious. The number becomes personal. | Mia's avatar appears with a framing sentence — not generic medical text. The section is crafted from calculator result data. | `journey.completedSteps` += `'journey_section_viewed'`. |
| 4 | **Mia Intro screen** | Full-width Mia intro (the `UserJourneySection` component). Her photo or animated avatar. A short text: who she is, what she does. NOT a bot disclosure — a coach presence. One clear CTA: "Watch Mia's message for you." | Anticipation. "Is this AI? Is this a real coach?" The ambiguity is intentional and must feel premium. | The system prepares the HeyGen video in the background. Script assembled from: calculator `clusterId` + `score` + language. Video generation starts here, not when user clicks play. | `coachMemory.facts` += `{text: 'user_entered_from_calculator', category: 'event'}`. HeyGen request queued. |
| 5 | **Mia Video** | 30–45 second personalized video. Script: Opening variant (A/B/C from `OPENING_VARIANTS`) + Insight about their result + Hook asking them to answer 3 questions. Plays inline. No skip button for first 15 seconds. | This is the pivot moment. If the video lands, users stay. They feel seen — specifically, not generically. | Mia references their specific number ("a BMI of 27") without being clinical. Uses `opening_mirror_A`, `opening_reframe_B`, or `opening_validation_C` variant based on A/B test. Ends with a Hook variant. | `dailyHistory.entries[today].morningVideoWatched = true`. `coachMemory.facts` += video variant IDs. |
| 6 | **Coach Quiz** | 3–5 questions appear BELOW the video (not a new page). Framed conversationally. Each question has a clear answer and shows Mia's logic. Example: "What's your main goal right now?" / "How long have you been trying?" / "What gets in the way most?" | Engagement. "She's actually asking me real questions." The quiz doesn't feel like a form — it's a conversation setup. | Mia's quiz frames each question with a micro-context sentence. Not "Enter your goal" but "I want to understand what you're working toward." | `goals.items` += stated goal. `habits.items` += stated barriers. `coachMemory.communicationStyle` inferred from response pattern. |
| 7 | **Today's Plan** (FREE) | Immediate result: "Here's your plan for today, [name]." 1–3 specific actions. Each action has: what to do, why it matters, how long it takes. Free tier shows Day 1 plan only. | Relief + validation. "This is mine. This is specific." The plan must feel earned, not generic. | CoachPlannerImpl.createPlan() called. `buildDefaultTasks()` generates Day 1 tasks from `domainConfig.taskCategories`. Plan rendered as `ActivePlanView`. | `journey.currentPhase = 'onboarding'`. `coachMemory.facts` += `'active_coach_plan'`. `dailyHistory.entries[today].tasksAssigned` += task IDs. |
| 8 | **Registration Gate** | Soft wall: "Want this every day? Save your plan and Mia will be here every morning." Two options: Register (email) or Continue anonymously (limited). Visual: tomorrow's plan preview — blurred/locked. | Desire. "I want that." User has enough investment to register. | System displays a `RegistrationPrompt` component. Shows what they'll get: daily video, evening check-in, progress tracking. | `identity.userType` remains `'anonymous'` until registration completes. |
| 9 | **Registration** | Email + name form (or OAuth). No password required at this stage — magic link optional. | Low friction. User is committed. | On success: `identity.userType = 'authenticated'`. Welcome email queued. First notification consent captured. | `identity.name` set. `preferences.notificationsEnabled` set. `identity.userType = 'authenticated'`. |
| 10 | **Personal Cabinet / Dashboard** | Dashboard at `/[lang]/dashboard`. Shows: today's plan (active), Mia's morning video (today's), streak counter (day 1), next milestone. | Ownership. "This is my space." | `CoachBrain.analyze()` runs. Decision rule `new_user_welcome` fires (priority 100). Morning video for tomorrow is queued if past 6pm. | `journey.completedSteps` += `'dashboard_first_visit'`. `retention.daysSinceActive = 0`. |

---

### Decision points

**Free vs. Paid gate:**
- Free: Today's plan (Day 1 tasks only, 1–3 actions), first Mia video, calculator results, one assessment
- Paid (Pro, $9.99/mo): Full 30-day plan, daily morning/evening videos, chat with Mia, unlimited history, multi-cluster coaching, export
- Gate appears at Step 8 (after Today's Plan is shown). User sees the plan first — then is asked to register to keep it.
- Premium upsell appears on Day 3 dashboard visit ("See your full 30-day roadmap") — not before.

**Anonymous vs. Registered gate:**
- Anonymous users can complete Steps 1–7 (see their result + today's plan). No daily loop.
- Registration at Step 8 unlocks: daily videos, evening check-ins, streak tracking, personalized history.
- Anonymous state is preserved in localStorage. If user returns within 7 days, graph is intact.

---

### Exit risks and prevention

| Risk | Where it happens | How Mia prevents it |
|------|-----------------|---------------------|
| User gets result and bounces | Step 2 | JourneyExperience section loads immediately below result. Mia's presence interrupts the default "close tab" behavior. |
| Video doesn't load (HeyGen latency) | Step 5 | Fallback text renders in <3 seconds. `fallbackText` from `videoTemplates.morning` shown with Mia's photo. Never show a spinner for >3s. |
| Quiz feels like a form | Step 6 | Questions are framed by Mia's conversational sentence. Max 5 questions. Progress bar. Each answer immediately advances — no "Submit" button wait. |
| Today's Plan feels generic | Step 7 | Tasks reference the user's specific cluster and score. "Because your BMI is 27.4, movement is the lever with highest ROI this week." |
| Registration wall causes abandonment | Step 8 | Gate is soft. "Continue anonymously" option exists. Anonymous plan is shown first — registration is framed as saving it, not unlocking it. |
| Post-registration anti-climax | Step 10 | Dashboard is personalized from day 1. Mia's video is already there. Plan is pre-populated. No empty states. |

---

### Success state

User is registered, has a Today's Plan, has watched Mia's first video, and has notifications enabled. `journey.currentPhase = 'onboarding'`. Scheduler is armed for tomorrow morning. Day 1 in `dailyHistory`.

---

## Flow 2 — Quiz/Assessment Entry

**Entry:** Google organic search for a quiz or assessment (e.g., "sleep quality test", "am I overweight quiz")  
**Trigger:** User arrives at `/[lang]/assessment/[cluster]` directly

---

### Steps

| # | Step | What user sees | What user feels | What Mia does | System records |
|---|------|---------------|-----------------|---------------|----------------|
| 1 | **Assessment page** | Multi-step quiz. Clean, one question per screen. Progress bar. 5–12 questions depending on cluster (sleep, weight, fitness). | Task focus. "Let me find out where I stand." | Silent. Assessment engine (`src/lib/assessment/`) runs the questionnaire. | `journey.completedSteps` += `'assessment_started'`. `journey.activeCluster` set. |
| 2 | **Assessment result** | Score revealed with a visual gauge. Cluster-specific label (e.g., "Your sleep quality: 38/100 — Needs attention"). Contextual text about what the score means. | Surprise or recognition. The score is concrete. | Mia's presence appears below the score: "I've reviewed your results. I want to show you what this means for you specifically." | `assessments.items` += full assessment entry with `confidence: 'established'` (more questions = higher confidence than calculator). |
| 3 | **Mia introduces herself** | Mia's intro section. Avatar + short text + CTA: "Watch Mia's message." | Curiosity. Slightly more investment than Flow 1 because they completed the quiz. | HeyGen video queued. Script references their specific score. `insight` variant selected based on score range. | `coachMemory.facts` += `'user_entered_from_assessment'`. |
| 4 | **Mia Video** | 30–50 second video. Script: Opening + Score-specific insight + Hook. | If video lands: "She actually understands what a score of 38 means." Emotional connection stronger than Flow 1 because the data is deeper. | Same as Flow 1 Step 5 but script is richer. Mia can say "A sleep score of 38 puts you in a pattern I see often — and it's not about willpower." | Variant IDs logged. `dailyHistory.entries[today].morningVideoWatched = true`. |
| 5 | **Coach Quiz** | 3 follow-up questions (not 5 — assessment already captured most data). Focus: goal, timeline, one main obstacle. | Quick. "She already knows a lot about me." | Questions are lighter because assessment gave context. Questions framed: "One more thing I need to know." | `goals.items` += stated goal. `habits` updated. |
| 6 | **Today's Plan** (FREE) | Day 1 plan. More specific than Flow 1 because assessment data is richer. Sleep cluster example: "Tonight: set your room to 18°C. No screen 30 min before bed. Try the 4-7-8 breathing." | "This is actually tailored to me." Specificity creates belief. | Plan uses assessment confidence level to generate more precise recommendations. `buildDefaultTasks()` selects from `taskCategories` weighted by score gaps. | Same as Flow 1 Step 7. |
| 7 | **Registration Gate** | Same as Flow 1 Step 8. | Higher conversion expected here — deeper investment from completing assessment. | Mia's gate message references assessment score: "Your plan adapts based on how your sleep score changes. Register to track it." | Same writes. |
| 8 | **Dashboard** | Same as Flow 1 Step 10. | | | |

---

### Decision points

**Free vs. Paid gate:** Same position as Flow 1 (after Today's Plan).

**Assessment confidence → plan depth:**
- `preliminary` (from calculator): basic 1–3 tasks
- `established` (from 5–12 question assessment): 3–5 tasks with cluster-specific rationale
- `confirmed` (from multiple sessions): full 7-day plan, multi-metric tracking

---

### Exit risks and prevention

| Risk | Where it happens | How Mia prevents it |
|------|-----------------|---------------------|
| Quiz fatigue (too many questions) | Step 1 | Max 12 questions. Progress bar. One question per screen. Mobile-first. |
| Result feels like judgment | Step 2 | Score always paired with context: "38/100 means you're in a pattern that responds well to one specific change." Never just a number. |
| Mia's video feels redundant after quiz | Step 4 | Video references quiz-specific data. Cannot feel like a generic pitch if it names their score. |

---

### Success state

Same as Flow 1: registered user, Today's Plan, first video watched, notifications enabled. Assessment confidence is `established` (higher quality data than Flow 1).

---

## Flow 3 — Planner Entry

**Entry:** User lands directly on a plan page or navigates to `/[lang]/plan/[cluster]`  
**Trigger:** Direct URL, referral link, or internal navigation from a calculator result

---

### Steps

| # | Step | What user sees | What user sees | What Mia does | System records |
|---|------|---------------|-----------------|---------------|----------------|
| 1 | **Planner page** | A structured plan framework. Shows: plan duration (30/90 days), weekly milestone structure, example tasks by category. Blurred detail with "Unlock your plan" CTA. | "I can see the structure but not my specific plan." Creates desire. | Planner page renders with generic plan skeleton (`PlanSkeleton` component). Mia's avatar appears in a sidebar or bottom section. | `journey.completedSteps` += `'planner_viewed'`. |
| 2 | **Mia introduces herself** | Mia's section: "Every plan here is built around your specific data. I need to know a few things about you first." CTA: "Tell Mia about your goal." | Curiosity shifts to intent. "I want my version of this." | Mia's presence is the gatekeeper to the plan — not a generic form. Text is first-person. | `coachMemory.facts` += `'user_entered_from_planner'`. |
| 3 | **Coach Quiz (full, 5 questions)** | Full quiz since no prior assessment data. Questions: goal, current state (self-reported), timeline, biggest obstacle, preferred plan style (aggressive vs. gradual). | Investment. User is filling in their details to get something real. | Quiz collects enough for plan creation without an assessment. `goals`, `habits`, `identity.age` populated if not set. | `goals.items` += goal. `habits.items` += obstacles. `identity.age` if asked. |
| 4 | **Registration Gate (early)** | In Flow 3, registration is required before showing the plan. Framing: "Your personal plan is being built. Create your account to receive it." | Slightly higher friction than Flow 1/2 because the plan isn't shown first. But the promise is clear. | Gate appears before plan reveal (unlike Flows 1/2 where plan is shown first). Rationale: planner users have high intent — they came looking for a plan. | Pending registration state held in `sessionStorage`. |
| 5 | **Today's Plan + Full Plan Preview** | After registration: Today's Plan (Day 1) + blurred 30-day roadmap. CTA: "Upgrade to see full roadmap." | "I have today. I want the rest." | Full plan scaffolding shown with first week visible, subsequent weeks blurred. Premium upsell is immediate but soft. | `journey.currentPhase = 'planning'`. Plan created and stored. |
| 6 | **Dashboard** | Dashboard with plan active. | | | |

---

### Decision points

**Registration gate timing in Flow 3:** Registration required before plan reveal (unlike Flows 1/2). Justification: users entering via Planner page have high intent. They are not browsing — they are seeking a plan. The registration ask is proportionate to their intent signal.

**Paywall position:**
- Free: Today's plan (Day 1, 1–3 tasks), week 1 blurred preview
- Paid: Full 30/90-day plan, all weeks, weekly adaptation, daily Mia videos

---

### Exit risks and prevention

| Risk | Where | Prevention |
|------|-------|-----------|
| Plan skeleton looks too generic | Step 1 | Show real milestone labels: "Week 1: Establish baseline. Week 2: First measurable result." Not lorem ipsum. |
| Registration before plan kills motivation | Step 4 | Frame registration as "Your plan is being built" — active process, not a wall. |

---

### Success state

Registered user with a 30-day plan scaffolded. Dashboard active. Day 1 tasks available. Premium upsell visible but not forced.

---

## Flow 4 — Daily Return (Registered User)

**The Core Loop.** This is the flow that retains users and generates compounding value. Everything before this flow is acquisition. This flow is the product.

**Entry:** Morning notification, email, or direct app visit  
**Trigger:** `SchedulerEngine` fires at user's preferred morning time (default: 07:30 local). Trigger type: `'morning'`.

---

### Steps

| # | Step | What user sees | What user feels | What Mia does | System records |
|---|------|---------------|-----------------|---------------|----------------|
| 1 | **Morning notification** | Push notification (if enabled): personalized headline. Example: "Day 4 — your momentum is building, [name]." Or: "Good morning. Your focus task is ready." Max 1 per day. | Gentle pull. "Something specific is waiting for me." Not generic. Not alarming. | `SchedulerEngine` fires `ScheduleTrigger{type: 'morning'}`. `RetentionEngine` confirms user is not dormant before sending. Notification content is variant-tested (`hook_daily_coach_A` etc.). | `retention.lastReminderFiredAt` updated. `retention.daysSinceActive` reset to 0 on app open. |
| 2 | **Dashboard / Mia morning video** | Dashboard opens to today's Mia video (already generated, not loading). Title above video: "Good morning, [name] — Day [N]." Video is ready because it was generated the previous evening. | Warmth. Routine forming. "Mia was waiting for me." | Morning video: structure is `['greeting_with_name', 'data_reference', 'todays_task', 'hook']`. Max 60 seconds. References yesterday's check-in data if available. `CoachBrain.analyze()` determined script type the previous evening. | `dailyHistory.entries[today].morningVideoWatched = true`. `dailyHistory.entries[today].videoWatchDuration` updated via watch-time tracking. |
| 3 | **Today's Plan** | Below the video: Today's Plan. 1 primary task (FREE) or 1–3 tasks (PAID). Each task: what, why, how long. Completion checkbox. | Clarity + purpose. "I know exactly what to do today." | `CoachPlannerImpl.getTodaysTasks()` returns tasks for today's date. Tasks are specific to cluster and phase. Day N tasks build on Day N-1 completion data. | `dailyHistory.entries[today].tasksAssigned` = task IDs. |
| 4 | **User does task(s)** | Checkbox(es) in the app. Tap to mark complete. Optional: short note field. | Achievement. Small wins compound. | System listens for task completion events. `CoachPlannerImpl.completeTask()` called. If all tasks complete before evening: optional "bonus task" unlocked (Pro). | `dailyHistory.entries[today].tasksCompleted` += completed task IDs. `journey.progress` updated. |
| 5 | **Evening notification** | Push at user's preferred evening time (default: 20:00 local). Content: "How did today go, [name]? 2 questions — takes 60 seconds." | Low-stakes invitation. Not judgment. | `SchedulerEngine` fires `ScheduleTrigger{type: 'evening'}`. Check-in framed as reflection, not accountability. | `retention.lastReminderFiredAt` updated. |
| 6 | **Evening Check-in** | Two core questions: (1) Mood rating 1–5 (emoji scale). (2) "Did you do your task?" (Yes / Partially / No — I'll explain). Optional: free-text note. Max 60 seconds to complete. | Reflection without pressure. "Mia asked. I answered. Done." | Check-in renders as `CheckInModal`. Questions are phrased per Mia's voice (see Coach Communication System). No judgment on "No" answer. | `CoachBrain.recordCheckIn()` called. `dailyHistory.entries[today].eveningCheckinDone = true`. `moodValue`, `energyValue` written. `tasksCompleted` updated. |
| 7 | **Evening Review** | Brief result: "Thanks, [name]. I've noted everything." If mood ≥ 4 and tasks done: "Strong day. Tomorrow I'll push you a little further." If mood ≤ 2 or tasks missed: "Noted. Tomorrow's plan will adapt." | Closure. The loop is complete. | `DecisionEngine.evaluate()` runs against today's new data. Tomorrow's script type is determined now. `CoachBrain.checkIntervention()` evaluates if pattern needs intervention. | `coachMemory.facts` updated with session summary. Tomorrow's video generation queued if today's check-in is complete. |
| 8 | **Tomorrow's video is personalized** | User never sees this happening. | Nothing — this is background work. | `ScriptBuilder` assembles tomorrow's script using: today's mood value, tasks completed, streak count, `toneByPhase` config, and highest-priority `DecisionRule` fired. HeyGen API call queued. | `coachMemory.facts` += `{text: 'tomorrows_video_queued', ...}`. Video ready before morning notification fires. |

---

### Decision points

**Free vs. Paid in daily loop:**
- Free: 1 task/day, morning video (1/day), evening check-in
- Paid: 1–3 tasks/day, morning + optional mid-day video, full check-in with note, weekly review, plan adaptation

**Weekday vs. weekend:**
`ScheduleEntry.weekendMode` governs behavior:
- `'same'`: same cadence 7 days/week
- `'lighter'`: 1 task on weekends, shorter video, no evening push
- `'off'`: no automated messages on weekends (user still has access)

---

### Exit risks and prevention

| Risk | Where | Prevention |
|------|-------|-----------|
| Video not ready when user opens app | Step 2 | Videos generated the night before. Fallback text renders instantly if HeyGen fails. Never show a loading state for >3 seconds. |
| Today's Plan feels stale (same tasks as yesterday) | Step 3 | `getTodaysTasks()` checks `date` field — tasks are date-stamped. If plan has no task for today's date, defaults are generated fresh. |
| User skips evening check-in | Step 5–6 | Notification is soft. Check-in is 2 questions max. "No" is always a valid answer. Missing one check-in has zero punishment — the plan adapts gracefully. |
| User feels surveilled | Step 6 | Check-in is always framed as reflection, not reporting. Mia never says "you didn't do your task." She says "tell me how today went." |

---

### Success state

User completes: morning video watched + today's task(s) done + evening check-in submitted. `dailyHistory.entries[today]` is fully populated. Tomorrow's video is queued. Streak increments.

---

## Flow 5 — Chat Entry

**Entry:** User initiates conversation with Mia via chat interface  
**Trigger:** User types in `LLMChatInterface` component, or taps "Ask Mia" from any screen

---

### Steps

| # | Step | What user sees | What user feels | What Mia does | System records |
|---|------|---------------|-----------------|---------------|----------------|
| 1 | **Chat opens** | Chat interface (`src/components/llm/LLMChatInterface.tsx`). Mia's avatar. Last conversation shown. Input field. Suggested questions if first time. | Accessibility. "I can just ask her." | If first-time chat: Mia opens with a context message: "I already know a lot about you from our sessions. What's on your mind?" | `journey.completedSteps` += `'chat_opened'`. |
| 2 | **User sends message** | User types anything: question, complaint, progress update, doubt. | Vulnerability or curiosity. | `CoachBrain` receives the message. LLM pipeline (`src/app/api/llm/chat/route.ts`) processes with `UserGraph` context injected. `CoachMemoryService` provides summary of user's facts for prompt context. | Message stored in conversation history (`coach.history.ts`). |
| 3 | **Mia responds** | Mia's reply appears. Tailored to user's graph data. References past interactions naturally. No generic responses. | Heard. Connected. If the response is good: "She actually remembered what I said." | Response assembled with: `communicationStyle` preference + `toneByPhase` for current phase + relevant `coachMemory.facts`. Mia may ask one clarifying question back. | `coachMemory.communicationStyle` updated if new pattern detected. |
| 4 | **Planner updated (if applicable)** | If user says "I want to change my goal" or "that task isn't working" — Mia confirms: "I'll update your plan now." Updated plan appears in dashboard. | Control. "I can adjust this." | `CoachPlannerImpl.requestAdaptation()` called with reason `'user_struggling'` or `'goal_changed'`. Plan adapt event dispatched. | `coachMemory.facts` += updated goal or preference. `journey` updated if phase changes. |
| 5 | **Video offered (if context warrants)** | Mia may say: "I have something specific I want to show you. Can I send you a short video?" | Surprise. "She's generating content just for me." | Triggered when: emotional intensity detected, milestone reached, or user is confused about plan. New HeyGen video queued with custom script. | Video variant logged. |
| 6 | **Conversation ends** | Natural close. No forced CTA. | Satisfied. Loop is complete. | Mia does not push for a conclusion. If user goes quiet, Mia does not send a follow-up for 2+ hours. | Conversation summary written to `coachMemory.facts`. |

---

### Decision points

**When Mia offers a video vs. text-only response:**
- Text-only: simple questions, quick updates, routine check
- Video offered: user expresses doubt ("I'm not sure this is working"), emotional statement ("I've been feeling awful"), or major milestone ("I hit my first goal!")
- Video: always opt-in ("Can I send you a short video?"), never auto-played

**Chat during automated message periods:**
Per Channel Coordination Rules: when a live chat conversation is active, all automated push notifications are paused for 2 hours. The user is in a live interaction — automated messages would break presence.

---

### Exit risks and prevention

| Risk | Where | Prevention |
|------|-------|-----------|
| Mia's response feels generic (LLM drift) | Step 3 | `UserGraph` summary is always injected in system prompt. Mia must reference at least one piece of user-specific data per response. |
| User asks something Mia cannot answer (medical) | Step 3 | Safety rules in `MIA_PERSONA_CONFIG.safetyRules` define `neverMentionTopics` and `escalateToHuman`. Response redirects gracefully: "That's something worth discussing with a doctor. What I can help with is..." |
| Chat becomes overwhelming | Step 3–6 | Mia asks one question at a time. Never sends more than 3 messages without a user response. |

---

### Success state

User gets a meaningful, personalized response. If goal/plan updated: dashboard reflects the change within 60 seconds. Memory updated so tomorrow's video references the conversation.

---

## Flow 6 — Re-engagement (User Went Silent)

**Entry:** User has not opened the app or responded to notifications for 2+ days  
**Trigger:** `RetentionEngine` detects dormancy. `DormancyLevel` escalates: `none → mild → moderate → severe → critical`.

---

### Dormancy threshold table

| Days inactive | DormancyLevel | Intervention type | Who triggers |
|---------------|--------------|-------------------|-------------|
| 0–1 | `none` | No action | — |
| 2 | `mild` | Soft push notification | RetentionEngine rule `coach_reminder` |
| 3 | `moderate` | Personal message from Mia + video offer | RetentionEngine rule `journey_reminder` |
| 5–6 | `severe` | Re-engagement video (L2 intervention) | CoachBrain `missed_checkin_3days` rule |
| 7+ | `critical` | L3 or L4 intervention video + email | Escalation chain |

---

### Steps

| # | Step | What user sees | What user feels | What Mia does | System records |
|---|------|---------------|-----------------|---------------|----------------|
| 1 | **No activity 2 days** | Nothing (user is inactive). | — | `RetentionEngine.detect()` identifies `DormancyLevel: 'mild'`. Cooldown check: was a reminder sent in last 2 days? If not, proceed. | `retention.daysSinceActive` = 2. `retention.dormancyLevel = 'mild'`. |
| 2 | **Day 2: Soft push notification** | "Hey [name] — I have something for you today." No guilt. No "you missed a day." | Neutral pull. Low pressure. | Notification content: `hook_daily_coach_A` or similar variant. Timed to user's last-active time of day (not morning if they were an evening user). | `retention.lastReminderFiredAt` updated. Cooldown set: no further push for 24h. |
| 3 | **Day 3: Mia notices** | If user hasn't returned: Mia sends a personal message (via preferred channel — push or email). Message references specific context: "I noticed you haven't checked in. Your [goal] plan is still here." | Surprised. "She noticed." The personalization hook is the key — it's not a generic "come back!" | `RetentionEngine` generates `RetentionSuggestion{action: 'journey_reminder'}`. Copy references `goals.items[0].text`. Video offer included: "I have a 30-second message for you." | `retention.lastReminderFiredAt` updated. |
| 4 | **User returns** | App opens to a modified dashboard. Mia's re-entry message: "Welcome back. Let's not start over — let's pick up." Today's plan is adjusted for re-entry (easier tasks). | Relief. "I don't have to start from zero." | `CoachBrain.checkIntervention()` evaluates context. `consecutiveMissedDays(graph)` determines intervention level (L1, L2, or L3). Plan adjusted via `requestAdaptation('user_struggling')`. | `retention.daysSinceActive = 0`. `retention.dormancyLevel = 'none'`. `journey.progress` updated. |
| 5 | **Re-engagement video** | Mia video plays (if user opens app within notification). Script: L1 or L2 intervention template from `videoTemplates.intervention`. L1: "Hey. You missed a day — that happens. Come back with one small action today." | Accepted back without shame. | Script chosen based on `consecutiveMissedDays`. L1 (1 day): soft acknowledgment. L2 (3 days): direct check-in + pattern mirror. L3 (7 days): name the pattern, no guilt, rebuild foundation. | Video watched logged. `coachMemory.facts` += `'re_engagement_video_watched'`. |
| 6 | **Plan adjusted** | Simplified Today's Plan: 1 task max. Lower difficulty. "One thing today — that's it." | Achievable. "I can do this." | `buildDefaultTasks()` returns 1 task from primary category. No pressure to catch up. | `dailyHistory.entries[today].tasksAssigned` = 1 task. |

---

### Decision points

**Escalation chain:**
- L1: push notification only
- L2: push + in-app message (no email)
- L3: push + email (per Email channel rules: max 1/week)
- L4: email with video link (HeyGen video hosted and linked in email)
- L5 (critical, 14+ days): Open door message — no pressure, no obligation

**Anti-spam rules:**
- No more than 1 push notification per day
- No email + push on same day
- After L5, no automated messages. Wait for user-initiated return.

---

### Exit risks and prevention

| Risk | Where | Prevention |
|------|-------|-----------|
| Re-engagement message feels guilt-inducing | Step 3 | Mia never says "you missed" or "you haven't been" or "you're falling behind." She says "I noticed" and "your plan is still here." |
| User returns, sees complexity, leaves again | Step 4 | Re-entry dashboard is simplified. Streak is reset but shown as "Day 1 of your return journey." Not as a failure. |
| Too many notifications push user away | Steps 2–3 | Cooldown system enforced by `retention.lastReminderFiredAt`. Escalation waits full intervals. |

---

### Success state

User returns to app, watches re-engagement video, completes 1 task. `retention.dormancyLevel = 'none'`. Evening check-in that night. Streak restarts.

---

## Flow 7 — Goal Achievement

**Entry:** User completes a goal (e.g., reaches target weight, completes 30-day plan)  
**Trigger:** `CoachPlannerImpl.completeTask()` detects all tasks in final milestone completed, or `plan.status = 'completed'`

---

### Steps

| # | Step | What user sees | What user feels | What Mia does | System records |
|---|------|---------------|-----------------|---------------|----------------|
| 1 | **Milestone reached** | In-app notification (not push): "Milestone reached — [specific achievement]." Animation. Not generic confetti — contextual celebration. | Surprise + validation. "This is real." | `CoachBrain` fires `CoachTrigger: 'plan:milestone_reached'`. Reason: `'milestone_reached'`. Priority: `high`. Celebration video queued. | `journey.completedSteps` += milestone ID. `journey.progress` = milestone %. |
| 2 | **Celebration video** | Mia's celebration video. Template: `videoTemplates.celebration`. Structure: `['precise_acknowledgment', 'connect_to_stated_goal', 'raise_bar_slightly', 'hook']`. 55 seconds. | Pride. "She remembered exactly what I said I wanted." | Mia references the original stated goal verbatim (`goals.items[0].text`). "You said you wanted to [goal]. Today you did it." Script uses real numbers. | Video watched logged. |
| 3 | **Achievement screen** | Achievement card: what they achieved, how long it took, key stats. Share button. Certificate (premium). | Ownership. Optional external validation (share). | Screen shows `journey.progress` data, `dailyHistory` streak, key metrics. | `goals.items[0].status = 'completed'`. `assessments` confidence may update. |
| 4 | **Next goal proposal** | Mia proposes next goal: "Here's what I think you're ready for." One specific next step. Not a menu of options — a recommendation. | Direction. "She's already thinking about what's next." | `CoachBrain.analyze()` fires with `reason: 'goal_achieved'`. Decision engine evaluates: what's the logical next cluster or goal? Next goal framed as continuation, not restart. | `goals.items` += proposed next goal (status: `'active'`, priority: `'medium'`, confidence: `'inferred'`). |
| 5 | **User confirms or adjusts** | "Yes, let's do this" or "I want something different." If adjusting: 2-question mini-quiz. | Agency. User feels in control of the direction. | If confirmed: new plan created. If adjusted: `requestAdaptation('goal_changed')` fired. | `journey.currentPhase` advances or stays. New plan scaffolded. |
| 6 | **Continuation** | Dashboard shows new goal with fresh plan. Streak continues (not reset). | Momentum. The loop never breaks. | Today's plan generated for new goal. Morning video script includes acknowledgment of previous achievement. | New plan stored. Previous goal archived in `goals.items` with `status: 'completed'`. |

---

### Decision points

**What triggers "goal achieved":**
- All tasks in the final week of a CoachPlan completed
- OR user explicitly marks goal as done in chat ("I did it!")
- OR specific metric threshold reached (e.g., weight target hit — detected via user-reported data in check-in)

**What Mia proposes next:**
- Same cluster, higher target: "You lost 5kg. Ready to lose 3 more?"
- Adjacent cluster: "With your weight progress, sleep quality is the next lever."
- Maintenance mode: "You've hit your goal. Now let's build a maintenance routine."

Decision is made by `DecisionEngine` evaluating `assessments.items` for lowest-scoring adjacent cluster.

---

### Exit risks and prevention

| Risk | Where | Prevention |
|------|-------|-----------|
| Celebration feels hollow | Step 2 | Mia must reference specific data. "You hit 78kg — you started at 85." Never "Great job!" without specifics. |
| User has no idea what to do next | Step 4 | Mia always proposes the next step. No empty state after goal achievement. |
| Streak break at goal transition | Step 6 | Streak continues. "Day 32 of coaching" not "Day 1 of new goal." The number compounds. |

---

### Success state

Goal archived as `completed`. New goal proposed and accepted. New plan created. Streak continues. User is back in Flow 4 (Daily Return) the next morning.

---

## Emotion Map

The following table tracks the dominant user emotion at each major touchpoint across all flows. Mia's job is to match, then guide — never skip emotional states.

| Touchpoint | Dominant emotion | Risk emotion | Mia's role |
|-----------|-----------------|-------------|-----------|
| First calculator result | Mild shock / recognition | Shame (if number is bad) | Normalize the number as a starting point, not a verdict |
| First video plays | Curiosity / skepticism | "This is just a bot" | Be specific — reference their exact number |
| Coach quiz | Engagement | Quiz fatigue | Max 5 questions, conversational framing |
| Today's Plan first view | Relief + anticipation | "These tasks are too vague" | Specificity is everything — tasks must name the cluster |
| Registration gate | Desire | "I don't want to sign up" | Soft wall. Show what's behind it, not what's blocking them |
| Day 1 dashboard | Ownership | Overwhelm | Pre-populated. No empty states. One focus task visible. |
| Morning notification (Day 2+) | Routine pull | "Another notification" | Content is never generic. Names the streak or specific data. |
| Morning video (Day 3+) | Warmth + recognition | Boredom (if same every day) | Script type rotates based on decision rules. |
| Evening check-in | Reflection | Judgment anxiety | 2 questions max. "No" is always valid. |
| Missed day (Day 2 dormant) | Guilt (user-generated) | Abandonment | Mia does not add to guilt. "Your plan is still here." |
| Re-engagement video | Surprise ("she noticed") | Commitment fatigue | Gentle hook to the original goal. |
| Milestone celebration | Pride | Anti-climax | Specificity. Connect back to what they said they wanted. |
| Goal complete | Accomplishment | "Now what?" | Immediate next proposal. No pause. |

---

## UserGraph Touchpoints

What gets written to UserGraph at each major step, across all flows:

| Event | Node written | Field written | Value |
|-------|-------------|--------------|-------|
| Calculator completed | `assessments` | `items[]` | `{clusterId, score, confidence: 'preliminary', assessedAt}` |
| Assessment completed | `assessments` | `items[]` | `{clusterId, score, confidence: 'established', assessedAt}` |
| JourneyExperience viewed | `journey` | `completedSteps` | += `'journey_section_viewed'` |
| First video watched | `dailyHistory` | `entries[today].morningVideoWatched` | `true` |
| Video watch duration | `dailyHistory` | `entries[today].videoWatchDuration` | seconds (integer) |
| Coach quiz answered | `goals` | `items[]` | `{id, text, status: 'active', priority: 'high', addedAt}` |
| Coach quiz answered | `habits` | `items[]` | `{id, name, frequency, sentiment}` |
| Today's Plan created | `journey` | `currentPhase` | `'onboarding'` |
| Today's Plan created | `coachMemory` | `facts[]` | `{id: 'active_coach_plan', text: JSON, category: 'fact'}` |
| Tasks assigned | `dailyHistory` | `entries[today].tasksAssigned` | `[taskId, ...]` |
| Task completed | `dailyHistory` | `entries[today].tasksCompleted` | `[taskId, ...]` |
| Registration | `identity` | `name`, `userType` | name string, `'authenticated'` |
| Notifications consent | `preferences` | `notificationsEnabled` | `true` / `false` |
| Evening check-in | `dailyHistory` | `entries[today].eveningCheckinDone` | `true` |
| Mood recorded | `dailyHistory` | `entries[today].moodValue` | 1–5 |
| Energy recorded | `dailyHistory` | `entries[today].energyValue` | 1–5 |
| Re-engagement detected | `retention` | `daysSinceActive`, `dormancyLevel` | integer, level string |
| Reminder sent | `retention` | `lastReminderFiredAt` | ISO timestamp |
| Goal completed | `goals` | `items[0].status` | `'completed'` |
| Coach memory fact added | `coachMemory` | `facts[]` | `{id, text, category, importance, addedAt}` |
| Communication style inferred | `coachMemory` | `communicationStyle` | `'direct'` / `'supportive'` / `'analytical'` |
| Plan adapt requested | `coachMemory` | `facts[]` | `{id: 'active_coach_plan', text: updatedJSON}` |

---

## Free vs. Paid Boundary

Exact paywall positions for each flow:

| Flow | Free includes | Paid (Pro) unlocks | Gate appears |
|------|--------------|-------------------|-------------|
| Flow 1 (Calculator) | Result, first video, Coach quiz, Today's Plan (Day 1, 1 task) | Daily videos, full plan, chat, evening check-in, multi-cluster | After Today's Plan is shown (Step 8) |
| Flow 2 (Assessment) | Assessment result, first video, Coach quiz, Today's Plan (Day 1) | Same as Flow 1 + higher-fidelity plan from assessment data | After Today's Plan (Step 7) |
| Flow 3 (Planner) | Day 1 tasks, Week 1 blurred preview | Full 30/90-day plan, weekly adaptation | Before plan reveal (Step 4) — requires registration |
| Flow 4 (Daily Return) | 1 morning task, 1 daily video, basic check-in | 1–3 tasks, mid-day video, full check-in with notes, weekly review | Visible on dashboard (soft upsell, not wall) |
| Flow 5 (Chat) | 3 messages/day | Unlimited chat, plan updates from chat, video generation from chat | After 3rd message |
| Flow 6 (Re-engagement) | Re-engagement video, simplified plan | All daily loop features | Same as daily loop |
| Flow 7 (Goal Achievement) | Milestone notification, celebration video | Certificate, share card, detailed achievement report | Soft on achievement screen |

**Premium pricing:**
- Free: localStorage, no registration required
- Pro: $9.99/month or $79.99/year (from `SUBSCRIPTION_PLANS`)
- Enterprise: $29.99/month (teams, priority support)

---

## The Core Loop

The loop that retains users long-term. Fires daily for registered, active users.

```
+------------------+
|  MORNING TRIGGER |  (SchedulerEngine, 07:30 local)
+--------+---------+
         |
         v
+------------------+
| MORNING VIDEO    |  (HeyGen, personalized, <60s)
| - greeting       |  Script assembled night before
| - data reference |  from yesterday's check-in
| - today's task   |
| - hook           |
+--------+---------+
         |
         v
+------------------+
| TODAY'S PLAN     |  (CoachPlannerImpl.getTodaysTasks)
| - 1 primary task |  Date-stamped, cluster-specific
| - context: why   |  Difficulty adjusted by phase
| - time estimate  |
+--------+---------+
         |
         v
+------------------+
| USER DOES TASK   |  (in real life)
| [completeTask()] |  Checkbox in app
+--------+---------+
         |
         v
+------------------+
| EVENING TRIGGER  |  (SchedulerEngine, 20:00 local)
+--------+---------+
         |
         v
+------------------+
| EVENING CHECK-IN |  (CheckInModal, 2 questions)
| - mood: 1-5      |  CoachBrain.recordCheckIn()
| - task done?     |  DailyHistoryNode updated
+--------+---------+
         |
         v
+------------------+
| DECISION ENGINE  |  (overnight, invisible)
| - evaluate rules |  DecisionEngine.evaluate(graph)
| - set script type|  Highest-priority rule wins
| - queue tomorrow |  HeyGen call made
+--------+---------+
         |
         v
[Loop restarts next morning]
```

**What makes the loop compound:**

1. Each morning video references yesterday's check-in data → user feels remembered
2. Each task is dated and builds on the previous → plan is not static
3. Decision rules escalate through phases (`onboarding → firstWeek → firstMonth → transformation → partnership`) → content complexity grows with the user
4. `toneByPhase` shifts Mia's voice over time → the relationship deepens organically
5. Milestones trigger celebration videos → emotional peaks reset motivation

**What breaks the loop (and how to prevent it):**

| Break point | Signal | Response |
|------------|--------|---------|
| Morning video not watched | `morningVideoWatched = false` by noon | Evening check-in still fires. No double-notification. |
| Task not completed | `tasksCompleted.length = 0` at check-in | Evening check-in asks "What got in the way?" No guilt messaging. |
| Check-in not submitted | `eveningCheckinDone = false` by midnight | Next day: morning video acknowledges gap. "Yesterday I didn't hear from you — that's fine. Let's look at today." |
| 3 consecutive misses | `consecutiveMissedDays >= 3` | `CoachBrain.checkIntervention()` returns L1 intervention. Simplified plan for tomorrow. |

---

## Appendix A: Flow Entry Point Matrix

| Entry URL | Flow | Primary intent | Mia entry moment |
|-----------|------|----------------|-----------------|
| `/[lang]/calculators/[slug]` | Flow 1 | Check numbers | After result, JourneyExperience section |
| `/[lang]/assessment/[cluster]` | Flow 2 | Self-assess | After assessment result |
| `/[lang]/plan/[cluster]` | Flow 3 | Get a plan | On Planner page, before plan shown |
| `/[lang]/dashboard` | Flow 4 (return) | Daily ritual | Morning video is hero element |
| `/[lang]/dashboard` (chat) | Flow 5 | Ask something | Chat interface opens |
| Notification → `/[lang]/dashboard` | Flow 6 | Re-engagement | Re-entry dashboard |
| `/[lang]/dashboard` (milestone) | Flow 7 | Celebrate | Milestone notification → celebration screen |

---

## Appendix B: System Events Reference

Key events emitted during flows, for engineering reference:

| Event | Emitted by | Consumed by |
|-------|-----------|------------|
| `coach:decision_made` | `CoachBrain.analyze()` | Analytics, UI, EventBus |
| `coach:plan_adapt` | `CoachPlannerImpl.dispatchPlanAdapt()` | P48 pipeline handler → `PlannerEngine.adapt()` |
| `coach:plan_changed` | P48 handler | Dashboard, Plan components |
| `ScheduleTrigger{type:'morning'}` | `SchedulerEngine` | Video generation pipeline, push notification |
| `ScheduleTrigger{type:'evening'}` | `SchedulerEngine` | CheckIn modal trigger, push notification |
| `RetentionSuggestion` | `RetentionEngine` | Notification provider, email provider |
