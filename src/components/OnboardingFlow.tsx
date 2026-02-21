"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TEAM_CONFIGS } from "@/lib/teams";
import { trackEvent } from "@/lib/analytics";
import {
  ONBOARDING_TEMPLATES,
  getOnboardingTemplate,
  PROGRESS_MESSAGES,
  type OnboardingTemplate,
  type Question,
} from "@/lib/onboarding-prompts";

// ─── Types ────────────────────────────────────────────────────────────────

export interface OnboardingPreferences {
  botName: string;
  botEmoji: string;
  communicationStyle: string;
  channels: string[];
  teamTemplate: string;
}

interface DeliverableResult {
  content: string;
  title: string;
  icon: string;
  saved: boolean;
  savedPath: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  "🤖", "🧠", "⚡", "🦊", "🐙", "🌟", "🎯", "🚀",
  "💡", "🔮", "🎨", "🦾", "👾", "🐝", "🌊", "🔥",
  "💎", "🦅", "🐺", "🧬", "☕", "🎸", "🦞", "🐋",
];

const STYLES = [
  { id: "casual", emoji: "😎", title: "Casual", description: "Friendly, uses emojis" },
  { id: "professional", emoji: "👔", title: "Professional", description: "Clear, polished" },
  { id: "technical", emoji: "🔧", title: "Technical", description: "Precise, no fluff" },
];

const CHANNELS = [
  {
    id: "whatsapp",
    emoji: "💬",
    name: "WhatsApp",
    description: "Get your morning briefing as a text message.",
    secondary: "Most popular for daily updates.",
  },
  {
    id: "telegram",
    emoji: "✈️",
    name: "Telegram",
    description: "Same experience via Telegram.",
    secondary: "Great for power users.",
  },
  {
    id: "slack",
    emoji: "🔔",
    name: "Slack",
    description: "Get updates in a Slack channel.",
    secondary: "Best for team collaboration.",
  },
  {
    id: "web",
    emoji: "🌐",
    name: "Web only",
    description: "I'll check the app for updates.",
    secondary: "You can connect channels later in Settings.",
  },
];

const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 80 : -80, opacity: 0 }),
};

// ─── Utility ──────────────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Sub-components ───────────────────────────────────────────────────────

interface TemplateCardProps {
  template: OnboardingTemplate;
  selected: boolean;
  onSelect: (id: string) => void;
}

function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={() => onSelect(template.id)}
      className={cn(
        "p-4 rounded-xl border-2 text-left transition-all duration-200",
        selected
          ? "border-orange-500 bg-orange-50 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-sm"
      )}
    >
      <span className="text-2xl mb-2 block">{template.emoji}</span>
      <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{template.tagline}</p>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-orange-600 font-medium">Your first:</p>
        <p className="text-xs text-gray-600 mt-0.5">{template.firstDeliverable}</p>
      </div>
      {selected && (
        <div className="mt-2 text-orange-500 text-xs font-medium">✓ Selected</div>
      )}
    </button>
  );
}

interface QuestionFieldProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  index: number;
}

