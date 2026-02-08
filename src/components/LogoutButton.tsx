'use client';

import { useClerk } from '@clerk/nextjs';

export function LogoutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: '/' })}
      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
    >
      Sign out
    </button>
  );
}
