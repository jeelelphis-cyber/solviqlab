// Per UX Bible Part V — Typography Scale:
// Hero statement: 20–24px, weight 700
// Body: 14px, weight 400

interface Props {
  readonly hero: string
  readonly sub: string
}

export function JourneyHero({ hero, sub }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[22px] font-bold leading-snug text-slate-900 dark:text-white">
        {hero}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {sub}
      </p>
    </div>
  )
}
