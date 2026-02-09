"use client";

import Link from "next/link";

interface FreeTrialBannerProps {
  freeMessagesUsed: number;
  freeMessageLimit: number;
}

export function FreeTrialBanner({
  freeMessagesUsed,
  freeMessageLimit,
}: FreeTrialBannerProps) {
  const remaining = Math.max(0, freeMessageLimit - freeMessagesUsed);
  const percentage = Math.min(100, (freeMessagesUsed / freeMessageLimit) * 100);
  const isExhausted = remaining === 0;
  const isLow = remaining <= 10 && remaining > 0;

  return (
    <div
      className={`rounded-2xl p-6 mb-6 border ${
        isExhausted
          ? "bg-red-50 border-red-200"
          : isLow
          ? "bg-amber-50 border-amber-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{isExhausted ? "🔒" : "✨"}</span>
            <h3
              className={`text-lg font-semibold ${
                isExhausted ? "text-red-900" : "text-gray-900"
              }`}
            >
              {isExhausted
                ? "Free Trial Complete"
                : `Free Trial — ${remaining} messages left`}
            </h3>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isExhausted
                  ? "bg-red-500"
                  : isLow
                  ? "bg-amber-500"
                  : "bg-blue-600"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-sm text-gray-600">
            {isExhausted ? (
              <>
                You&apos;ve used all {freeMessageLimit} free messages.
                Upgrade to continue chatting with your AI.
              </>
            ) : (
              <>
                <span className="font-medium">{freeMessagesUsed}</span> of{" "}
                {freeMessageLimit} free messages used
              </>
            )}
          </p>
        </div>

        <Link
          href="/pricing"
          className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow-md ${
            isExhausted
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
          }`}
        >
          {isExhausted ? "Upgrade Now →" : "See Plans"}
        </Link>
      </div>
    </div>
  );
}
