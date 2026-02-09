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

import Link from "next/link";

const SOCIAL_PROOF_QUOTES = [
  {
    name: "Eric Siu",
    title: "CEO, SingleGrain",
    handle: "@ericosiu",
    views: "11.7K views",
    quote: "This is exactly what I built for my 14-agent team. They made it work in 60 seconds.",
    context: "After spending weeks building OpenClaw infrastructure with memory, vector search, and agent coordination",
  },
  {
    name: "Winrey",
    title: "Team9.ai",
    handle: "@team9_ai",
    views: "23.1K views",
    quote: "After deploying OpenClaw to 50 people, I learned: The hard part isn't the AI. It's the hosting.",
    context: "On becoming a full-time IT support desk after rolling out DIY OpenClaw",
  },
];

const TOP_USE_CASES = [
  "Summarize your inbox in 30 seconds",
  "Draft professional emails",
  "Research any topic in depth",
  "Turn meeting notes into action items",
  "Find and compare products",
  "Get daily schedule overviews",
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
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
          <div className="flex items-center gap-4">
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
        </div>
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
            <span className="text-blue-600">On WhatsApp.</span>
          </h1>
          
          {/* Single, clear subheadline */}
          <p className="mt-8 text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A personal AI that lives in your chat. Draft emails, research anything, 
            manage your day — all from WhatsApp, Telegram, or Slack.
          </p>

          {/* Primary CTA - CONSISTENT */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
            >
              Start Free — 50 Messages
            </Link>
            <p className="text-sm text-gray-500">
              No credit card required. Works in 60 seconds.
            </p>
          </div>

          {/* Platform badges - simplified */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {[
              { name: "WhatsApp", icon: "💬" },
              { name: "Telegram", icon: "✈️" },
              { name: "Slack", icon: "💼" },
              { name: "Web", icon: "🌐" },
            ].map((app) => (
              <span
                key={app.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700"
              >
                <span className="text-lg">{app.icon}</span>
                <span>{app.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section - NEW */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Solving the Problems from Viral Posts
            </h2>
            <p className="text-gray-600">
              Two posts went viral this week about OpenClaw. We built Clawer to solve them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {SOCIAL_PROOF_QUOTES.map((quote) => (
              <div 
                key={quote.name}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {quote.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{quote.name}</div>
                    <div className="text-sm text-gray-500">{quote.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {quote.handle} • {quote.views}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 italic mb-3">
                  "{quote.quote}"
                </p>
                <p className="text-sm text-gray-500">
                  {quote.context}
                </p>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">300K+</div>
              <p className="text-sm text-gray-600 mt-1">OpenClaw users</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">50K+</div>
              <p className="text-sm text-gray-600 mt-1">Messages processed</p>
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

      {/* 3 Core Feature Blocks - SIMPLIFIED */}
      <section className="py-20 px-6">
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

            {/* Feature 2: Your keys, your data */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl mb-6">
                🔐
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Your Keys, Your Data
              </h3>
              <p className="text-gray-600 mb-6">
                BYOK model means your API keys go directly to YOUR isolated container. 
                We never store them. Not a wrapper—real OpenClaw.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Isolated Docker containers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Open source foundation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Export data anytime</span>
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
              What Can It Do?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Just tell it what you need in plain English
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {TOP_USE_CASES.map((useCase, i) => (
              <div
                key={i}
                className="bg-white px-5 py-4 rounded-xl border border-gray-200 text-gray-700 flex items-center gap-3"
              >
                <span className="text-blue-600 text-lg">→</span>
                <span>{useCase}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              And dozens more. If you can describe it, your AI can do it.
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
                BYOK Model
              </h3>
              <p className="text-gray-600">
                Your API keys go directly to YOUR isolated container. 
                We literally can't access your data—by design.
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
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create your account",
                desc: "Sign up with email. 50 free messages to try it out.",
              },
              {
                step: "2",
                title: "Connect WhatsApp (or Telegram, Slack...)",
                desc: "One click. Scan QR code. Takes 10 seconds.",
              },
              {
                step: "3",
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
                a: "OpenClaw is an open-source AI framework with 300,000+ users. It actually integrates with your email, calendar, etc. Problem: it requires running your own server. We made it work without that complexity.",
              },
              {
                q: "Why not just use ChatGPT?",
                a: "ChatGPT is great for conversations. This is great for tasks. It reads your actual emails, checks your real calendar, searches the web — the stuff you'd have to copy/paste manually with ChatGPT.",
              },
              {
                q: "Is my data safe?",
                a: "Yes. Your conversations are encrypted. We use a BYOK (bring your own key) model, so your API keys never touch our servers. You can delete everything anytime.",
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
