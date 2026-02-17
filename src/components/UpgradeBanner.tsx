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
    <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors text-lg"
        aria-label="Dismiss"
      >
        ✕
      </button>
      <h3 className="text-lg font-semibold mb-2">Upgrade to Pro — $49/mo</h3>
      <ul className="text-sm text-indigo-100 space-y-1 mb-4">
        <li>✓ 500 messages/day (vs 25)</li>
        <li>✓ Full AI team — all members unlocked</li>
        <li>✓ Priority model & faster responses</li>
        <li>✓ Custom skills & automations</li>
      </ul>
      <CheckoutButton className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
        Upgrade Now
      </CheckoutButton>
    </div>
  );
}
