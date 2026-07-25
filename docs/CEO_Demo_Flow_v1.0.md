# CEO Demo Flow v1.0
## SolviqLab Coach Platform — Mia

**Document type:** Product Specification  
**Version:** 1.0  
**Date:** 2026-07-25  
**Status:** Foundational — the single most important product narrative  
**Author:** Product Architecture  
**Test:** After reading this, the CEO must think "I would buy this."

---

## The Test

This document describes one complete user journey — from Google search to premium subscription — in enough detail that any stakeholder can visualize every screen, understand every emotion, and identify every gap between the current product and the ideal product.

If you finish reading this and do not feel the pull to complete Andrey's journey, the product is not ready to ship.

---

## Persona: Andrey

**Age:** 34  
**Occupation:** Office worker, project manager at a logistics company  
**Physical situation:** BMI 27.3 (detected "overweight" zone). Has held this weight for 3 years. Not obese, not urgent — but quietly uncomfortable.  
**Goal:** Lose 8kg. Has tried 3 times. Always gave up after 2 weeks.  
**Pattern of failure:** He starts with willpower (cuts carbs, goes to gym). Willpower depletes by week 2. Misses one day, feels guilty, misses more days, stops entirely.  
**Emotional state about health apps:** Skeptical bordering on cynical. "They're all the same."  
**Language:** Russian native, but we demo in English. He reads English comfortably.  
**Discovery path:** Google search at 10:47 PM, after dinner, lying in bed.

---

## Step 1: Google Search → Clicks Result

**URL:** Google search results  
**User action:** Types "how to lose weight calculator" into Google. Sees the SolviqLab result. It's not the first result — it's third, but the description mentions "personalized analysis" rather than just "enter your height and weight." He clicks.

**What he sees:** Google SERP. SolviqLab result shows: `solviqlab.com/en/calculators/bmi-calculator` with meta description: "Find out your BMI and get a personalized analysis — not just a number."

**What he feels:** Mild curiosity. He's used BMI calculators before. He knows his BMI is 27. He clicks anyway because "personalized" caught his eye.

**What Mia does:** Nothing. Mia is silent. The system does not exist yet for Andrey.

**System:** No UserGraph. Session begins. `anonymous_visitor` state.

**Key copy:** "personalized analysis — not just a number" (meta description)

**Time on screen:** 2 seconds before clicking

**Risk:** Nothing about this step is controlled by the product. The risk is that the meta description is generic or keyword-stuffed. If the description says "BMI calculator — free online tool," he does not click.

**Why he stays:** The meta description promises something different from a number. That promise must be kept on the next screen.

**Screenshot description:** Standard Google SERP. SolviqLab result has a clean URL, the title "BMI Calculator — Personalized Analysis | SolviqLab," and a meta description that focuses on what the user gets (analysis), not what the tool does (calculates).

**Gap vs. world-class:** A world-class product would have structured data / rich snippets showing a preview of the tool in Google itself. Not implemented yet. Low priority but meaningful.

---

## Step 2: Lands on BMI Calculator Page

**URL:** `/en/calculators/bmi-calculator`  
**User action:** Page loads. Andrey reads the headline and immediately looks for the calculator form.

**What he sees:**  
- Clean page. No pop-ups. No cookie banners (or cookie banner is minimal and dismissible in one click).
- Headline: "BMI Calculator" — direct, not clever. He's task-focused; cleverness would irritate him.
- Subheadline: "Find out where you stand — and what it means for your health." (Promise of interpretation, not just calculation.)
- Calculator form: Height (cm or ft/in toggle), Weight (kg or lbs toggle), optional Age field.
- "Calculate" button. Primary blue. Clearly the one action on the page.
- Below the fold: brief explanation of BMI — but Andrey doesn't scroll there yet.

**What he feels:** Relieved that the page is clean and fast. He's seen too many health calculator sites with 14 ads and a "CONGRATULATIONS, YOU'VE BEEN SELECTED" banner. This page is professional.

**What Mia does:** Silent. No mention of Mia yet.

**System:** Page loads. No graph writes. `anonymous_visitor` state continues.

**Key copy:** "Find out where you stand — and what it means for your health." (The "what it means" is the promise that separates this from a basic calculator.)

**Time on screen:** 20–40 seconds (reading headline, filling in form)

**Risk:** Page load time > 2 seconds → Andrey leaves. He's on mobile (lying in bed). LCP must be under 1.5 seconds.

**Why he stays:** The page is fast, clean, and the form is immediately visible — no scrolling to find the calculator.

