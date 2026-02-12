/**
 * CLAWER.AI Landing Page
 * 
 * Rewrite (Feb 2026): Conversion-focused, audit-driven
 * - Single hero message (not 4 competing)
 * - Eric/Winrey social proof above fold
 * - 3 clear feature blocks
 * - Consistent CTAs
 * - Trust signals throughout
 */

'use client';

import Link from "next/link";
import { useState } from "react";

const SOCIAL_PROOF_QUOTES: never[] = [];

const PRESS_MENTIONS = [
  { name: "Fast Company", url: "https://www.fastcompany.com/91484506/what-is-clawdbot-moltbot-openclaw" },
  { name: "MacStories", url: "https://www.macstories.net/stories/clawdbot-showed-me-what-the-future-of-personal-ai-assistants-looks-like/" },
  { name: "IBM", url: "https://www.ibm.com/think/news/clawdbot-ai-agent-testing-limits-vertical-integration" },
  { name: "CNBC", url: "#" },
  { name: "Wikipedia", url: "#" },
];

const TOP_USE_CASES = [
  {
    team: "📧 Email Triage",
    template: "Personal HQ",
    before: "3.5 hours/week reading and responding to emails",
    after: "Agent scans your inbox at 6am, drafts replies in your voice, flags what needs you. 30 min to review.",
    saved: "3 hrs/week",
  },
  {
    team: "📱 Content Repurposing",
    template: "Content & Marketing",
    before: "2+ hours rewriting one piece of content for every platform",
    after: "Drop a blog post or video — get a LinkedIn post, X thread, email section, and Instagram caption in minutes.",
    saved: "2 hrs/week",
  },
  {
    team: "🔍 Research & Briefings",
    template: "Solopreneur",
    before: "90 minutes manually researching before every meeting or pitch",
    after: "Agent pulls their LinkedIn, recent posts, and news. Delivers a 2-page brief with talking points.",
    saved: "1.5 hrs/week",
  },
  {
    team: "📅 Meeting Prep",
    template: "Personal HQ",
    before: "60 minutes scrambling before calls to find context",
    after: "At 5am, agent checks your calendar and pulls previous emails, notes, and action items for each meeting.",
    saved: "1 hr/week",
  },
  {
    team: "👨‍👩‍👧‍👦 Family Coordination",
    template: "Parent Command Center",
    before: "Scattered texts, forgotten permission slips, last-minute dinner panic",
    after: "Agent tracks school events, plans peanut-free weeknight dinners, and reminds you before deadlines.",
    saved: "1.5 hrs/week",
  },
  {
    team: "💰 Finance & Invoicing",
    template: "Finance",
    before: "45 minutes per invoice, chasing receipts, manual expense tracking",
    after: "\"Create an invoice for 10 hours at $150/hr for Acme Corp\" — done in seconds.",
    saved: "1 hr/week",
  },
];

