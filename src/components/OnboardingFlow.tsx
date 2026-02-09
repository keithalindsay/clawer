"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface OnboardingFlowProps {
  onComplete: (preferences: OnboardingPreferences) => void;
  onSkip: () => void;
}

export interface OnboardingPreferences {
  botName: string;
  botEmoji: string;
  communicationStyle: string;
  channels: string[];
}

const EMOJI_OPTIONS = [
  "🤖", "🧠", "⚡", "🦊", "🐙", "🌟", "🎯", "🚀",
  "💡", "🔮", "🎨", "🦾", "👾", "🐝", "🌊", "🔥",
  "💎", "🦅", "🐺", "🧬", "☕", "🎸", "🦞", "🐋",
];

const STYLES = [
  {
    id: "casual",
    emoji: "😎",
    title: "Casual",
    description: "Friendly, relaxed, uses emojis",
  },
  {
    id: "professional",
    emoji: "👔",
    title: "Professional",
    description: "Clear, polished, business-appropriate",
  },
  {
    id: "technical",
    emoji: "🔧",
    title: "Technical",
    description: "Precise, detailed, no fluff",
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
];

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
  const [communicationStyle, setCommunicationStyle] = useState("casual");
  const [showConfetti, setShowConfetti] = useState(false);

  const goForward = () => {
    setDirection(1);
    setStep(2);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(1);
  };

  const handleStartChatting = () => {
    // Trigger confetti
    setShowConfetti(true);
    
    // Complete onboarding after a brief delay to show confetti
    setTimeout(() => {
      onComplete({
        botName: botName || "Assistant",
        botEmoji,
        communicationStyle,
        channels: [], // Channels are optional suggestions, not required
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 relative overflow-hidden">
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Progress */}
        <div className="flex gap-2 mb-8 mt-2">
          {[1, 2].map((s) => (
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
          Step {step} of 2
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
            {/* Step 1: Quick Setup */}
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Quick Setup ⚡
                </h2>
                <p className="text-gray-500 mb-6">
                  Personalize your assistant — takes 10 seconds
                </p>

                {/* Name + Emoji Picker */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Name & Avatar
                  </label>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{botEmoji}</span>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="Assistant"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-colors"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  
                  {/* Emoji Picker - Compact */}
                  <div className="grid grid-cols-12 gap-1">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setBotEmoji(emoji)}
                        className={`text-xl p-1.5 rounded-lg transition-all ${
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

                {/* Communication Style - Inline Cards */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Communication Style
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setCommunicationStyle(style.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          communicationStyle === style.id
                            ? "border-blue-600 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-3xl mb-2">{style.emoji}</div>
                        <div className="font-semibold text-gray-900 text-sm mb-1">
                          {style.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {style.description}
                        </div>
                        {communicationStyle === style.id && (
                          <div className="text-blue-600 mt-2">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={goForward}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 2: Start Chatting */}
            {step === 2 && (
              <div className="relative">
                {/* Confetti burst */}
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
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
                          x: (Math.random() - 0.5) * 500,
                          y: Math.random() * -400 - 50,
                          opacity: [1, 1, 0],
                          scale: [0, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.8 + Math.random(),
                          ease: "easeOut",
                          delay: Math.random() * 0.2,
                        }}
                      />
                    ))}
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Start Chatting! 🎉
                </h2>
                <p className="text-gray-500 mb-6">
                  You're all set! Your AI assistant is ready to help.
                </p>

                {/* Preview of their setup */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{botEmoji}</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {botName || "Assistant"}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {communicationStyle} style
                      </div>
                    </div>
                  </div>
                  
                  {/* Welcome message preview */}
                  <div className="bg-white rounded-lg p-4 text-sm text-gray-700 border border-gray-100 shadow-sm">
                    <div className="font-medium text-gray-900 mb-2">
                      👋 Hey there!
                    </div>
                    <p>
                      I'm {botName || "your assistant"}. I can help you with emails, research, 
                      brainstorming, and pretty much anything you need. Try asking me to:
                    </p>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• Summarize an article</li>
                      <li>• Draft an email</li>
                      <li>• Research a topic</li>
                    </ul>
                  </div>
                </div>

                {/* Big CTA to start chatting */}
                <button
                  onClick={handleStartChatting}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-lg mb-6"
                >
                  Start Chatting →
                </button>

                {/* Optional: Connect Channels - Non-blocking suggestions */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Optional: Connect messaging apps
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Chat from your phone or wherever you work. You can always set these up later.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {CHANNELS.map((ch) => (
                      <Link
                        key={ch.id}
                        href={ch.href}
                        className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                        onClick={(e) => {
                          // Allow user to continue without connecting
                          e.preventDefault();
                          // Open in new flow after onboarding completes
                        }}
                      >
                        <div className="text-2xl mb-1">{ch.emoji}</div>
                        <div className="text-sm font-medium text-gray-900">
                          {ch.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ch.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Skip this — you can connect anytime from your dashboard
                  </p>
                </div>

                {/* Back button */}
                <button
                  onClick={goBack}
                  className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Go back and edit
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Skip option (step 1 only) */}
        {step === 1 && (
          <button
            onClick={onSkip}
            className="mt-6 w-full text-center text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Skip setup — use defaults
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
            Personalize your assistant
          </h3>
          <p className="text-blue-100 text-sm">
            Takes 10 seconds — set your style and start chatting
          </p>
        </div>
        <button
          onClick={onStart}
          className="bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors whitespace-nowrap"
        >
          Quick Setup →
        </button>
      </div>
    </div>
  );
}
