import Skeleton from '../ui/Skeleton'

export default function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-12" role="status" aria-label="Loading product">
      <div className="grid gap-10 sm:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  )
}
