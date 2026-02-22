'use client';

import { useState, useEffect } from 'react';
import { CheckoutButton } from '@/components/CheckoutButton';

interface UpgradeBannerProps {
  isSubscribed: boolean;
}

export function UpgradeBanner({ isSubscribed }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('upgrade-banner-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  if (isSubscribed || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('upgrade-banner-dismissed', 'true');
  };

  return (
    <div className="relative flex items-center gap-4 bg-white border border-gray-200 border-l-4 border-l-orange-500 rounded-lg px-4 py-3 shadow-sm">
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Upgrade to Pro</span>
          {' '}— 500 messages/day, full AI team, and priority responses.
        </p>
        <CheckoutButton className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors">
          Upgrade to Pro →
        </CheckoutButton>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-1"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
