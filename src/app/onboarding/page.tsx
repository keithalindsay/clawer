"use client";

import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = async (preferences: {
    primaryGoal: string;
    useCases: string[];
    industry?: string;
    teamTemplate: string;
  }) => {
    // Store preferences in localStorage
    localStorage.setItem("clawer_preferences", JSON.stringify(preferences));
    
    // Save team template to database
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamTemplate: preferences.teamTemplate }),
      });
    } catch (e) {
      console.error("Failed to save onboarding preferences:", e);
    }
    
    // Redirect to dashboard
    router.push("/dashboard");
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <OnboardingFlow onComplete={handleComplete} onSkip={handleSkip} />
  );
}
