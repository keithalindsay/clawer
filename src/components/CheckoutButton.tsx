'use client';

/**
 * Checkout button that redirects to Stripe Checkout
 */

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface CheckoutButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function CheckoutButton({ children, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleClick = async () => {
    // If not signed in, redirect to sign up first
    if (!isSignedIn) {
      router.push('/sign-up');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
