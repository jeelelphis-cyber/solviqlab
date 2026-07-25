import type { QuizConfig } from '../types'

export const energyQuiz: QuizConfig = {
  slug:        'energy-quiz',
  cluster:     'energy',
  icon:        '⚡',
  title:       'Daily Energy Levels Quiz',
  description: 'Low energy isn\'t just tiredness — it\'s a signal. Find out what\'s draining you and what could restore you.',
  questions: [
    {
      id:   'en1',
      text: 'How do you feel when you wake up in the morning?',
      type: 'single',
      options: [
        { value: 4, label: 'Ready — I feel rested and clear' },
        { value: 3, label: 'Okay — takes a coffee to get going' },
        { value: 2, label: 'Tired — I wish I could sleep more' },
        { value: 1, label: 'Exhausted — mornings are a real struggle' },
      ],
    },
    {
      id:          'en2',
      text:        'How consistently does your energy stay up throughout the day?',
      type:        'scale',
      scaleMin:    1,
      scaleMax:    5,
      scaleLabels: { min: 'Crashes badly', max: 'Steady all day' },
    },
    {
      id:   'en3',
      text: 'Do you experience a significant afternoon energy crash (around 2–4pm)?',
      type: 'yesno',
    },
    {
      id:   'en4',
      text: 'How is your diet fueling your day — are you eating for energy or just hunger?',
      type: 'single',
      options: [
        { value: 4, label: 'Intentionally — I eat to fuel my energy' },
        { value: 3, label: 'Reasonably — mostly good choices' },
        { value: 2, label: 'Inconsistently — I grab what\'s available' },
        { value: 1, label: 'Poorly — sugar, caffeine, and quick fixes' },
      ],
    },
    {
      id:   'en5',
      text: 'How much does low energy limit what you actually do in a day?',
      type: 'single',
      options: [
        { value: 4, label: 'Not at all — I do everything I want to' },
        { value: 3, label: 'A little — I prioritize but don\'t miss much' },
        { value: 2, label: 'Noticeably — I skip things I wanted to do' },
        { value: 1, label: 'Significantly — my whole life feels reduced' },
      ],
    },
    {
      id:   'en6',
      text: 'After a weekend of rest, do you typically feel recharged — or still tired?',
      type: 'single',
      options: [
        { value: 4, label: 'Recharged — weekends restore me' },
        { value: 3, label: 'Somewhat better but not fully restored' },
        { value: 2, label: 'Still tired — rest doesn\'t seem to help much' },
        { value: 1, label: 'Worse sometimes — rest makes me more sluggish' },
      ],
    },
    {
      id:   'en7',
      text: 'Do you rely on caffeine to function — not for pleasure, but to get through the day?',
      type: 'yesno',
    },
  ],
  scoring: {
    max: 29,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'High Energy',
        description: 'Your energy is well-supported by your lifestyle. You have reserves and you recover well from exertion.',
        miaHook:     'Your energy foundation is strong — let\'s talk about optimizing it even further for peak performance.',
      },
      {
        min:         40,
        max:         69,
        label:       'Energy Leaks',
        description: 'You have energy, but it\'s inconsistent. Certain patterns are causing drops that affect your mood, productivity, and motivation.',
        miaHook:     'Your energy is being drained by a few specific patterns I can see — fixing these often has cascading benefits across everything else.',
      },
      {
        min:         0,
        max:         39,
        label:       'Chronically Low Energy',
        description: 'Your energy is significantly depleted and affecting your quality of life. This is usually multi-factorial — sleep, nutrition, stress, and movement all play a role.',
        miaHook:     'What you\'re experiencing isn\'t laziness — it\'s a system that isn\'t being supported properly. Let me help you rebuild from the ground up.',
      },
    ],
  },
  seoKeywords: ['energy quiz', 'why am I always tired quiz', 'low energy quiz', 'fatigue quiz health'],
}
