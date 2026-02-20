export default function FilesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Title skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mt-2" />
        </div>

        {/* Two-panel layout skeleton */}
        <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* Sidebar skeleton */}
          <div className="w-72 flex-shrink-0 border-r border-gray-200 p-4 space-y-3">
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />

            {/* Folder 1 */}
            <div className="space-y-1">
              <div className="h-8 w-full bg-gray-100 rounded animate-pulse" />
              <div className="ml-4 space-y-1">
                <div className="h-7 w-[90%] bg-gray-100 rounded animate-pulse" />
                <div className="h-7 w-[80%] bg-gray-100 rounded animate-pulse" />
                <div className="h-7 w-[85%] bg-gray-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Folder 2 */}
            <div className="space-y-1">
              <div className="h-8 w-full bg-gray-100 rounded animate-pulse" />
              <div className="ml-4 space-y-1">
                <div className="h-7 w-[75%] bg-gray-100 rounded animate-pulse" />
                <div className="h-7 w-[90%] bg-gray-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Folder 3 */}
            <div className="space-y-1">
              <div className="h-8 w-full bg-gray-100 rounded animate-pulse" />
            </div>

            {/* Folder 4 */}
            <div className="space-y-1">
              <div className="h-8 w-full bg-gray-100 rounded animate-pulse" />
            </div>

            {/* Footer */}
            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="flex-1 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="space-y-1">
                <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Content body */}
            <div className="space-y-3">
              <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="mt-4 h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
