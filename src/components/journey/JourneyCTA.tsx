// Per UX Bible Part IV — CTA Principles:
// 1. "Why now" hook (1 sentence) PRECEDES the button
// 2. Arrow icon translates 2px right on hover (150ms)
// 3. Button: slight scale on active state (tactile response)
// 4. Never "Continue" / "Submit" / "Next" / "Go"

interface Props {
  readonly whyNow: string
  readonly ctaLabel: string
  readonly href: string
}

export function JourneyCTA({ whyNow, ctaLabel, href }: Props) {
  return (
    <div className="space-y-3 pt-1">
      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
        {whyNow}
      </p>
      <a
        href={href}
        className="group flex items-center justify-center gap-2 w-full
                   py-3 px-5 min-h-[44px]
                   bg-blue-600 hover:bg-blue-700 active:scale-[0.98]
                   text-white text-sm font-semibold
                   rounded-xl transition-all duration-150"
      >
        {ctaLabel}
        <svg
          className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  )
}
