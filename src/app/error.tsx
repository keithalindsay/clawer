'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details to console
    console.error('Application error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="text-8xl mb-8">😵</div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Our lobster got tangled in the net. Let's try that again.
        </p>

        {/* Error details (only in dev) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          
          <a
            href="/"
            className="bg-gray-100 text-gray-700 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-200 transition-colors inline-block"
          >
            Back to Home
          </a>
        </div>

        {/* Support link */}
        <p className="mt-8 text-sm text-gray-500">
          Still having issues?{' '}
          <a 
            href="mailto:support@clawer.ai" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