**Screenshot description:** Full-width hero with a centered calculator card. White background. Two input fields (height, weight) with unit toggles. Optional age field. Prominent "Calculate" CTA. No sidebar, no ads, no related articles visible above the fold.

**Gap vs. world-class:** A world-class product would pre-detect the user's locale and set metric/imperial units automatically, removing the toggle decision. Not implemented — currently requires manual toggle. Small but measurable friction.

---

## Step 3: Enters Data, Clicks Calculate

**URL:** `/en/calculators/bmi-calculator` (same page)  
**User action:** Andrey enters: Height 178 cm, Weight 86.5 kg, Age 34 (optional, he fills it in). Clicks "Calculate."

**What he sees:** Nothing yet — the calculation takes < 200ms. The result is about to appear.

**What he feels:** Habit-formed anticipation from past BMI calculators. He already knows the number will be around 27. He expects a number in a box.

**What Mia does:** Silent. EventBus will fire after result renders.

**System:** Calculator engine computes: BMI = 86.5 / (1.78²) = 27.3. `ResultEvent` dispatched: `{ slug: 'bmi-calculator', value: 27.3, label: 'Overweight', category: 'overweight', miaFact: 'BMI 27.3 — Overweight' }`. EventBus pipeline begins: P10 UserEngine initializes UserGraph with `userId`. P20 ProfileEngine writes preliminary assessment. P80 AnalyticsEngine sends GA4 event.

**Key copy:** Not applicable — this is a form interaction, not a reading moment.

**Time on screen:** 5–10 seconds (entering data)

**Risk:** Form validation that fires on blur (before submit) is irritating. Validation must fire on submit, not on individual field blur.

**Why he stays:** He submitted the form. He's waiting for his number.

**Screenshot description:** Same calculator card. Fields are filled. "Calculate" button is active. No other interaction.

**Gap vs. world-class:** A world-class product would offer voice input or camera-based height detection. Not realistic at this stage. Acceptable gap.

---

## Step 4: Sees Result + JourneyExperience Appears

**URL:** `/en/calculators/bmi-calculator` (result renders below form or replaces form)  
**User action:** Sees result. Reads it.

**What he sees:**
- BMI result card: Large number "27.3" in center. Below it: "Overweight" in amber/orange color. Not alarming red — context-appropriate amber.
- A brief interpretation paragraph (2–3 sentences): "A BMI of 27.3 puts you in the 'Overweight' category. This typically means a higher risk of joint stress, cardiovascular strain, and energy fluctuations. For most people in this range, 5–8kg of reduction produces measurable health improvements."
- A visual scale (horizontal bar) showing where 27.3 falls relative to the BMI ranges. His position is marked.
- Below the result card: JourneyExperience component slides in. Mia's card appears.

**The JourneyExperience card contains:**
- Mia's avatar (photo quality, professional — not a cartoon)
- Headline: "Mia has reviewed your results"
- Sub-copy: "Based on your BMI of 27.3 and age 34, Mia has identified your most effective starting point. It's not what most people expect."
- CTA button: "See Mia's Analysis" (not "Meet Mia" — frame the output, not the action)

**What he feels:** The number he expected. But the interpretation is different from what he's seen before. "5–8kg produces measurable improvements" — this is specific. It's his number. And then he sees the JourneyExperience card. The copy — "it's not what most people expect" — activates curiosity before skepticism can settle.

**What Mia does:** Mia's card contains a system-generated preview of what she would say, based on his BMI. Not video yet — just the card that introduces her.

**System:** `calculator_completed` event fired. `mia_fact_stored` event fired (miaFact written to `coachMemory.facts`). JourneyExperience component renders with the `miaFact` as context. State: `calculator_user`.

**Key copy:** "It's not what most people expect." (Creates curiosity gap that overrides skepticism.)

