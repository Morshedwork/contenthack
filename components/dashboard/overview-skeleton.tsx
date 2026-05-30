import { Skeleton } from '@/components/ui/skeleton'

export function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Skeleton className="h-72 lg:col-span-2 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
