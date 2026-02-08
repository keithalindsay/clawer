"use client";

import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = async (preferences: {
    primaryGoal: string;
    useCases: string[];
    industry?: string;
  }) => {
    // Store preferences in localStorage for now
    // TODO: Save to database via API
    localStorage.setItem("clawer_preferences", JSON.stringify(preferences));
    
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
