"use client";

import { useState } from "react";

interface StarterPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const PROMPT_CATEGORIES = [
  {
    emoji: "🌅",
    label: "Morning",
    prompts: [
      "Set up a morning briefing with industry news",
      "Prep me for my first meeting today",
      "What's on my calendar and what should I prioritize?",
    ],
  },
  {
    emoji: "📄",
    label: "Documents",
    prompts: [
      "Summarize this PDF in 5 bullet points",
      "Review this contract and flag key terms",
      "Explain this legal document simply",
    ],
  },
  {
    emoji: "✍️",
    label: "Writing",
    prompts: [
      "Turn this into 5 social media posts",
      "Draft a follow-up email for my last meeting",
      "Rewrite this in a more conversational tone",
    ],
  },
  {
    emoji: "💰",
    label: "Money",
    prompts: [
      "What subscriptions am I paying for?",
      "Categorize my spending from last month",
      "Generate an invoice for this project",
    ],
  },
  {
    emoji: "🎯",
    label: "Productivity",
    prompts: [
      "Turn this brain dump into a project plan",
      "Who should I follow up with this week?",
      "Review my habits and score my week",
    ],
  },
  {
    emoji: "📊",
    label: "Research",
    prompts: [
      "What did my competitors announce this week?",
      "Find recent news about [topic]",
      "Compare these 3 options for me",
    ],
  },
];

const QUICK_PROMPTS = [
  "Set up a morning briefing with industry news",
  "Summarize this PDF for me",
  "Draft a follow-up email for my last meeting",
  "What subscriptions am I paying for?",
  "Turn this brain dump into action items",
];

export function StarterPrompts({ onSelectPrompt }: StarterPromptsProps) {
  const [showAll, setShowAll] = useState(false);

  if (!showAll) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            What would you like to automate?
          </h2>
          <p className="text-gray-500 text-sm">
            Pick one to get started, or type your own request
          </p>
        </div>

        <div className="space-y-3">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelectPrompt(prompt)}
              className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-700"
            >
              {prompt}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAll(true)}
          className="mt-6 w-full text-center text-blue-600 text-sm font-medium hover:underline"
        >
          Show all 30 automation ideas →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          30 Things Your AI Can Do
        </h2>
        <p className="text-gray-500 text-sm">
          Pick any one — your life gets better
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {PROMPT_CATEGORIES.map((category) => (
          <div key={category.label} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </div>
            {category.prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSelectPrompt(prompt)}
                className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-600"
              >
                {prompt}
              </button>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAll(false)}
        className="w-full text-center text-gray-500 text-sm hover:underline"
      >
        ← Show less
      </button>
    </div>
  );
}

// Simple inline version for compact spaces
export function QuickPrompts({ onSelectPrompt }: StarterPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelectPrompt(prompt)}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
