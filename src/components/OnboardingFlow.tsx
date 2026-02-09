"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingFlowProps {
  onComplete: (preferences: OnboardingPreferences) => void;
  onSkip: () => void;
}

export interface OnboardingPreferences {
  botName: string;
  botEmoji: string;
  useCase: string;
  communicationStyle: string;
  channels: string[];
}

const EMOJI_OPTIONS = [
  "🤖", "🧠", "⚡", "🦊", "🐙", "🌟", "🎯", "🚀",
  "💡", "🔮", "🎨", "🦾", "👾", "🐝", "🌊", "🔥",
  "💎", "🦅", "🐺", "🧬", "☕", "🎸", "🦞", "🐋",
];

const USE_CASES = [
  {
    id: "personal",
    emoji: "🏠",
    title: "Personal Assistant",
    description: "Daily tasks, reminders, life management",
  },
  {
    id: "business",
    emoji: "💼",
    title: "Business",
    description: "Email drafts, reports, data analysis",
  },
  {
    id: "support",
    emoji: "🎧",
    title: "Customer Support",
    description: "Handle inquiries, FAQ, support workflows",
  },
  {
    id: "creative",
    emoji: "✍️",
    title: "Creative Writing",
    description: "Blog posts, copy, storytelling",
  },
  {
    id: "code",
    emoji: "💻",
    title: "Code Help",
    description: "Debugging, code review, explanations",
  },
];

const STYLES = [
  {
    id: "casual",
    emoji: "😎",
    title: "Casual",
    description: "Friendly, relaxed, uses emojis",
    example: "Hey! Sure thing, here's what I found 🎉",
  },
  {
    id: "professional",
    emoji: "👔",
    title: "Professional",
    description: "Clear, polished, business-appropriate",
    example: "Certainly. Here is a summary of the key findings.",
  },
  {
    id: "technical",
    emoji: "🔧",
    title: "Technical",
    description: "Precise, detailed, no fluff",
    example: "The root cause is X. Fix: apply Y to Z.",
  },
];

const CHANNELS = [
  {
    id: "whatsapp",
    emoji: "📱",
    title: "WhatsApp",
    description: "Chat from your phone",
    href: "/dashboard/whatsapp",
  },
  {
    id: "telegram",
    emoji: "✈️",
    title: "Telegram",
    description: "Fast & feature-rich",
    href: "/dashboard/telegram",
  },
  {
    id: "slack",
    emoji: "💼",
    title: "Slack",
    description: "For work teams",
    href: "/dashboard/slack",
    comingSoon: true,
  },
];

