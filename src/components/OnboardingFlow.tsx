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
  teamTemplate: string;
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

const TEAM_TEMPLATES = [
  {
    id: "lifeos",
    emoji: "🧬",
    title: "Life OS",
    subtitle: "Personal command center",
    description: "5 AI employees manage your goals, tasks, research, schedule, and wellness. Like having a personal chief of staff.",
    members: ["Max (Chief of Staff)", "North (Goals)", "Scout (Research)", "Dash (Tasks)", "Zen (Wellness)"],
    color: "blue",
  },
  {
    id: "ecommerce",
    emoji: "🛒",
    title: "E-Commerce",
    subtitle: "Your online store team",
    description: "AI team handles analytics, marketing, content, customer support, and operations for your store.",
    members: ["Analyst", "Marketing", "Content Writer", "Support", "Operations"],
    color: "green",
  },
  {
    id: "mom",
    emoji: "👩‍👧‍👦",
    title: "Mom's Command Center",
    subtitle: "Family life, organized",
    description: "AI team manages meals, calendars, homework help, housekeeping, and family care coordination.",
    members: ["Mel (Meals)", "Cal (Calendar)", "Prof (Homework)", "Tidy (House)", "Care (Health)"],
    color: "pink",
  },
];

const TOTAL_STEPS = 4;

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [industry, setIndustry] = useState("");
  const [teamTemplate, setTeamTemplate] = useState("lifeos");

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
      teamTemplate,
    });
  };

  const colorClasses: Record<string, { border: string; bg: string; ring: string }> = {
    blue: { border: "border-blue-600", bg: "bg-blue-50", ring: "ring-blue-600" },
    green: { border: "border-green-600", bg: "bg-green-50", ring: "ring-green-600" },
    pink: { border: "border-pink-500", bg: "bg-pink-50", ring: "ring-pink-500" },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
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
              What&apos;s your main goal?
            </h2>
            <p className="text-gray-500 mb-6">
              We&apos;ll customize your experience based on this
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
                onClick={() => setStep(4)}
                disabled={!industry}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 4: AI Team Template */}
        {step === 4 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Choose your AI team
            </h2>
            <p className="text-gray-500 mb-6">
              Pick a pre-built team of AI employees — they start working for you immediately
            </p>

            <div className="space-y-4 mb-6">
              {TEAM_TEMPLATES.map((team) => {
                const colors = colorClasses[team.color] || colorClasses.blue;
                const isSelected = teamTemplate === team.id;
                return (
                  <button
                    key={team.id}
                    onClick={() => setTeamTemplate(team.id)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${colors.border} ${colors.bg} ring-1 ${colors.ring}`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl mt-0.5">{team.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{team.title}</span>
                          <span className="text-xs text-gray-400">— {team.subtitle}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {team.members.map((member) => (
                            <span
                              key={member}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-blue-600 text-xl">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 text-center mb-4">
              More teams coming soon: Law, Finance, Real Estate, SaaS, Marketing Agency
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Launch My Team →
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
