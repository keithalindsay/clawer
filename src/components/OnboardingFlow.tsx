"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TEAM_CONFIGS } from "@/lib/teams";
import { trackEvent } from "@/lib/analytics";

interface OnboardingFlowProps {
  onComplete: (preferences: OnboardingPreferences) => void;
  onSkip: () => void;
}

export interface OnboardingPreferences {
  botName: string;
  botEmoji: string;
  communicationStyle: string;
  channels: string[];
  teamTemplate: string;
}

const EMOJI_OPTIONS = [
  "🤖", "🧠", "⚡", "🦊", "🐙", "🌟", "🎯", "🚀",
  "💡", "🔮", "🎨", "🦾", "👾", "🐝", "🌊", "🔥",
  "💎", "🦅", "🐺", "🧬", "☕", "🎸", "🦞", "🐋",
];

const STYLES = [
  { id: "casual", emoji: "😎", title: "Casual", description: "Friendly, relaxed, uses emojis" },
  { id: "professional", emoji: "👔", title: "Professional", description: "Clear, polished, business-appropriate" },
  { id: "technical", emoji: "🔧", title: "Technical", description: "Precise, detailed, no fluff" },
];

const CHANNELS = [
  { id: "whatsapp", emoji: "📱", title: "WhatsApp", description: "Chat from your phone", href: "/dashboard/whatsapp" },
  { id: "telegram", emoji: "✈️", title: "Telegram", description: "Fast & feature-rich", href: "/dashboard/telegram" },
];

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 80 : -80, opacity: 0 }),
};

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [botName, setBotName] = useState("");
  const [botEmoji, setBotEmoji] = useState("🤖");
  const [communicationStyle, setCommunicationStyle] = useState("casual");
  const [teamTemplate, setTeamTemplate] = useState("lifeos");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const goTo = (target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
    const stepEvents = ['', 'funnel_onboard_step1', 'funnel_onboard_step2', 'funnel_onboard_step3'] as const;
    if (stepEvents[target]) trackEvent(stepEvents[target]);
  };

  const handleStartChatting = () => {
    trackEvent('funnel_onboard_complete', { team: teamTemplate });
    setShowConfetti(true);
    setTimeout(() => {
      onComplete({
        botName: botName || "Assistant",
        botEmoji,
        communicationStyle,
        channels: [],
        teamTemplate,
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 relative overflow-hidden">
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

        <div className="text-xs text-gray-400 mb-4">Step {step} of {TOTAL_STEPS}</div>

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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Setup ⚡</h2>
                <p className="text-gray-500 mb-6">Personalize your assistant — takes 10 seconds</p>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Name & Avatar</label>
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
                  <div className="grid grid-cols-12 gap-1">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setBotEmoji(emoji)}
                        className={`text-xl p-1.5 rounded-lg transition-all ${
                          botEmoji === emoji ? "bg-blue-100 ring-2 ring-blue-500 scale-110" : "hover:bg-gray-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Communication Style</label>
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
                        <div className="font-semibold text-gray-900 text-sm mb-1">{style.title}</div>
                        <div className="text-xs text-gray-500">{style.description}</div>
                        {communicationStyle === style.id && <div className="text-blue-600 mt-2">✓</div>}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => goTo(2)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                  Continue
                </button>
              </>
            )}

            {/* Step 2: Choose AI Team */}
            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your AI Team 🤝</h2>
                <p className="text-gray-500 mb-6">Pick a team template — you can change this anytime</p>

                <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-1">
                  {Object.entries(TEAM_CONFIGS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setTeamTemplate(key)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        teamTemplate === key
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">{config.name}</span>
                        {teamTemplate === key && <span className="text-blue-600 text-sm">✓ Selected</span>}
                      </div>
                      {config.description && (
                        <p className="text-sm text-gray-500 mb-2">{config.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {config.members.slice(0, 4).map((m) => (
                          <span key={m.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {m.emoji || '🤖'} {m.name}
                          </span>
                        ))}
                        {config.members.length > 4 && (
                          <span className="text-xs text-gray-400">+{config.members.length - 4} more</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => goTo(1)} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                    ← Back
                  </button>
                  <button onClick={() => goTo(3)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Terms of Service */}
            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost There! 📋</h2>
                <p className="text-gray-500 mb-6">One last thing before you get started</p>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tosAccepted}
                      onChange={(e) => setTosAccepted(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the{' '}
                      <Link href="/terms" target="_blank" className="text-blue-600 underline hover:text-blue-700">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" target="_blank" className="text-blue-600 underline hover:text-blue-700">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => goTo(2)} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={() => goTo(4)}
                    disabled={!tosAccepted}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      tosAccepted
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 4: Start Chatting */}
            {step === 4 && (
              <div className="relative">
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#6366F1"][i % 6],
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

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Chatting! 🎉</h2>
                <p className="text-gray-500 mb-6">You're all set! Your AI team is ready to help.</p>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{botEmoji}</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{botName || "Assistant"}</div>
                      <div className="text-sm text-gray-600 capitalize">{communicationStyle} style</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Team: <span className="font-medium">{TEAM_CONFIGS[teamTemplate]?.name || teamTemplate}</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-sm text-gray-700 border border-gray-100 shadow-sm">
                    <div className="font-medium text-gray-900 mb-2">👋 Hey there!</div>
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

                <button
                  onClick={handleStartChatting}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-lg mb-6"
                >
                  Start Chatting →
                </button>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Optional: Connect messaging apps</h3>
                  <p className="text-xs text-gray-500 mb-4">Chat from your phone or wherever you work. You can always set these up later.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {CHANNELS.map((ch) => (
                      <Link
                        key={ch.id}
                        href={ch.href}
                        className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                        onClick={(e) => e.preventDefault()}
                      >
                        <div className="text-2xl mb-1">{ch.emoji}</div>
                        <div className="text-sm font-medium text-gray-900">{ch.title}</div>
                        <div className="text-xs text-gray-500">{ch.description}</div>
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">Skip this — you can connect anytime from your dashboard</p>
                </div>

                <button onClick={() => goTo(3)} className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  ← Go back and edit
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step === 1 && (
          <button onClick={onSkip} className="mt-6 w-full text-center text-gray-400 text-sm hover:text-gray-600 transition-colors">
            Skip setup — use defaults
          </button>
        )}
      </div>
    </div>
  );
}

export function OnboardingBanner({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Personalize your assistant</h3>
          <p className="text-blue-100 text-sm">Takes 10 seconds — set your style and start chatting</p>
        </div>
        <button onClick={onStart} className="bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors whitespace-nowrap">
          Quick Setup →
        </button>
      </div>
    </div>
  );
}