function QuestionField({ question, value, onChange, index }: QuestionFieldProps) {
  const multiValues = value ? value.split(",").filter(Boolean) : [];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">
        {index + 1}. {question.question}
      </label>

      {question.type === "text" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
        />
      )}

      {question.type === "radio" && (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "px-4 py-2 rounded-full border text-sm transition-colors",
                value === opt
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.type === "multi-select" && (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => {
            const isSelected = multiValues.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const updated = isSelected
                    ? multiValues.filter((v) => v !== opt)
                    : [...multiValues, opt];
                  onChange(updated.join(","));
                }}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm transition-colors",
                  isSelected
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0–100
  label: string;
}

function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: (preferences: OnboardingPreferences) => void;
  onSkip: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1 state
  const [botName, setBotName] = useState("");
  const [botEmoji, setBotEmoji] = useState("🤖");
  const [communicationStyle, setCommunicationStyle] = useState("casual");
  const [tosAccepted, setTosAccepted] = useState(false);

  // Step 2 state
  const [templateId, setTemplateId] = useState("lifeos");

  // Step 3 state
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Step 4 state
  const [preferredChannel, setPreferredChannel] = useState("web");

  // Step 5 state
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(PROGRESS_MESSAGES[0]);
  const [deliverable, setDeliverable] = useState<DeliverableResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const currentTemplate = getOnboardingTemplate(templateId);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = (target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
    trackEvent(
      `funnel_onboard_step${target}` as Parameters<typeof trackEvent>[0]
    );
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const canProceedStep3 = () => {
    if (!currentTemplate) return false;
    // Require at least 2 of 3 questions answered
    const answered = currentTemplate.questions.filter(
      (q) => (answers[q.id] || "").trim().length > 0
    ).length;
    return answered >= 2;
  };

  // Start generation when entering step 5
  useEffect(() => {
    if (step === 5 && !isGenerating && !deliverable) {
      startGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const startGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);

    // Animate progress bar while waiting
    let progressVal = 0;
    let msgIndex = 0;
    setStatusMessage(PROGRESS_MESSAGES[0]);

    progressIntervalRef.current = setInterval(() => {
      progressVal += Math.random() * 8 + 2;
      if (progressVal > 90) progressVal = 90; // Don't complete until response arrives
      setGenerationProgress(progressVal);

      const newMsgIndex = Math.min(
        Math.floor((progressVal / 90) * (PROGRESS_MESSAGES.length - 1)),
        PROGRESS_MESSAGES.length - 2
      );
      if (newMsgIndex !== msgIndex) {
        msgIndex = newMsgIndex;
        setStatusMessage(PROGRESS_MESSAGES[newMsgIndex]);
      }
    }, 800);

    try {
      // Save context first
      await fetch("/api/onboarding/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, answers, preferredChannel }),
      });

      // Generate deliverable
      const res = await fetch("/api/onboarding/first-deliverable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, answers }),
      });

      const data = await res.json();

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      setGenerationProgress(100);
      setStatusMessage("Done! Here's your " + (currentTemplate?.deliverableTitle || "deliverable"));

      if (data.content) {
        setDeliverable(data);
      } else {
        setGenerationError(data.error || "Generation failed");
      }
    } catch (err: any) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setGenerationError(err.message || "Something went wrong");
      setGenerationProgress(100);
      setStatusMessage("An error occurred — see below");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = async () => {
    trackEvent("funnel_onboard_complete", { team: templateId });

    // Save full onboarding preferences
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botName: botName || "Assistant",
          botEmoji,
          communicationStyle,
          channels: preferredChannel !== "web" ? [preferredChannel] : [],
          teamTemplate: templateId,
        }),
      });
    } catch (e) {
      console.error("Failed to save onboarding preferences:", e);
    }

    onComplete({
      botName: botName || "Assistant",
      botEmoji,
      communicationStyle,
      channels: preferredChannel !== "web" ? [preferredChannel] : [],
      teamTemplate: templateId,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 relative overflow-hidden">
        {/* Orange top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between mb-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦞</span>
            <span className="font-semibold text-gray-900 text-sm">Clawer.ai</span>
          </div>
          <span className="text-xs text-gray-400">Step {step} of {TOTAL_STEPS}</span>
        </div>

        {/* Step progress dots */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                s <= step ? "bg-orange-500" : "bg-gray-200"
              )}
            />
          ))}
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

            {/* ─── Step 1: Welcome ─── */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick Setup ⚡</h2>
                <p className="text-gray-500 mb-6 text-sm">Name your assistant — takes 10 seconds</p>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Name & Avatar</label>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{botEmoji}</span>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="Assistant"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-orange-500 focus:outline-none transition-colors"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setBotEmoji(emoji)}
                        className={cn(
                          "text-xl p-1.5 rounded-lg transition-all",
                          botEmoji === emoji
                            ? "bg-orange-100 ring-2 ring-orange-500 scale-110"
                            : "hover:bg-gray-100"
                        )}
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
                        type="button"
                        onClick={() => setCommunicationStyle(style.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-center",
                          communicationStyle === style.id
                            ? "border-orange-500 bg-orange-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="text-3xl mb-2">{style.emoji}</div>
                        <div className="font-semibold text-gray-900 text-sm mb-1">{style.title}</div>
                        <div className="text-xs text-gray-500">{style.description}</div>
                        {communicationStyle === style.id && (
                          <div className="text-orange-500 mt-2 text-xs">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ToS in step 1 */}
                <div className="mb-6 bg-gray-50 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tosAccepted}
                      onChange={(e) => setTosAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-orange-500"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="text-orange-600 underline hover:text-orange-700">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" target="_blank" className="text-orange-600 underline hover:text-orange-700">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                <button
                  onClick={() => goTo(2)}
                  disabled={!tosAccepted}
                  className={cn(
                    "w-full py-3 rounded-xl font-medium transition-colors",
                    tosAccepted
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* ─── Step 2: Template Selection ─── */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your team template</h2>
                <p className="text-gray-500 mb-6 text-sm">
                  Pick what fits your life — you'll get a personalized deliverable in minutes.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-h-[420px] overflow-y-auto pr-1">
                  {ONBOARDING_TEMPLATES.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      selected={templateId === template.id}
                      onSelect={setTemplateId}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goTo(1)}
                    className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => goTo(3)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 3: Context Questions ─── */}
            {step === 3 && currentTemplate && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Your agent needs 3 things
                </h2>
                <p className="text-gray-500 mb-6 text-sm">
                  These aren&apos;t profile questions — they&apos;re your agent&apos;s first instructions.
                  Answer quickly; your agent will learn more over time.
                </p>

                <div className="space-y-6 mb-8">
                  {currentTemplate.questions.map((question, i) => (
                    <QuestionField
                      key={question.id}
                      question={question}
                      value={answers[question.id] || ""}
                      onChange={(val) => handleAnswer(question.id, val)}
                      index={i}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goTo(2)}
                    className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => goTo(4)}
                    disabled={!canProceedStep3()}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-medium transition-colors",
                      canProceedStep3()
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    Continue →
                  </button>
                </div>

                {!canProceedStep3() && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Answer at least 2 questions to continue
                  </p>
                )}
              </div>
            )}

            {/* ─── Step 4: Channel Connection ─── */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Where should your agent reach you?
                </h2>
                <p className="text-gray-500 mb-6 text-sm">
                  Connect a channel so your agent can send you updates and your morning briefing.
                  Start with WhatsApp — it&apos;s the easiest.
                </p>

                <div className="space-y-3 mb-8">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setPreferredChannel(ch.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all",
                        preferredChannel === ch.id
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{ch.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{ch.name}</h3>
                            {preferredChannel === ch.id && (
                              <span className="text-orange-500 text-sm font-medium">✓ Selected</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{ch.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{ch.secondary}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goTo(3)}
                    className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => goTo(5)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    Generate My {currentTemplate?.deliverableTitle?.split(" ").slice(-2).join(" ") || "Deliverable"} →
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 5: First Deliverable ─── */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  🎉 Your agent is working...
                </h2>
                <p className="text-gray-500 mb-6 text-sm">
                  Generating your personalized{" "}
                  <span className="font-medium text-orange-600">
                    {currentTemplate?.deliverableTitle}
                  </span>
                </p>

                {/* Progress */}
                <div className="mb-6">
                  <ProgressBar value={generationProgress} label={statusMessage} />
                </div>

                {/* Deliverable preview */}
                {deliverable && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 max-h-[300px] overflow-y-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{deliverable.icon}</span>
                        <h3 className="font-semibold text-gray-900">{deliverable.title}</h3>
                        {deliverable.saved && (
                          <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            ✓ Saved to Files
                          </span>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {deliverable.content}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2 text-xs text-gray-500">
                      <span>✓ Saved to your agent&apos;s memory</span>
                      {preferredChannel !== "web" && (
                        <span>• Will be sent to {preferredChannel} after setup</span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Error state */}
                {generationError && !deliverable && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <p className="font-medium">Generation encountered an issue</p>
                    <p className="mt-1 text-xs">{generationError}</p>
                    <p className="mt-2 text-xs text-gray-600">
                      No worries — your agent will create this for you in your dashboard.
                    </p>
                  </div>
                )}

                {/* Completion button */}
                {(deliverable || generationError) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      onClick={handleComplete}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl text-lg"
                    >
                      Go to Dashboard →
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3">
                      Your agent is set up and ready to help
                    </p>
                  </motion.div>
                )}

                {/* Still generating */}
                {isGenerating && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        ⚙️
                      </motion.span>
                      <span>Generating your personalized {currentTemplate?.deliverableTitle}...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {step === 1 && (
          <button
            onClick={onSkip}
            className="mt-4 w-full text-center text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Skip setup — use defaults
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Banner (used in dashboard) ───────────────────────────────────────────

export function OnboardingBanner({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Personalize your assistant</h3>
          <p className="text-orange-100 text-sm">Takes 4 minutes — get your first deliverable instantly</p>
        </div>
        <button
          onClick={onStart}
          className="bg-white text-orange-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-50 transition-colors whitespace-nowrap"
        >
          Quick Setup →
        </button>
      </div>
    </div>
  );
}
