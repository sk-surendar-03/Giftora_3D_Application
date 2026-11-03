import Skeleton from '../ui/Skeleton'

export default function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" role="status" aria-label="Loading products">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-card border border-border bg-surface">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
