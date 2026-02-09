"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function WelcomeToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setVisible(true);
      // Clean up URL without refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.toString());

      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-white rounded-xl shadow-lg border border-green-200 p-4 flex items-center gap-3 max-w-sm">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="font-semibold text-gray-900">Welcome aboard!</p>
          <p className="text-sm text-gray-600">
            Your AI assistant is ready. You have 50 free messages to explore!
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
