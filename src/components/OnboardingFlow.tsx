"use client";

import { useState } from "react";

interface OnboardingFlowProps {
  onComplete: (preferences: OnboardingPreferences) => void;
  onSkip: () => void;
}

interface OnboardingPreferences {
  primaryGoal: string;
  useCases: string[];
  industry?: string;
}

const GOALS = [
  {
    id: "productivity",
    emoji: "⚡",
    title: "Save Time",
    description: "Automate repetitive tasks and get more done",
  },
  {
    id: "organization",
    emoji: "📁",
    title: "Stay Organized",
    description: "Keep track of everything without the mental load",
  },
  {
    id: "communication",
    emoji: "💬",
    title: "Communicate Better",
    description: "Write faster, clearer, more effective messages",
  },
  {
    id: "intelligence",
    emoji: "🧠",
    title: "Stay Informed",
    description: "Get briefings and insights without doing research",
  },
];

const USE_CASES = [
  { id: "morning-briefing", emoji: "🌅", label: "Morning briefings" },
  { id: "meeting-notes", emoji: "📝", label: "Meeting notes & follow-ups" },
  { id: "email-drafts", emoji: "📧", label: "Email drafting" },
  { id: "document-summary", emoji: "📄", label: "Summarizing documents" },
  { id: "content-creation", emoji: "✍️", label: "Content creation" },
  { id: "research", emoji: "🔍", label: "Research & analysis" },
  { id: "finance-tracking", emoji: "💰", label: "Finance tracking" },
  { id: "competitor-intel", emoji: "📊", label: "Competitor intelligence" },
  { id: "calendar-prep", emoji: "📅", label: "Calendar & meeting prep" },
  { id: "task-management", emoji: "✅", label: "Task management" },
];

const INDUSTRIES = [
  { id: "tech", label: "Tech / Software" },
  { id: "finance", label: "Finance / Investing" },
  { id: "legal", label: "Legal" },
  { id: "healthcare", label: "Healthcare" },
  { id: "real-estate", label: "Real Estate" },
  { id: "marketing", label: "Marketing / Agency" },
  { id: "consulting", label: "Consulting" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "other", label: "Other" },
];

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [industry, setIndustry] = useState("");

  const toggleUseCase = (id: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    onComplete({
      primaryGoal,
      useCases: selectedUseCases,
      industry: industry || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                s <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Primary Goal */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              What's your main goal?
            </h2>
            <p className="text-gray-500 mb-6">
              We'll customize your experience based on this
            </p>

            <div className="space-y-3">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => {
                    setPrimaryGoal(goal.id);
                    setStep(2);
                  }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    primaryGoal === goal.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div>
                      <div className="font-medium text-gray-900">{goal.title}</div>
                      <div className="text-sm text-gray-500">{goal.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Use Cases */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              What do you want to automate?
            </h2>
            <p className="text-gray-500 mb-6">
              Select all that apply — you can always change this later
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {USE_CASES.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => toggleUseCase(useCase.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedUseCases.includes(useCase.id)
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{useCase.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {useCase.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedUseCases.length === 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 3: Industry */}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              What industry are you in?
            </h2>
            <p className="text-gray-500 mb-6">
              This helps us suggest relevant automations
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setIndustry(ind.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    industry === ind.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-sm font-medium text-gray-700">
                    {ind.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started →
              </button>
            </div>
          </>
        )}

        {/* Skip option */}
        <button
          onClick={onSkip}
          className="mt-6 w-full text-center text-gray-400 text-sm hover:text-gray-600 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// Mini version for dashboard
export function OnboardingBanner({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Not sure where to start?
          </h3>
          <p className="text-blue-100 text-sm">
            Take 30 seconds to personalize your AI assistant
          </p>
        </div>
        <button
          onClick={onStart}
          className="bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors whitespace-nowrap"
        >
          Customize →
        </button>
      </div>
    </div>
  );
}
