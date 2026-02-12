'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-4">😵</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">
          The dashboard hit an error. This has been logged and we&apos;re looking into it.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reload dashboard
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && error.message && (
          <pre className="mt-6 text-xs text-left bg-gray-100 p-3 rounded-lg overflow-auto max-h-32 text-red-600">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
