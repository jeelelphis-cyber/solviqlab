// ─────────────────────────────────────────────────────────────────────────────
// Hook variants — THE most important section.
// Mia sells herself as daily coach + CTA to quiz → immediate plan today.
// 4 variants per language. NO "come back tomorrow".
// ─────────────────────────────────────────────────────────────────────────────

import type { ScriptVariant } from './types'

export const HOOK_VARIANTS: Record<string, ScriptVariant[]> = {
  en: [
    {
      id:   'hook_daily_coach_A',
      text: "I want to be your personal coach every single day, [name]. Not an app — a real coach who knows your story. Answer 3 quick questions below this video — takes 60 seconds — and I'll give you your first plan. Today. Right now.",
    },
    {
      id:   'hook_quiz_mystery_B',
      text: "There's something specific in your data I want to show you, [name]. But I need to know 3 more things first. Answer them below — 60 seconds — and I'll build something real for you. Not generic. Yours. Today.",
    },
    {
      id:   'hook_transformation_C',
      text: "I've helped people exactly where you are right now, [name]. Same numbers. Same feeling. They're in a completely different place now. Your first step is right below this video. It takes 60 seconds. And you'll have your plan today.",
    },
    {
      id:   'hook_presence_D',
      text: "I'm not going anywhere, [name]. I'll be here every morning. Every evening. Whenever you need me. But first — 3 questions below this video. Tell me what I need to know, and I'll take care of the rest. Starting today.",
    },
  ],
  uk: [
    {
      id:   'hook_daily_coach_A',
      text: "Я хочу бути твоїм особистим коучем кожен день, [name]. Не додаток — справжній коуч який знає твою історію. Відповідь на 3 запитання під цим відео — 60 секунд — і я дам тобі перший план. Сьогодні. Прямо зараз.",
    },
    {
      id:   'hook_quiz_mystery_B',
      text: "Є щось конкретне в твоїх даних що я хочу тобі показати, [name]. Але спочатку мені потрібно знати ще 3 речі. Відповідай нижче — 60 секунд — і я побудую щось справжнє для тебе. Не шаблонне. Твоє. Сьогодні.",
    },
    {
      id:   'hook_transformation_C',
      text: "Я допомагала людям саме там де ти зараз, [name]. Ті самі цифри. Те саме відчуття. Зараз вони в зовсім іншому місці. Твій перший крок — прямо під цим відео. 60 секунд. І твій план буде сьогодні.",
    },
    {
      id:   'hook_presence_D',
      text: "Я нікуди не йду, [name]. Буду тут кожного ранку. Кожного вечора. Коли б ти не потребував мене. Але спочатку — 3 запитання під відео. Розкажи мені що мені потрібно знати, і я подбаю про решту. Починаючи сьогодні.",
    },
  ],
}
