import { Skeleton } from '@/components/ui/skeleton';

export default function BlogLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section Skeleton */}
      <div className="text-center mb-16">
        <Skeleton className="h-14 w-96 mx-auto mb-4" />
        <Skeleton className="h-6 w-[500px] mx-auto" />
      </div>

      {/* Articles Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-7 w-full mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
