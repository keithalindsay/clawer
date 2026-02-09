"use client";

import { useState, useEffect } from "react";
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
  const [showModal, setShowModal] = useState(false);

  // Show full-screen modal when messages exhausted
  useEffect(() => {
    if (remaining === 0) {
      setShowModal(true);
    }
  }, [remaining]);

  // Progressive states based on usage
  const state = 
    remaining === 0 ? 'exhausted' :
    remaining <= 5 ? 'critical' :  // 90%
    remaining <= 10 ? 'high' :     // 80%
    remaining <= 20 ? 'medium' :   // 60%
    'low';

  // Don't show banner until 60% usage (30 messages)
  if (freeMessagesUsed < 30) {
    return null;
  }

  // Full-screen upgrade modal at 50 messages
  if (showModal && remaining === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-8 sm:p-12 shadow-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Your free trial is complete!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              You&apos;ve sent {freeMessageLimit} messages with your AI assistant
            </p>

            {/* Summary of value */}
            <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">What your AI helped with:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Drafted emails and documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Researched topics and summarized information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Brainstormed ideas and solved problems</span>
                </li>
              </ul>
            </div>

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
              <div className="text-2xl font-bold mb-2">Upgrade to Pro — $49/mo</div>
              <p className="text-blue-100 mb-4">Continue the momentum with unlimited access</p>
              <div className="grid sm:grid-cols-3 gap-3 text-left text-sm mb-4">
                <div>
                  <div className="font-semibold mb-1">Unlimited Messages</div>
                  <div className="text-blue-200">Chat as much as you need</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">WhatsApp + Telegram</div>
                  <div className="text-blue-200">Chat from your phone</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Smart Routing</div>
                  <div className="text-blue-200">Best AI for every task</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/pricing"
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade Now →
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Progressive upgrade banners (60%, 80%, 90%)
  const bannerConfig = {
    exhausted: {
      bg: "bg-red-50 border-red-200",
      progressBg: "bg-red-500",
      icon: "🔒",
      title: "Free Trial Complete",
      titleColor: "text-red-900",
      message: `You've used all ${freeMessageLimit} free messages. Upgrade to continue chatting with your AI.`,
      ctaBg: "bg-red-600 hover:bg-red-700 text-white",
      ctaText: "Upgrade Now →"
    },
    critical: {
      bg: "bg-orange-50 border-orange-300 border-2",
      progressBg: "bg-orange-500",
      icon: "⚠️",
      title: "Only 5 messages left!",
      titleColor: "text-orange-900",
      message: "You're almost out of free messages. Upgrade now for unlimited access.",
      ctaBg: "bg-orange-600 hover:bg-orange-700 text-white",
      ctaText: "Upgrade Now →"
    },
    high: {
      bg: "bg-yellow-50 border-yellow-300 border-2",
      progressBg: "bg-yellow-500",
      icon: "⚠️",
      title: `${remaining} free messages remaining`,
      titleColor: "text-yellow-900",
      message: "Upgrade for unlimited messages — never worry about running out again.",
      ctaBg: "bg-yellow-600 hover:bg-yellow-700 text-white",
      ctaText: "Upgrade for Unlimited"
    },
    medium: {
      bg: "bg-blue-50 border-blue-200",
      progressBg: "bg-blue-500",
      icon: "💡",
      title: `${remaining} free messages remaining`,
      titleColor: "text-gray-900",
      message: "Loving your AI assistant? Upgrade for unlimited messages + WhatsApp + Telegram.",
      ctaBg: "bg-blue-600 hover:bg-blue-700 text-white",
      ctaText: "See Upgrade Options"
    },
    low: {
      bg: "bg-blue-50 border-blue-200",
      progressBg: "bg-blue-600",
      icon: "✨",
      title: `${remaining} free messages remaining`,
      titleColor: "text-gray-900",
      message: `${freeMessagesUsed} of ${freeMessageLimit} free messages used`,
      ctaBg: "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50",
      ctaText: "See Plans"
    }
  };

  const config = bannerConfig[state];

  return (
    <div className={`rounded-2xl p-6 mb-6 border ${config.bg}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{config.icon}</span>
            <h3 className={`text-lg font-semibold ${config.titleColor}`}>
              {config.title}
            </h3>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${config.progressBg}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-sm text-gray-600">{config.message}</p>
        </div>

        <Link
          href="/pricing"
          className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow-md ${config.ctaBg}`}
        >
          {config.ctaText}
        </Link>
      </div>
    </div>
  );
}
