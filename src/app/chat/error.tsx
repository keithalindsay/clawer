'use client';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-4xl mb-4">🤖💔</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Chat connection lost</h2>
        <p className="text-gray-600 mb-6">
          Your AI team hit a snag. Let&apos;s reconnect.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Reconnect
        </button>
      </div>
    </div>
  );
}
