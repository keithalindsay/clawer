import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="text-8xl mb-8">🦞</div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Page not found
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          This page went for a swim and didn't come back.
        </p>

        {/* Suggested links */}
        <div className="mb-8 bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Try these instead:
          </h2>
          <div className="flex flex-col gap-3">
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              → Home
            </Link>
            <Link 
              href="/use-cases"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              → Use Cases
            </Link>
            <Link 
              href="/pricing"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              → Pricing
            </Link>
            <Link 
              href="/blog"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              → Blog
            </Link>
          </div>
        </div>

        {/* Back to home button */}
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
