export default function BuilderSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
          <div className="rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded bg-gray-200" />
              <div className="h-4 w-36 bg-gray-200 rounded" />
            </div>
            <div className="h-3 w-4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
