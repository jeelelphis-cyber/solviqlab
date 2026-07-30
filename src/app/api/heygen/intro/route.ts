// POST /api/heygen/intro — one-time pre-recorded intro video generation for a coach
// Call once per coach, store the returned videoId, poll /api/heygen/generate?videoId=xxx
// When completed, hardcode videoUrl in the persona's introVideoUrl field.

import { NextRequest, NextResponse } from 'next/server'
import { HeyGenService } from '@/lib/heygen/service'

const MIA_VOICE    = 'M2WosQ2Ju3f2b7jdddsj'          // Mia — warm female EN voice
const MARCUS_VOICE = '828b59f834fd4c7188da322b6d9b6c75' // David Castlemore — male EN voice

const COACH_INTROS: Record<string, { avatarId: string; voiceId: string; script: string }> = {
  mia: {
    avatarId: 'Abigail_expressive_2024112501',
    voiceId:  MIA_VOICE,
    script: `Most people know what they need to do for their health. Eat better. Move more. Sleep longer. They've known for years.

The problem has never been information. The problem is that nobody built a system around your actual life — your schedule, your stress, your body, your specific starting point.

I'm Mia. I've worked with thousands of people on their health journey. The ones who actually changed? They didn't have more willpower. They had a better system.

What I do is find that system for you. We look at what's actually happening in your body, in your day, in your habits — and we build something that fits. Not a plan you'll follow for two weeks. A shift that lasts.

You're not starting over. You're starting smarter.

What's your name?`,
  },
  marcus: {
    avatarId: 'Marcus_Suit_Front_public',
    voiceId:  MARCUS_VOICE,
    script: `Most people think investing is complicated. It's not. It's one decision — made consistently over time. And that decision compounds.

Every month without a strategy isn't neutral. It's a cost. Money that could be growing is sitting still instead. And that gap compounds too — just in the wrong direction.

I'm Marcus. Twelve years building wealth strategies for people at every starting point. The one thing that separated those who built real wealth? A system. Not luck. Not a hot stock tip. A strategy followed consistently, through market ups and downs.

What I do is build that system with you. Based on where you actually are — not where you think you should be. No jargon. No hype. Just a clear roadmap and the knowledge to follow it.

The best time to start was ten years ago. The second best time is the next five minutes.

What's your name?`,
  },
  scarlett: {
    avatarId: 'Scarlett_sitting_yoga_front',
    voiceId:  MIA_VOICE,
    script: `Stress isn't the problem. The problem is that nobody has ever shown you what's actually triggering it — and how to interrupt it at the root.

Most advice tells you to breathe, take breaks, do yoga. And you've tried it. It helps for a moment. Then Monday comes, and you're back where you started.

I'm Scarlett. I work with CBT and mindfulness techniques — but not the generic kind. I find your specific patterns — your triggers, your thought loops, your recovery gaps — and I build something custom around your actual life.

The people I work with stop dreading Mondays. They sleep through the night. They handle the same situations that used to break them — without falling apart.

In the next few minutes I'm going to ask you three questions nobody has asked you before. Your answers will change everything.

What's your name?`,
  },
  lina: {
    avatarId: 'Lina_Casual_Front_public',
    voiceId:  MIA_VOICE,
    script: `If you've ever tracked calories, started a diet, lost some weight — and then gained it back — that cycle isn't your failure. It's a design flaw in how most nutrition advice works.

It's built for the average person. Not for you.

I'm Lina. And the difference in how I work is this: I don't start with what you should eat. I start with why you eat the way you do — the habits, the triggers, the patterns that no calorie tracker can see.

Once we understand that — the changes become obvious. Natural. Sustainable.

People I work with stop obsessing over food. They eat what they enjoy without guilt. Their results last — not because they have more willpower, but because they finally have the right system.

Five minutes from now, you'll see your situation completely differently.

What's your name?`,
  },
  emilia: {
    avatarId: '137d2a33e1d246fd8d528b3040f25714_38470',
    voiceId:  'M2WosQ2Ju3f2b7jdddsj',
    script: `Here's what most fitness advice gets wrong: it tells you what to do — but not why you can't do it.

You know you should move more. Sleep better. Eat cleaner. You've known for years. The information was never the problem.

I'm Emilia. I work with people who are done with motivation that disappears after two weeks. What I build instead is a system — small, specific habits that fit into your actual life, that compound into real change over time.

Not workouts you dread. Not weight loss as punishment. Energy as a daily state — feeling strong when you wake up, focused through the afternoon, actually recovered at night.

The people I work with don't just change their body. They change how they feel inside it. More capable. More alive. Like their body is finally on their side.

That's what we're building. Starting right now.

What's your name?`,
  },
}

export async function POST(req: NextRequest) {
  const { coachId } = await req.json() as { coachId: string }

  const intro = COACH_INTROS[coachId]
  if (!intro) {
    return NextResponse.json({ error: `Unknown coach: ${coachId}` }, { status: 400 })
  }

  const key = process.env.HEYGEN_API_KEY
  if (!key) return NextResponse.json({ error: 'HEYGEN_API_KEY not configured' }, { status: 503 })

  const service = new HeyGenService(key)

  try {
    const { videoId } = await service.generateVideo({
      script:   intro.script,
      avatarId: intro.avatarId,
      voiceId:  intro.voiceId,
    })

    return NextResponse.json({
      coachId,
      videoId,
      message: `Video generation started. Poll /api/heygen/generate?videoId=${videoId} to check status. When completed, add videoUrl to persona introVideoUrl.`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'HeyGen error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