const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [botName, setBotName] = useState("");
  const [botEmoji, setBotEmoji] = useState("🤖");
  const [useCase, setUseCase] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const goForward = (nextStep: number) => {
    setDirection(1);
    setStep(nextStep);
  };

  const goBack = (prevStep: number) => {
    setDirection(-1);
    setStep(prevStep);
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    setShowConfetti(true);
    onComplete({
      botName: botName || "Assistant",
      botEmoji,
      useCase,
      communicationStyle,
      channels: selectedChannels,
    });
  };

  // Confetti effect on step 5
  useEffect(() => {
    if (step === 5) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-8 relative overflow-hidden">
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Progress */}
        <div className="flex gap-2 mb-8 mt-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step counter */}
        <div className="text-xs text-gray-400 mb-4">
          Step {step} of {TOTAL_STEPS}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Step 1: Name your AI */}
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  What should we call your AI? 🎨
                </h2>
                <p className="text-gray-500 mb-6">
                  Give it a name and pick an avatar — make it yours
                </p>

                {/* Emoji Picker */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Pick an avatar
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setBotEmoji(emoji)}
                        className={`text-2xl p-2 rounded-xl transition-all ${
                          botEmoji === emoji
                            ? "bg-blue-100 ring-2 ring-blue-500 scale-110"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name Input */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Name your assistant
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{botEmoji}</span>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="e.g., Max, Aria, Buddy..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-colors"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  onClick={() => goForward(2)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 2: Use Case */}
            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  What&apos;s your main use case? 🎯
                </h2>
                <p className="text-gray-500 mb-6">
                  This helps us tailor your AI&apos;s behavior
                </p>

                <div className="space-y-3 mb-6">
                  {USE_CASES.map((uc) => (
                    <button
                      key={uc.id}
                      onClick={() => setUseCase(uc.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        useCase === uc.id
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{uc.emoji}</span>
                        <div>
                          <div className="font-medium text-gray-900">
                            {uc.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {uc.description}
                          </div>
                        </div>
                        {useCase === uc.id && (
                          <span className="ml-auto text-blue-600">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goBack(1)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => goForward(3)}
                    disabled={!useCase}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Communication Style */}
            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Pick a communication style 💬
                </h2>
                <p className="text-gray-500 mb-6">
                  How should your AI talk to you?
                </p>

                <div className="space-y-3 mb-6">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setCommunicationStyle(style.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        communicationStyle === style.id
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{style.emoji}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {style.title}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {style.description}
                          </div>
                          <div className="text-xs text-gray-400 italic bg-gray-50 rounded-lg px-3 py-2">
                            &ldquo;{style.example}&rdquo;
                          </div>
                        </div>
                        {communicationStyle === style.id && (
                          <span className="text-blue-600 mt-1">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goBack(2)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => goForward(4)}
                    disabled={!communicationStyle}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 4: Connect Channels */}
            {step === 4 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Connect your channels 🔗
                </h2>
                <p className="text-gray-500 mb-6">
                  Chat with your AI on the platforms you already use. You can always set these up later.
                </p>

                <div className="space-y-3 mb-6">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => !ch.comingSoon && toggleChannel(ch.id)}
                      disabled={ch.comingSoon}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        ch.comingSoon
                          ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                          : selectedChannels.includes(ch.id)
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ch.emoji}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {ch.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ch.description}
                          </div>
                        </div>
                        {ch.comingSoon ? (
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                            Coming soon
                          </span>
                        ) : selectedChannels.includes(ch.id) ? (
                          <span className="text-blue-600">✓</span>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goBack(3)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => goForward(5)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    {selectedChannels.length > 0 ? "Continue" : "Skip for now"}
                  </button>
                </div>
              </>
            )}

            {/* Step 5: All Set */}
            {step === 5 && (
              <div className="text-center py-4">
                {/* Confetti burst */}
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: [
                            "#3B82F6",
                            "#8B5CF6",
                            "#EC4899",
                            "#F59E0B",
                            "#10B981",
                            "#6366F1",
                          ][i % 6],
                          left: `${50 + (Math.random() - 0.5) * 20}%`,
                          top: "40%",
                        }}
                        animate={{
                          x: (Math.random() - 0.5) * 400,
                          y: Math.random() * -300 - 50,
                          opacity: [1, 1, 0],
                          scale: [0, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5 + Math.random(),
                          ease: "easeOut",
                          delay: Math.random() * 0.3,
                        }}
                      />
                    ))}
                  </div>
                )}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  You&apos;re all set!
                </h2>
                <p className="text-gray-500 mb-2">
                  Meet <span className="font-semibold text-blue-600">{botEmoji} {botName || "Assistant"}</span>, your new AI assistant.
                </p>
                <p className="text-sm text-gray-400 mb-8">
                  You have <span className="font-semibold text-blue-600">50 free messages</span> to try it out — no credit card needed.
                </p>

                {/* Summary card */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Name</span>
                      <p className="font-medium text-gray-900">{botEmoji} {botName || "Assistant"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Style</span>
                      <p className="font-medium text-gray-900 capitalize">{communicationStyle}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Use case</span>
                      <p className="font-medium text-gray-900 capitalize">
                        {USE_CASES.find((u) => u.id === useCase)?.title || "General"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Channels</span>
                      <p className="font-medium text-gray-900">
                        {selectedChannels.length > 0
                          ? selectedChannels.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")
                          : "Web (default)"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-lg"
                >
                  Start Chatting →
                </button>

                <button
                  onClick={() => goBack(4)}
                  className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Go back and edit
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Skip option (steps 1-4 only) */}
        {step < 5 && (
          <button
            onClick={onSkip}
            className="mt-6 w-full text-center text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Skip for now
          </button>
        )}
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
