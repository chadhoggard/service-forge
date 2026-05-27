export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1 mr-4">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="h-5 w-16 bg-gray-100 rounded-md" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
      <div className="h-3 bg-gray-100 rounded w-4/5 mb-4" />
      <div className="border-t border-gray-100 pt-3 space-y-2.5">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-4 bg-gray-100 rounded w-20" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-4 bg-gray-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 pt-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-4 bg-gray-100 rounded w-16" />
          <div className="h-5 bg-gray-100 rounded w-20" />
          <div className="h-4 bg-gray-100 rounded w-14" />
          <div className="h-4 bg-gray-100 rounded w-12" />
          <div className="h-4 bg-gray-100 rounded w-20" />
          <div className="h-4 bg-gray-100 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-7 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-72" />
          <div className="h-3 bg-gray-100 rounded w-56" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 bg-gray-100 rounded-lg w-32" />
          <div className="h-9 bg-gray-100 rounded-lg w-32" />
        </div>
      </div>
      <div className="h-36 bg-gray-50 rounded-xl" />
      <div className="h-64 bg-gray-50 rounded-xl" />
    </div>
  );
}
