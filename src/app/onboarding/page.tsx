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

    router.push("/dashboard");
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <OnboardingFlow onComplete={handleComplete} onSkip={handleSkip} />
  );
}
