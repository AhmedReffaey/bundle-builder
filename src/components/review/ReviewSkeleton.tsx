export default function ReviewSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading review panel…" className="overflow-hidden rounded-2xl border border-gray-100 bg-white animate-pulse">
      <div className="px-5 pt-5 pb-3">
        <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-56 bg-gray-100 rounded" />
      </div>
      <div className="px-5 space-y-3 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50">
            <div className="w-9 h-9 rounded bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-2.5 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <div className="w-16 h-16 rounded-full bg-gray-100" />
        <div className="space-y-1 text-right">
          <div className="h-3 w-20 bg-gray-100 rounded ml-auto" />
          <div className="h-7 w-28 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="h-10 w-full bg-gray-200 rounded" />
      </div>
    </div>
  );
}
