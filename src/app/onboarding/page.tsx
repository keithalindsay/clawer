"use client";

import { useRouter } from "next/navigation";
import { OnboardingFlow, OnboardingPreferences } from "@/components/OnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = async (preferences: OnboardingPreferences) => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
    } catch (e) {
      console.error("Failed to save onboarding preferences:", e);
    }

    // Redirect directly to chat with welcome flag — user gets to value IMMEDIATELY
    router.push("/chat/assistant?welcome=1");
  };

  const handleSkip = () => {
    // Skip onboarding, use defaults, go straight to chat
    router.push("/chat/assistant?welcome=1");
  };

  return (
    <OnboardingFlow onComplete={handleComplete} onSkip={handleSkip} />
  );
}
