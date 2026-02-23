/**
 * Redirect: /dashboard/agents → /dashboard/agent
 * 
 * This page has been merged into /dashboard/agent for a unified agent management experience.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/agent');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-gray-600">Redirecting to Agent Management...</p>
      </div>
    </div>
  );
}