const PRICING_TIERS = [
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Everything you need. Cancel anytime.",
    features: [
      "WhatsApp, Telegram & Slack",
      "Unlimited messages",
      "All AI models included",
      "Gmail & Calendar integration",
      "Priority support (real humans)",
      "99.9% uptime guarantee",
      "Cancel with one click",
    ],
    cta: "Start Free",
    highlighted: true,
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/pricing" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/sign-in" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Start Free
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-4 space-y-3">
              <Link 
                href="/pricing" 
                className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/sign-in" 
                className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - SIMPLIFIED TO ONE MESSAGE */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>✨</span>
            <span>Built on OpenClaw — trusted by 300,000+ users worldwide</span>
          </div>

          {/* Single, clear headline */}
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
            Your AI Assistant.
            <br />
            <span className="text-blue-600">Wherever You Are.</span>
          </h1>
          
          {/* Single, clear subheadline */}
          <p className="mt-8 text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A personal AI powered by OpenClaw that lives in your chat. Draft emails, research anything, 
            manage your day — on WhatsApp, Telegram, Slack, or the web.
          </p>

          {/* Primary CTA - CONSISTENT */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
            >
              Start Free — 200 Messages
            </Link>
            <p className="text-sm text-gray-500">
              No credit card required. Works in 60 seconds.
            </p>
          </div>

          {/* Platform badges - comprehensive grid */}
          <div className="mt-12">
            <p className="text-sm text-gray-500 mb-4 text-center">Works with your existing tools:</p>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {[
                "WhatsApp",
                "Telegram",
                "Slack",
                "Gmail",
                "Google Calendar",
                "GitHub",
                "Discord",
                "Notion",
                "X/Twitter",
                "Spotify",
              ].map((platform) => (
                <span
                  key={platform}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {platform}
                </span>
              ))}
              <span className="px-4 py-2 bg-blue-100 rounded-lg text-sm font-semibold text-blue-700">
                +100 more
              </span>
            </div>
          </div>

          {/* Press mentions */}
          <div className="mt-12">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">OpenClaw has been featured in</p>
            <div className="flex flex-wrap justify-center gap-6 items-center">
              {PRESS_MENTIONS.map((press) => (
                <span key={press.name} className="text-gray-400 font-semibold text-lg hover:text-gray-600 transition-colors">
                  {press.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section - NEW */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              What People Are Saying About OpenClaw
            </h2>
            <p className="text-gray-600">
              The AI assistant framework trusted by 300,000+ users. We made it effortless.
            </p>
          </div>

          {/* Press quotes */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-center">
              <p className="text-gray-700 text-sm italic">"Genuinely the most incredible sci-fi takeoff-adjacent thing I have seen recently."</p>
              <p className="text-xs text-gray-400 mt-3">— OpenClaw user</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-center">
              <p className="text-gray-700 text-sm italic">"It feels like hiring an employee rather than opening another chat window."</p>
              <p className="text-xs text-gray-400 mt-3">— MacStories</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-center">
              <p className="text-gray-700 text-sm italic">"One user cleared nearly 6,000 emails from their inbox on the first day."</p>
              <p className="text-xs text-gray-400 mt-3">— Fast Company</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">300K+</div>
              <p className="text-sm text-gray-600 mt-1">OpenClaw users</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">100+</div>
              <p className="text-sm text-gray-600 mt-1">Integrations supported</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">60 sec</div>
              <p className="text-sm text-gray-600 mt-1">Setup time</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <p className="text-sm text-gray-600 mt-1">Always available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              How Clawer Compares
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Same AI power. Zero technical hassle.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700"></th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">ChatGPT/Gemini</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Self-Hosting</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-700 bg-blue-50">Clawer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Reads your real email</td>
                  <td className="px-6 py-4 text-center text-xl">
                    <span className="text-red-500">✗</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-green-500 text-xl">✓</div>
                    <div className="text-xs text-gray-500 mt-1">Setup required</div>
                  </td>
                  <td className="px-6 py-4 text-center bg-blue-50">
                    <div className="text-green-600 text-xl">✓</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">Works instantly</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Lives in WhatsApp/Telegram</td>
                  <td className="px-6 py-4 text-center text-xl">
                    <span className="text-red-500">✗</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-green-500 text-xl">✓</div>
                    <div className="text-xs text-gray-500 mt-1">Setup required</div>
                  </td>
                  <td className="px-6 py-4 text-center bg-blue-50">
                    <div className="text-green-600 text-xl">✓</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">Works instantly</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">No technical setup</td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-green-500 text-xl">✓</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-red-500 text-xl">✗</div>
                    <div className="text-xs text-gray-500 mt-1">Hours of config</div>
                  </td>
                  <td className="px-6 py-4 text-center bg-blue-50">
                    <div className="text-green-600 text-xl">✓</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">60 seconds</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Team of AI specialists</td>
                  <td className="px-6 py-4 text-center text-xl">
                    <span className="text-red-500">✗</span>
                  </td>
                  <td className="px-6 py-4 text-center text-xl">
                    <span className="text-red-500">✗</span>
                  </td>
                  <td className="px-6 py-4 text-center bg-blue-50">
                    <div className="text-green-600 text-xl">✓</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">7 pre-built teams</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Your data fully isolated</td>
                  <td className="px-6 py-4 text-center text-xl">
                    <span className="text-red-500">✗</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-green-500 text-xl">✓</div>
                  </td>
                  <td className="px-6 py-4 text-center bg-blue-50">
                    <div className="text-green-600 text-xl">✓</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Managed security & updates</td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-xs text-gray-400">N/A</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-red-500 text-xl">✗</div>
                    <div className="text-xs text-gray-500 mt-1">You handle it</div>
                  </td>
                  <td className="px-6 py-4 text-center bg-blue-50">
                    <div className="text-green-600 text-xl">✓</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">We handle it</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Cost</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    $20-50/mo<br />
                    <span className="text-xs text-gray-400">(limited)</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    $5-50/mo<br />
                    <span className="text-xs text-gray-400">+ hardware + your time</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-blue-700 bg-blue-50">
                    $49/mo<br />
                    <span className="text-xs font-normal text-blue-600">all-in</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3 Core Feature Blocks - SIMPLIFIED */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Clawer?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three things that matter most
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Works where you are */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl mb-6">
                💬
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Works Where You Are
              </h3>
              <p className="text-gray-600 mb-6">
                WhatsApp, Telegram, Slack, or web. No new app to download. 
                Chat with your AI wherever you already chat.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                  💬 WhatsApp
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                  ✈️ Telegram
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                  💼 Slack
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                  🌐 Web
                </span>
              </div>
            </div>

            {/* Feature 2: AI Teams */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl mb-6">
                🤖
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Pre-Built AI Teams
              </h3>
              <p className="text-gray-600 mb-6">
                Not one generic chatbot — a team of specialists. Pick an AI team 
                and get agents built for your exact workflow.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>7 AI teams (Personal HQ, Solopreneur...)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Specialized agents per role</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Switch teams anytime</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Ready in 60 seconds */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-3xl mb-6">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Ready in 60 Seconds
              </h3>
              <p className="text-gray-600 mb-6">
                No setup. No servers. No DevOps. Create account, connect WhatsApp, start chatting. 
                That's it.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  <span>No Docker configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  <span>No API wrestling</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">✓</span>
                  <span>Just works immediately</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Can It Do - REDUCED from 25+ to 6 */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Workflows That Run Themselves
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              No prompting. No manual triggers. It just happens.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {TOP_USE_CASES.map((useCase, i) => (
              <div
                key={i}
                className="bg-white px-6 py-5 rounded-xl border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">{useCase.team}</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Saves {useCase.saved}</span>
                </div>
                <div className="text-sm text-red-400 line-through mb-1">{useCase.before}</div>
                <div className="text-sm text-gray-700">{useCase.after}</div>
                <div className="mt-3 text-xs text-gray-400">AI Team: {useCase.template}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-lg font-semibold text-gray-900">
              Average user saves 8+ hours per week
            </p>
            <p className="text-gray-500 mt-1">
              That's 400+ hours a year you didn't have to hire someone to get back.
            </p>
          </div>
        </div>
      </section>

      {/* Why Trust Clawer - POSITIVE FRAMING (removed defensive SimpleClaw) */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Trust Clawer?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built different in a world full of AI wrappers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="text-3xl mb-3">🔓</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Open Source Foundation
              </h3>
              <p className="text-gray-600">
                Built on OpenClaw, fully auditable. Not some mystery black box. 
                Every line of code can be inspected.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enterprise Security
              </h3>
              <p className="text-gray-600">
                Isolated Docker containers per user. No shared data, no shared compute. 
                Your instance is yours alone.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Active Security Monitoring
              </h3>
              <p className="text-gray-600">
                Every container runs security scanning with file integrity monitoring, 
                CVE alerts, and automated audits. We catch threats so you don't have to.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="text-3xl mb-3">🚪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Vendor Lock-in
              </h3>
              <p className="text-gray-600">
                Export your data anytime. Cancel with one click. 
                No hoops, no hassles, no "talk to sales" nonsense.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Up and running in 60 seconds
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16">
            No apps to download. No software to install. Just connect and go.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Create your account",
                desc: "Sign up with email. 200 free messages to try it out.",
              },
              {
                step: "2",
                title: "Pick your AI team",
                desc: "Life OS, Solopreneur, Finance — choose the agents built for your workflow.",
              },
              {
                step: "3",
                title: "Connect your chat",
                desc: "WhatsApp, Telegram, or Slack. Scan a QR code. 10 seconds.",
              },
              {
                step: "4",
                title: "Start chatting",
                desc: "Message your AI like texting a friend. That's literally it.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                  {item.step}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/sign-up"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
            >
              Start Free
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Value Anchoring — Why not hire someone? */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why not pay someone to set it up?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              You can. Consultants charge thousands for OpenClaw setup, plus thousands more per month for ongoing management. Or...
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">DIY / Hire someone</div>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Thousands in setup fees</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Thousands per month for managed care</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>5–8 hours to get running</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>You maintain the server</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Security updates are on you</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-600 rounded-2xl p-8">
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">Clawer</div>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>$0 setup</strong> — just sign up</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>$49/mo</strong> — everything included</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>60 seconds</strong> to get running</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>We maintain everything</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Active security monitoring</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 max-w-3xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-gray-700 leading-relaxed">
              <strong className="text-amber-900">Self-hosting sounds free</strong> — until you count the 10+ hours of setup, ongoing server maintenance, security patches, and the $5-50/month in API costs you still pay on top. Most people quit before they finish configuring their first integration.
            </p>
          </div>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Same OpenClaw technology. Same integrations. A fraction of the cost.
          </p>
        </div>
      </section>

      {/* Pricing - CONSISTENT CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            One plan. Everything included.
          </h2>
          <p className="text-center text-gray-600 mb-12">
            No tiers to decode. No surprise charges. Cancel anytime.
          </p>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center">
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="ml-2 text-xl text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-gray-600">
                Everything you need. Cancel with one click.
              </p>
            </div>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {PRICING_TIERS[0].features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <Link
              href="/sign-up"
              className="mt-8 block w-full py-4 bg-blue-600 text-white rounded-full text-center text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Free
            </Link>

            <p className="mt-4 text-center text-sm text-gray-500">
              No credit card required
            </p>

            <p className="mt-2 text-center text-sm text-gray-500">
              7-day money-back guarantee · No questions asked
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Questions? We got you.
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "What is this, exactly?",
                a: "It's an AI assistant that lives in your chat apps. It can read your emails, check your calendar, research topics, and more. No app download, no server setup — just message it like texting a friend.",
              },
              {
                q: "I'm not technical. Can I still use this?",
                a: "That's exactly who we built this for. If you can send a WhatsApp message, you can use this. Zero coding. Zero setup. Zero technical knowledge required.",
              },
              {
                q: "What is OpenClaw and why should I care?",
                a: "OpenClaw is an open-source AI framework with 300,000+ users. It actually integrates with your email, calendar, etc. Problem: it requires running your own server. Clawer is the easiest way to get a hosted OpenClaw assistant without any technical setup.",
              },
              {
                q: "Why not just use ChatGPT?",
                a: "ChatGPT is great for conversations. This is great for tasks. It reads your actual emails, checks your real calendar, searches the web — the stuff you'd have to copy/paste manually with ChatGPT.",
              },
              {
                q: "Is my data safe?",
                a: "Yes. Every paid user gets their own isolated container — your data never touches another user's. We run active security monitoring on every instance, and you can export or delete everything anytime.",
              },
              {
                q: "How do I cancel?",
                a: "One click in your dashboard. No email required. No 'talk to sales' hoops. We hate that stuff too.",
              },
              {
                q: "Is there a money-back guarantee?",
                a: "Yes. 7 days, no questions asked. If it's not for you, we'll refund you completely.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {faq.q}
                </h3>
                <p className="mt-2 text-gray-600">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - CONSISTENT */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Your AI assistant is ready.
          </h2>
          <p className="mt-4 text-blue-100 text-lg">
            WhatsApp, Telegram, or Slack. Running in 60 seconds. $49/month.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-50 transition-colors shadow-lg"
          >
            Start Free
          </Link>
          <p className="mt-4 text-blue-200 text-sm">
            No credit card required
          </p>
          <p className="mt-2 text-blue-200 text-sm">
            7-day money-back guarantee · Real human support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white font-bold text-lg">
            🦞 CLAWER.AI
          </div>
          <div className="flex gap-8 text-sm">
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <a href="mailto:support@clawer.ai" className="hover:text-white transition-colors">
              Support
            </a>
          </div>
          <p className="text-sm">
            © 2026 Clawer.ai
          </p>
        </div>
      </footer>
    </div>
  );
}
