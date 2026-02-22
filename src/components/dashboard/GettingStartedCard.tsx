'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

interface GettingStartedStep {
  id: string;
  icon: string;
  label: string;
  description: string;
  done: boolean;
  action?: {
    label: string;
    href?: string;
    prompt?: string; // for chat deeplink
  };
}

interface GettingStartedCardProps {
  teamTemplate: string;
  deliverableTitle?: string;
  whatsappConnected: boolean;
  telegramConnected: boolean;
  hasStartedChat: boolean; // based on conversation count
  morningBriefingEnabled: boolean;
}

const TEMPLATE_FIRST_PROMPTS: Record<string, string> = {
  lifeos: "Give me my top 3 priorities for today",
  solopreneur: "Show me my content ideas for this week",
  'content-creator': "Show me my 4-week content calendar",
  ecommerce: "Give me the competitor analysis we created",
  'growth-ops': "Show me my growth experiment backlog",
  fitness: "Show me my workout plan for this week",
  mom: "Give me my family overview for this week",
  finance: "Show me my financial clarity snapshot",
};

const TEMPLATE_LABELS: Record<string, string> = {
  lifeos: 'Weekly Life Structure',
  solopreneur: 'Content Ideas',
  'content-creator': '4-Week Content Calendar',
  ecommerce: 'Competitor Analysis',
  'growth-ops': 'Growth Experiment Backlog',
  fitness: '4-Week Workout Plan',
  mom: 'Family Weekly Overview',
  finance: 'Financial Clarity Snapshot',
};

export function GettingStartedCard({
  teamTemplate,
  deliverableTitle,
  whatsappConnected,
  telegramConnected,
  hasStartedChat,
  morningBriefingEnabled,
}: GettingStartedCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const channelConnected = whatsappConnected || telegramConnected;
  const firstPrompt = TEMPLATE_FIRST_PROMPTS[teamTemplate] || "What can you help me with today?";
  const deliverableLabel = TEMPLATE_LABELS[teamTemplate] || deliverableTitle || 'Your Deliverable';

  const steps: GettingStartedStep[] = [
    {
      id: 'onboarding',
      icon: '✅',
      label: 'Complete setup',
      description: `You chose your template and got your first ${deliverableLabel}.`,
      done: true,
    },
    {
      id: 'first_chat',
      icon: hasStartedChat ? '✅' : '💬',
      label: 'Start your first chat',
      description: hasStartedChat
        ? "You've already chatted with your agent."
        : `Ask your agent something — try "${firstPrompt}"`,
      done: hasStartedChat,
      action: hasStartedChat
        ? undefined
        : {
            label: 'Start chatting →',
            href: `/dashboard/chat?prompt=${encodeURIComponent(firstPrompt)}`,
          },
    },
    {
      id: 'connect_channel',
      icon: channelConnected ? '✅' : '📱',
      label: 'Connect WhatsApp or Telegram',
      description: channelConnected
        ? `Channel connected — your agent can reach you outside the app.`
        : 'Connect so your agent can send your morning briefing daily.',
      done: channelConnected,
      action: channelConnected
        ? undefined
        : {
            label: 'Connect →',
            href: '/dashboard/whatsapp',
          },
    },
    {
      id: 'morning_briefing',
      icon: morningBriefingEnabled ? '✅' : '🌅',
      label: 'Set up your morning briefing',
      description: morningBriefingEnabled
        ? "You're all set — your agent will reach you every morning."
        : 'Get a daily digest from your agent at a time you choose.',
      done: morningBriefingEnabled,
      action: morningBriefingEnabled
        ? undefined
        : {
            label: 'Set up →',
            href: '/dashboard/settings',
          },
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    trackEvent('funnel_onboard_banner_dismissed');
    setDismissed(true);
  };

  return (
    <div className="bg-white border border-orange-200 rounded-xl shadow-sm overflow-hidden mb-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-base">🚀 Getting Started</h2>
          <p className="text-orange-100 text-xs mt-0.5">
            {completedCount === steps.length
              ? "You're all set! Your agent is ready to go."
              : `${completedCount} of ${steps.length} steps complete`}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-orange-200 hover:text-white transition-colors text-xs"
          aria-label="Dismiss getting started card"
        >
          Dismiss ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-orange-100">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-100">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`px-5 py-3.5 flex items-start gap-3 ${step.done ? 'opacity-60' : ''}`}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{step.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-medium ${step.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {step.label}
                </p>
                {step.action && (
                  <Link
                    href={step.action.href!}
                    className="flex-shrink-0 text-xs font-medium text-orange-600 hover:text-orange-700 whitespace-nowrap"
                    onClick={() => trackEvent('funnel_onboard_step_click')}
                  >
                    {step.action.label}
                  </Link>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