**Time on screen:** 60–90 seconds (reading result, reading interpretation, reading Mia's card)

**Risk:** If the interpretation paragraph is generic ("BMI is a measure of...") rather than specific to his result, he disengages here. The interpretation must reference his exact number.

**Why he stays:** The JourneyExperience card promises a specific insight — "not what most people expect." Andrey's pattern of failure is that he always does what he expects (diet + gym). This copy targets his core frustration.

**Screenshot description:** Two-section layout. Top: result card with large "27.3" number, "Overweight" label in amber, horizontal BMI scale with marker at his position, 3-sentence interpretation. Bottom: JourneyExperience card with Mia avatar, headline, and CTA. Subtle separator between result and Mia card. No clutter.

**Gap vs. world-class:** A world-class product would show a 3-month projection here: "At a moderate pace, you could reach 79.5kg by October." This requires additional user input (goal date) but massively increases engagement. Not implemented yet — significant gap.

---

## Step 5: Mia Intro Screen — "Mia Has Reviewed Your Results"

**URL:** Same page, or modal/slide overlay  
**User action:** Clicks "See Mia's Analysis"

**What he sees:**
- Mia's intro screen — not the video yet. A brief "about Mia" moment:
  - Mia's photo (professional, warm but not stock-photo)
  - Name: "Mia — your personal coach"
  - 2–3 lines about what Mia does: "I analyze your health data and build a daily plan around your specific situation — not a template. I've reviewed your BMI and your age. Here's what I found."
  - A preview of the insight: A blurred or abbreviated version of what Mia will say — enough to be intriguing, not enough to skip the video.
  - Input field for name: "Before I continue, what should I call you?" (Collecting name here, naturally, before video — this will be used in the video script if possible, or in the quiz after video.)
  - CTA: "Continue to Mia's Message"

**What he feels:** Curiosity transitioning into engagement. He typed his name. That's a micro-commitment — psychological research shows micro-commitments increase follow-through. He's slightly more invested than 30 seconds ago.

**What Mia does:** The intro screen is static content. The name input sends `identity.name` to UserGraph via IdentityEngine.

**System:** `identity.name` written to UserGraph (if name entered). `mia_intro_viewed` event fired. State remains `calculator_user` until video is requested.

**Key copy:** "I've reviewed your BMI and your age. Here's what I found." (Uses his specific data. Mia has already "done work" before he's even seen the video.)

**Time on screen:** 30–60 seconds

**Risk:** If the name input feels mandatory and form-like, it generates friction. It must feel like a natural conversational question — placed between Mia's photo and the continue button, styled as a text input with placeholder "Your name..." not a labeled form field.

**Why he stays:** He typed his name. He's now personally addressed in the system. The cost of leaving has increased marginally — a first form of sunk cost that works in the product's favor.

**Screenshot description:** Centered card. Mia's photo (portrait, approx 200x200px, warm smile). Name "Mia" in slightly larger font with "your personal coach" subtitle. Two lines of copy. Name input field. Continue button. Background is slightly dimmed — focus is on Mia.

**Gap vs. world-class:** HeyGen can include the user's name in the video script if it's available before generation. This requires the name collection to happen before the video request, which this screen achieves. A world-class product would also offer to collect the name via voice input on mobile. Not implemented.

---

## Step 6: Clicks "Continue" → Video Generating Screen (1–2 Min Wait)

**URL:** Same page, next step in overlay/modal flow  
**User action:** Clicks "Continue to Mia's Message"

**What he sees:**
- A waiting screen. Not a generic spinner — a purposeful progress indicator.
- Mia's avatar remains visible (continuity — she doesn't disappear during loading).
- Copy: "Mia is reviewing your data and recording your message. This usually takes about 90 seconds."
- A live status display (updates every ~10 seconds):
  - "Reading your BMI result..." → green checkmark
  - "Analyzing your age and health profile..." → green checkmark
  - "Recording your message..." → in progress
- Optional: A brief tip about BMI or health that fills the wait time. Not about Mia — about the user's health topic. Makes the wait feel productive.

**What he feels:** If the wait screen is well-designed: patience and anticipation. "She's actually doing something with my data right now." If the wait screen is a generic spinner: impatience and skepticism. "It's probably just a pre-recorded video."

**What Mia does:** Mia's avatar is animated (subtle idle animation) to convey activity.

**System:** `HeyGenService.generate()` was called after the name input. Script assembled by `ScriptBuilder` using `coachMemory.facts` (BMI: 27.3, label: Overweight, age: 34, name: Andrey). Polling begins for `HeyGenStatusResponse.status === 'completed'`. `mia_video_requested` event fired. State: `video_requested`.

**Key copy:** "Mia is reviewing your data and recording your message." (Not "generating" or "loading" — human framing.)

**Time on screen:** 60–120 seconds

**Risk:** If the wait exceeds 150 seconds, a meaningful percentage of users will abandon. Must show "almost ready" copy at 90 seconds regardless of actual status. If generation fails: show error with option to retry — do NOT show a blank screen.

**Why he stays:** The status indicators show real-time progress. Each checkmark feels like progress. He believes something is being done specifically for him.

**Screenshot description:** Dark or gradient background (creates cinematic sense of "something important is happening"). Mia's avatar centered. Progress indicators below avatar, stepping through 4 stages. Wait time estimate visible. Small health tip in the lower third. No close button visible during this step (but ESC key or back gesture works — do not trap users).

**Gap vs. world-class:** A world-class product would show the user's name in the status copy: "Mia is preparing Andrey's message..." Pre-generating videos for common BMI ranges (using cached scripts) could reduce wait time to <10 seconds for most users. This is a significant product investment worth planning.

---

## Step 7: Mia's Video Plays

**URL:** Same overlay, video player loads  
**User action:** Video player appears and auto-plays (muted first 0.5 seconds to avoid autoplay block, then unmutes if user doesn't stop it).

**What he sees:**
- Full-width video player within the overlay
- Mia appears. She is professional, warm, speaks directly into camera.
- The video script (approximately):
  > "Hi Andrey. I'm Mia.
  >
  > I've been looking at your data. Your BMI is 27.3 — you're in the overweight category, and I want to tell you something about that number that most calculators won't.
  >
  > You're 34. That number has been stable, right? It's not getting dramatically worse. But it's also not going away on its own. The pattern for someone in your situation isn't a crisis — it's friction. Every time you try to change it, something blocks you after 2 weeks.
  >
  > I know that pattern. And I know what actually works for people with your profile. It's not another diet. It's a different sequence.
  >
  > I want to build you a plan that accounts for why the last three attempts didn't work. I have three questions for you — and after you answer them, I'll show you what your first day looks like.
  >
  > Let's start."
- Subtitles are on by default (he's in bed, might have low volume)
- Progress bar at bottom
- No skip button (enforced by player configuration)
- At 80% of video duration: `mia_video_watched` event fires silently

**What he feels:**
- At "Hi Andrey" — mild surprise. His name is in the video. Not "hi there."
- At "I've been looking at your data" — the BMI number mentioned. He's paying attention now.
- At "you're 34. That number has been stable, right?" — this is the moment. He did not tell the calculator his weight history. But this observation is accurate. It feels like Mia actually knows him.
- At "I know why the last three attempts didn't work" — engagement peaks. This is the core promise: she knows his failure pattern.
- By the end: He believes, provisionally, that this might be different.

**What Mia does:** She references his specific data (name, BMI, age). She names his failure pattern without asking him to confirm it — she asserts it as known. This is the most important voice design decision in the product.

**System:** Player `onTimeUpdate` fires. At ≥80%: `mia_video_watched` event dispatched. `dailyHistory.entries[today].morningVideoWatched = true`. `dailyHistory.entries[today].videoWatchDuration = seconds_watched`. State: `video_watched`. Coach Quiz CTA prepared.

**Key copy:** "I know why the last three attempts didn't work. And I know what actually works for people with your profile." (The two most important sentences in the entire product.)

**Time on screen:** 90–120 seconds (video duration)

**Risk:** If Mia's name mention sounds robotic (text-to-speech quality name insertion), the spell breaks. Voice quality is a product requirement, not a nice-to-have. HeyGen voice must be reviewed monthly.

**Why he stays:** He is watching to find out what she says about his failure pattern. She has named something true about him. He needs to hear the answer.

**Screenshot description:** Video player, full-width within overlay. Mia visible from shoulders up. Professional background (office or clean neutral). Subtitles in white text with semi-transparent background at bottom. Progress bar showing elapsed time. No UI chrome visible during playback — immersive experience. After video ends: Quiz CTA slides up from bottom.

**Gap vs. world-class:** A world-class product would generate different video scripts based on assessment cluster — a sleep-focused user gets a different video than a weight-loss user. Currently, one script template is used across all BMI calculator entries (customized only by name/BMI). Multiple script variants per cluster is a planned improvement. Second gap: video length. 90 seconds is optimal — below 60 feels rushed, above 120 loses attention. Script length must be controlled by character count in `ScriptBuilder`.

---

## Step 8: Video Ends → Coach Quiz Appears (3–5 Questions)

**URL:** Same overlay, video transitions to quiz  
**User action:** Video ends. Quiz slides up from bottom.

**What he sees:**
- Video remains on screen (paused at last frame — Mia looking at camera, attentive)
- Quiz panel slides up over the bottom 60% of the screen
- First question: "What's held you back before?" with 4 options:
  - "I start strong, then lose motivation"
  - "My schedule is unpredictable"
  - "I don't know what to do"
  - "I know what to do but don't do it"
- Andrey selects: "I start strong, then lose motivation" — because that's true.
- Question 2: "How much time can you realistically commit each day?" [10 min | 20 min | 30–45 min | 1 hour+]
- Question 3: "When are you most likely to follow through?" [Morning | Afternoon | Evening | I don't know]
- Question 4: "What matters more to you right now?" [Feeling better / More energy | Looking different | Both equally]
- Question 5 (if relevant to his answers): "Have you tried calorie counting before?" [Yes, it didn't stick | Yes, it worked short-term | No, never tried | No, but I'm open to it]

**What he feels:** These questions feel different from health app onboarding questions. They're not asking "What is your goal weight?" or "How many calories do you eat?" They're asking about his psychology. He's answering honestly because the framing invites honesty.

**What Mia does:** Mia's video frame is visible above the quiz — she is "waiting" for his answers, which creates a sense of live interaction.

**System:** `coach_quiz_started` event fired. Each answer fires `coach_quiz_question_answered`. After last question: `coach_quiz_completed`. `CoachBrain` writes goals + habits + communication style to UserGraph. State: `coach_quiz_started` → `coach_quiz_completed`.

**Key copy:** "What's held you back before?" (First question. This is not a health question — it's a psychology question. It signals that Mia thinks differently.)

**Time on screen:** 2–4 minutes

**Risk:** More than 5 questions kills momentum. Each question must have a clear purpose. "How many glasses of water do you drink per day?" is not a purposeful question at this stage.

**Why he stays:** He is invested in the result. He answered honestly. He wants to see what she does with his answers. The momentum of "almost there" carries him through.

**Screenshot description:** Split view: top 40% is Mia's paused video frame (she's looking at viewer, attentive expression). Bottom 60%: quiz panel with question text and 4 tap-friendly answer options (large touch targets, full-width). Progress indicator at top of quiz panel showing question 2 of 5. No back button visible (reduces friction; users very rarely want to go back).

**Gap vs. world-class:** A world-class product would make the quiz feel conversational — Mia responds verbally to each answer before the next question. "You said motivation. That's the most important thing I needed to know." This could be text-based (not video) and still be highly effective. Not implemented. Significant engagement opportunity.

---

## Step 9: Completes Quiz → TODAY'S PLAN Delivered (Free, Immediate)

**URL:** Same overlay or new panel  
**User action:** Answers last question, sees "Building your plan..." for 3–8 seconds.

**What he sees:**
- A brief loading state: "Mia is building your plan based on what you told her. 5 seconds."
- Then: Today's Plan screen

**Today's Plan:**

---
**Your plan for today — [Date]**  
*Built by Mia based on your BMI of 27.3 and your answers*

**Your starting point:** You have good intentions and strong starts. The problem isn't motivation — it's that your plan hasn't accounted for what happens when motivation fades.

**Today, Mia recommends 3 things:**

1. **Walk 20 minutes after dinner** (not in the morning — you said evening works better for you)  
   *Why: You mentioned evenings. Evening walks also reduce cortisol, which affects fat storage at your BMI level.*

2. **Eat normally today — no restriction**  
   *Why: Every failed attempt started with restriction. We're not starting there. Today we gather baseline data.*

3. **Check in with Mia at 9 PM using the button below**  
   *Why: The check-in takes 90 seconds. It tells me how your day actually went, not how you planned it.*

**What Mia will send you tomorrow:** Based on your check-in, I'll adjust your plan for Day 2. It won't be the same as today.

---

**What he feels:** Surprised. The plan is not what he expected. "Eat normally today" is unexpected — every diet plan he's tried started with a calorie count or a list of foods to avoid. The plan references his specific quiz answers ("evenings"). He reads the "Why" explanations and they make sense. He feels understood, not lectured.

**What Mia does:** The plan is Mia's first concrete delivery. Everything before this was promise — this is the actual value.

**System:** `today_plan_generated` event fired. `CoachPlannerImpl` wrote `tasksAssigned` to `dailyHistory`. `today_plan_viewed` event fired on render. Registration CTA is prepared but not yet displayed. State: `today_plan_delivered`.

**Key copy:** "Eat normally today — no restriction." (The most surprising and trust-building element of the plan. It tells him this coach is not going to do what every other coach has done.)

**Time on screen:** 3–8 minutes (reading plan, absorbing it, possibly re-reading)

**Risk:** If the plan is generic (drink more water, sleep 8 hours, reduce sugar), trust collapses permanently. The plan must reference his specific quiz answers. "You mentioned evenings" is required.

**Why he stays:** This plan is different from any plan he's seen. He wants to see what the Registration gate offers.

**Screenshot description:** Clean plan view. Date at top. Brief Mia note (italicized, warm tone). Three tasks numbered 1–3. Each task: bold task name, 1–2 sentence explanation in gray below. Check-in CTA at bottom. Below the three tasks: Registration CTA card appears (not blocking plan visibility).

**Gap vs. world-class:** A world-class product would show a 7-day trajectory here: "Here's what the next week looks like if you follow these plans." This requires the planner to generate a multi-day arc, not just today's plan. Significant product investment — worth prioritizing in Sprint +2.

---

## Step 10: Registration Gate Appears

**URL:** Same view, registration card slides up  
**User action:** Reads plan, sees registration CTA at bottom.

**What he sees:**
- Below the 3-task plan: A card from Mia:
  > "Your plan for today is ready. To get tomorrow's plan — and every day after — I need your email. That's it. No payment. 7-day free trial of everything."
- Email input field (single field, placeholder: "Your email address")
- CTA button: "Send Me Tomorrow's Plan"
- Below button: "No credit card. Cancel any time. Takes 20 seconds."
- Alternative: "Continue with Google" (OAuth)

**What he feels:** He's been given something real. The plan is in front of him. Registering feels like protecting something he already has, not buying something new. The "no payment" copy removes the last barrier.

**What Mia does:** Her voice, her card, her framing — even though this is a registration form, it's framed as a message from Mia.

**System:** `registration_started` event fired on first interaction with the form.

**Key copy:** "To get tomorrow's plan, I need your email." (Not "Sign up for SolviqLab." Frame the outcome, not the action.)

**Time on screen:** 30–60 seconds

**Risk:** If the email field requires validation format before submit (real-time inline validation), it can feel aggressive. Validate on submit only.

**Why he stays:** He wants tomorrow's plan. He wants to know if Mia adapts it based on his check-in tonight.

**Screenshot description:** Mia's registration card below the plan, within the same scrollable view. Card has Mia's small avatar, her message copy, a single email field, the primary CTA button, and the reassurance copy in small gray text below.

**Gap vs. world-class:** A world-class product would offer "Continue with Apple" on iOS (Apple Pay flow makes registration completely frictionless on iPhone). Not implemented. High-priority gap for mobile.

---

## Step 11: Andrey Registers

**URL:** Same page (no redirect yet) or modal confirmation  
**User action:** Enters email, clicks "Send Me Tomorrow's Plan" (or continues with Google).

**What he sees:**
- Brief confirmation: "Perfect, Andrey. You're in."
- Immediately below: "Your first check-in is set for tonight at [time based on his timezone]. Mia will ask how the walk went."
- Then: Redirect to his personal dashboard (or it loads below).

**What he feels:** The confirmation feels personal — uses his name, references the specific task (the walk) from his plan. He doesn't feel like he just registered for a SaaS product. He feels like he confirmed an appointment with a coach.

**System:** `registration_completed` event fired. `identity.userType` → `'authenticated'`. `trial_started` fires. SchedulerEngine sets up evening check-in. State: `registered` → `trial`.

**Key copy:** "Your first check-in is set for tonight at [time]. Mia will ask how the walk went." (References his specific plan. Shows the system is already working for him.)

**Time on screen:** 10–20 seconds

**Risk:** If the confirmation is generic ("Thank you for registering! Check your email."), the emotional continuity breaks.

**Why he stays:** He wants to see the dashboard.

---

## Step 12: Personal Cabinet — First View

**URL:** `/en/dashboard` or `/en/profile`  
**User action:** Dashboard loads.

**What he sees:**
- Greeting: "Good evening, Andrey." (Time-aware)
- Today's plan — same 3 tasks he just saw, now with checkboxes
- A "Check In Tonight" button, with countdown: "Check-in opens at 9:00 PM" (2 hours from now)
- A small section: "Your profile" — shows BMI 27.3, cluster: Weight Management, trial status: "Day 1 of 7"
- Nothing else. No feature grids. No upsells. No empty states with confusing CTAs.

**What he feels:** The dashboard is focused. It shows today's plan and nothing else. He doesn't feel overwhelmed by features he doesn't understand yet. He is oriented.

**What Mia does:** No active message yet — she spoke in the video. She will speak again at the check-in.

**System:** All previous graph writes are now visible in the UI. Dashboard renders from UserGraph.

**Key copy:** "Good evening, Andrey." (Simple, correct, personal. Time-aware.)

**Time on screen:** 2–5 minutes (exploring dashboard, then closing app)

**Risk:** If the dashboard shows feature discovery prompts ("Try the sleep calculator!" "Explore nutrition tools!") before the user has built a single day of habit, it creates noise that breaks focus. New user dashboard must be intentionally minimal.

**Why he stays:** He closes the app. He has something to do tonight (check-in). He'll be back.

**Screenshot description:** Single-column mobile view. Greeting at top. Today's plan card: three tasks with checkboxes, each with its brief "why" visible. Check-in button (greyed out, with time until it opens). Small profile card at bottom with key stats. No sidebar, no navigation-heavy chrome.

**Gap vs. world-class:** A world-class product would show a personalized "What to expect from your 7-day trial" card on first dashboard view — not as a tour, but as Mia's letter to Andrey for the week. Not implemented. Medium priority.

---

## Step 13: Next Morning — Mia's Daily Message

**URL:** Push notification → opens app → `/en/dashboard`  
**User action:** 8:00 AM. Andrey gets a push notification.

**What the notification says:** "Good morning, Andrey. Your Day 2 plan is ready. 3 things for today — they're different from yesterday." (Platform: iOS, appears on lock screen)

**What he sees when he opens the app:**
- Dashboard, now showing Day 2
- A new card at top: "Morning from Mia" — not a video yet (trial — video morning messages may be a Pro feature), but a Mia-voiced text message:
  > "Good morning, Andrey. 
  >
  > You checked in last night. You did the walk — 22 minutes. That's above what I asked for.
  >
  > Based on your check-in, your energy was 3/5 at the end. That's useful data. Here's what today looks like:"
- Day 2 plan: slightly different from Day 1 — one of the tasks has progressed.

**What he feels:** Mia referenced the walk. She referenced the duration (22 minutes — more than the 20 she asked for). She referenced his energy score. This is the moment the habit loop clicks: he checked in because he wanted Mia to know. Now he sees she used the data.

**System:** SchedulerEngine fired morning delivery. CoachBrain read yesterday's `dailyHistory.entries` and composed the morning message. `morning_checkin_completed` from last night is referenced.

**Key copy:** "You did the walk — 22 minutes. That's above what I asked for." (The most important sentence in the product after the first video. Mia remembers. Mia noticed. Mia is specific.)

**Screenshot description:** Dashboard with "Morning from Mia" card at top — Mia's avatar, message text, then Day 2 plan below. Day 2 plan has similar structure to Day 1 but shows one changed task. Check-in button for tonight already visible at bottom.

**Gap vs. world-class:** Morning video (from HeyGen) for every day would be transformative but expensive. A world-class product would offer daily video as a premium Pro feature (morning video is in `DailyHistoryNode.morningVideoWatched`). Text-based morning messages work well as the default, with video as a Pro upsell. Architecture already supports this.

---

## Step 14: Day 3 — Gate 2, Premium Offer

**URL:** `/en/dashboard` (after completing morning check-in)  
**User action:** Andrey completes his Day 3 morning check-in.

**What he sees:**
- Check-in completed confirmation
- Full-screen moment (replaces check-in): "3 days." in large type. Below: "You've shown up three days in a row."
- His Day 1 energy score vs. Day 3 energy score, side by side: "2/5 → 3/5"
- Mia's message (from Gate 2 spec):
  > "Day 3. You've shown up three days in a row. That's not willpower — that's the beginning of a pattern.
  >
  > I want to show you what your next 30 days can look like. That requires the full coaching system — which you've been using during your trial.
  >
  > Your trial ends in 4 days. After that, full coaching continues for $9.99/month.
  >
  > I'd like to keep going with you."
- Two options: "Keep Going — $9.99/mo" and "Remind Me Later"

**What he feels:** Pride at the 3-day acknowledgment. The energy comparison is concrete — he can see a real change in 3 days. The offer feels like a natural next step, not an interruption.

**System:** `daily_streak_updated(currentStreak: 3)` fired. Gate 2 evaluation triggered. `gate_shown` event fired.

**Key copy:** "That's not willpower — that's the beginning of a pattern." (Reframes his 3-day achievement from discipline to habit formation — which is a more durable motivation.)

**Screenshot description:** Full-screen view. Large "3" in the center with "days" below in smaller text. Below: before/after energy comparison (Day 1 vs. Day 3). Then: Mia's message in her voice (text with avatar). Two CTA buttons at bottom: primary "Keep Going — $9.99/mo" and secondary "Remind Me Later" in lighter style.

---

## Step 15: Andrey Subscribes

**URL:** Payment flow  
**User action:** Andrey clicks "Keep Going — $9.99/mo"

**What he sees:**
- Payment screen. Clean, minimal. Shows: Plan: Pro Monthly | $9.99/month | 7-day trial remaining — payment starts in 4 days
- Payment method: Credit card OR Apple Pay / Google Pay
- One-click confirmation if Apple Pay available

**What he feels:** He is paying for a continuation of something he has already experienced and believes in. He's not buying an unknown product — he's paying to keep something he doesn't want to lose.

**System:** `premium_started` event fired. `premium.tier` → `'pro'`. PremiumEngine updates quotaLimit. SchedulerEngine unlocks evening video check-ins.

**What Mia says after payment:**
> "You just made this real. Starting tomorrow, here's what changes: you'll get a short video message from me each morning instead of text — and I'll check in with you in the evening too, not just once a day.
>
> Your plan for tomorrow is already being built. See you in the morning."

**Key copy:** "You just made this real." (Not "Thank you for subscribing." Not "Welcome to Pro." — "You just made this real." It frames the payment as the user's commitment, not the product's transaction.)

**Time on screen:** 60–90 seconds (reading, paying, reading confirmation)

**Screenshot description:** Standard payment screen. Mia's small avatar in the header (continuity). Plan summary at top (Pro Monthly, $9.99). Payment method options. Large "Start My Plan" CTA. After payment: confirmation message from Mia with what changes tomorrow. No feature grid.

**Gap vs. world-class:** The ideal post-payment experience would include a 30-second "commitment video" from Mia — a personal message acknowledging the subscription specifically. This would be a one-time HeyGen generation on subscribe. High emotional impact. Not currently implemented.

---

## Does the CEO Say "I Would Buy This"?

### Honest Assessment

**What is excellent:**

1. **The value-first sequence is correctly designed.** The user receives a personalized video before any ask. This is rare. Most health apps ask for email on page 1. SolviqLab asks after the user has seen a video that references their specific number.

2. **Mia's voice design is sound.** The Coach Communication System v1.0 defines Mia's personality precisely. "Observational precision" (referencing specific user data) and "quiet confidence" (no hedging) are the right traits. If implemented correctly, Mia will feel different from any AI assistant the user has encountered.

3. **The daily plan structure is correct.** Three tasks, each with a "why," each personalized to quiz answers. The "eat normally today" task is psychologically sophisticated — it breaks the user's pattern rather than repeating it.

4. **The data model supports the experience.** UserGraph + EventBus + CoachBrain architecture is capable of delivering true personalization. The `miaFact` system (writing specific health insights to `coachMemory`) enables Mia to reference real data in every message.

5. **Gate design follows the principle.** Value before ask, always. The registration gate appears after the plan is delivered, not before. Gate 2 uses real progress data (energy scores).

**What is not yet excellent:**

1. **The first video is partially personalized, not fully personalized.** The script includes the user's name and BMI number — but it cannot currently include "I know you've tried 3 times" because that data hasn't been collected before the video. The quiz that collects this data comes AFTER the video. This is the core tension in the current flow. **Solution path:** A brief 2-question pre-video micro-quiz ("Have you tried to change this before? What happened?") before the video is generated — feeding this into the script would make the video significantly more powerful.

2. **The waiting screen for video generation is a friction point.** 60–120 seconds of waiting is a lot to ask a first-time user. If pre-generation caching (generating videos for common BMI ranges in advance) is implemented, this wait disappears. This is the single highest-leverage technical investment for funnel conversion.

3. **The daily plan is generated by rules, not by intelligence.** Currently, `CoachPlannerImpl` uses a structured template. The plan references quiz answers ("you said evenings") but does not adapt dynamically to daily check-in data in a sophisticated way. A world-class product's plan would evolve meaningfully based on daily feedback — not just task difficulty scaling, but strategy changes based on what's working.

4. **There is no social proof in the flow.** No testimonials, no "X users have lost 5kg," no real user results. This is appropriate for a brand-new product. But by Month 3, when real user data exists, social proof should be inserted at Gate 1 and Gate 2. This gap is time-limited — it self-resolves as the user base grows.

5. **The post-subscription experience gap.** The flow ends at "Your plan for tomorrow is already being built." But the CEO should see what tomorrow actually looks like: the first Pro morning video, the evening check-in, Week 1 review. Currently, this document doesn't show it because the system isn't fully built yet. The Day 1–7 Pro experience is the next document to write.

**The CEO's verdict:**

If Mia's video references real user data (name + BMI confirmed), if the plan's first task is genuinely surprising (and it should be — "eat normally" is the right call for this persona), and if the morning message on Day 2 correctly references last night's check-in — then yes. The CEO says "I would buy this."

The experience is coherent, emotionally intelligent, and delivers on its promise. The gaps are real but fixable. None of them break the core loop.

**The bar:** The current flow, if executed correctly with high-quality copy and video, is competitive with Noom, BetterHelp, and MyFitnessPal. To exceed them, the pre-video micro-quiz and video pre-caching must be prioritized in the next engineering sprint.
