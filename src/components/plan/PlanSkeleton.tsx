export function PlanSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
      <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/2 mx-auto" />
    </div>
  )
}
