/**
 * CLAWER.AI Landing Page
 * 
 * Design principles:
 * - Outcome-first messaging (what it DOES, not what it IS)
 * - Non-technical language throughout
 * - One-click recipes for each bot
 * - Single primary CTA per section
 */

import Link from "next/link";

const FEATURED_ASSISTANTS = [
  {
    name: "Email Assistant",
    emoji: "📧",
    tagline: "Inbox zero without the work",
    examples: [
      "Summarize my unread emails in 30 seconds",
      "Draft replies to important messages",
      "Find that receipt from 3 months ago",
    ],
    color: "bg-blue-500",
  },
  {
    name: "Meeting Buddy",
    emoji: "📅",
    tagline: "Never forget what was discussed",
    examples: [
      "Turn meeting notes into action items",
      "Send follow-up emails automatically",
      "Prep me for my next meeting",
    ],
    color: "bg-purple-500",
  },
  {
    name: "Research Helper",
    emoji: "🔍",
    tagline: "Hours of research in minutes",
    examples: [
      "Compare these 3 products for me",
      "Summarize this article in 3 bullets",
      "Find recent news about [topic]",
    ],
    color: "bg-green-500",
  },
];

const CHAT_APPS = [
  { name: "WhatsApp", icon: "💬" },
  { name: "Telegram", icon: "✈️" },
  { name: "Slack", icon: "💼" },
  { name: "Discord", icon: "🎮" },
  { name: "iMessage", icon: "🍎" },
  { name: "Web Chat", icon: "🌐" },
];

const ALL_USE_CASES = [
  // Email & Communication
  "Read & summarize emails",
  "Draft replies and follow-ups", 
  "Translate messages in real time",
  "Organize your inbox",
  "Answer support tickets",
  // Productivity
  "Remind you of deadlines",
  "Plan your week",
  "Take meeting notes",
  "Summarize long documents",
  "Schedule meetings from chat",
  // Finance & Shopping
  "Track expenses and receipts",
  "Find the best prices online",
  "Price-drop alerts",
  "Compare product specs",
  "Find discount codes",
  // Business
  "Research competitors",
  "Screen and prioritize leads",
  "Generate invoices",
  "Draft contracts and NDAs",
  "Run standup summaries",
  // Content
  "Create presentations from bullets",
  "Draft social media posts",
  "Write job descriptions",
  "Find recipes from ingredients",
  "Book travel and hotels",
];

const PRICING_TIERS = [
  {
    name: "Monthly",
    price: "$49",
    period: "/month",
    description: "Everything you need. Cancel anytime.",
    features: [
      "WhatsApp, Telegram & Slack",
      "Unlimited messages",
      "All bots included",
      "Gmail & Calendar integration",
      "Priority support (real humans)",
      "99.9% uptime guarantee",
      "Cancel with one click",
    ],
    cta: "Get Started Now",
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
              href="/use-cases" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Use Cases
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Blog
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
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            AI that actually helps with your work.
            <br className="hidden md:block" />
            <span className="text-blue-600">Lives in your chat.</span>
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Draft emails. Schedule meetings. Research anything.
          </p>
          <p className="mt-3 text-lg text-gray-900 font-medium">
            All through the apps you already use. No setup. 60 seconds to start.
          </p>
          
          {/* Chat app icons */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { name: "WhatsApp", icon: "💬" },
              { name: "Telegram", icon: "✈️" },
              { name: "Slack", icon: "💼" },
              { name: "Discord", icon: "🎮" },
              { name: "iMessage", icon: "🍎" },
              { name: "Web", icon: "🌐" },
            ].map((app) => (
              <span
                key={app.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                <span>{app.icon}</span>
                <span>{app.name}</span>
              </span>
            ))}
          </div>
          
          <p className="mt-8 text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Built on OpenClaw — that AI framework everyone's talking about.
            <br className="hidden sm:block" />
            We made it work without the server nonsense.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
            >
              Try Free for 7 Days →
            </Link>
            <a
              href="#how-it-works"
              className="bg-gray-100 text-gray-700 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-200 transition-colors"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            $49/mo after trial · Cancel anytime · All platforms included
          </p>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">60 sec</div>
              <p className="mt-1 text-gray-600">Setup time</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">WhatsApp</div>
              <p className="mt-1 text-gray-600">Included (others charge extra)</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <p className="mt-1 text-gray-600">Your AI never sleeps</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Apps Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Works with the apps you already use
          </h2>
          <p className="mt-3 text-gray-600">
            No new app to download. Chat with your AI on WhatsApp, Telegram, Slack, or wherever you already are.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {CHAT_APPS.map((app) => (
              <div
                key={app.name}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-full shadow-sm"
              >
                <span className="text-xl">{app.icon}</span>
                <span className="font-medium text-gray-700">{app.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
            Up and running in 60 seconds
          </h2>
          <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">
            No apps to download. No software to install. Just connect and go.
          </p>
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Choose what you need help with",
                desc: "Email assistant? Meeting scheduler? Research helper? Pick one.",
              },
              {
                step: "2", 
                title: "Connect WhatsApp (or Telegram, Slack...)",
                desc: "One click. No app download. Use what you already have.",
              },
              {
                step: "3",
                title: "Start chatting like texting a friend",
                desc: '"Summarize my unread emails" → Done. That\'s literally it.',
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
        </div>
      </section>

      {/* Featured Assistants */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
            What can it do for you?
          </h2>
          <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">
            Each assistant comes with ready-to-use examples. Just click and go.
          </p>
          
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {FEATURED_ASSISTANTS.map((assistant) => (
              <div 
                key={assistant.name}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-14 h-14 ${assistant.color} rounded-xl flex items-center justify-center text-2xl`}>
                  {assistant.emoji}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {assistant.name}
                </h3>
                <p className="text-gray-600">
                  {assistant.tagline}
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Try these:
                  </p>
                  {assistant.examples.map((example, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      → {example}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700"
            >
              See all 12 assistants →
            </Link>
          </div>
        </div>
      </section>

      {/* What Can It Do - Scrolling Use Cases */}
      <section className="py-20 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            One assistant, endless possibilities
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Just tell it what you need in plain English
          </p>
        </div>
        <div className="relative">
          <div className="flex gap-4 animate-scroll">
            {[...ALL_USE_CASES, ...ALL_USE_CASES].map((useCase, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap shadow-sm"
              >
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Switch */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
            What you actually get
          </h2>
          <p className="mt-4 text-center text-gray-600">
            (That other services don't include)
          </p>
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            {[
              {
                icon: "💬",
                title: "WhatsApp Built In",
                desc: "Chat with your AI from the app you already use. No extra setup, no extra cost.",
              },
              {
                icon: "🔄",
                title: "Actually Stays Online",
                desc: "99.9% uptime guarantee. Your bot won't randomly go down for hours.",
              },
              {
                icon: "🧑‍💻",
                title: "Real Human Support",
                desc: "Stuck? Message us. We reply in hours, not days. Not a bot answering about your bot.",
              },
              {
                icon: "🚪",
                title: "Cancel in One Click",
                desc: "No hunting for a hidden cancel link. No email required. Just click and done.",
              },
            ].map((item, i) => (
              <div 
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-6"
              >
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
            One plan. Everything included.
          </h2>
          <p className="mt-4 text-center text-gray-600">
            No tiers to decode. No surprise charges. Cancel anytime.
          </p>

          <div className="mt-12">
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
                Start Free Trial
              </Link>
              
              <p className="mt-4 text-center text-sm text-gray-500">
                7-day money-back guarantee · No questions asked
              </p>
            </div>
          </div>

          {/* SimpleClaw comparison */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              <span className="font-medium">Switching from SimpleClaw?</span> We've got you covered.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Same price. WhatsApp included. Actual support when you need it.
            </p>
          </div>
        </div>
      </section>

      {/* Why Trust Clawer? */}
      <section className="py-20 px-6 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
            Built Different
          </h2>
          <p className="mt-4 text-center text-lg text-gray-600 max-w-2xl mx-auto">
            In a world full of AI wrapper scams, here's why Clawer is different.
          </p>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            {[
              {
                icon: "🔐",
                title: "Your Keys, Your Data",
                desc: "BYOK model means we never store your API keys on our servers. They go directly to YOUR isolated container. We literally can't access your data.",
              },
              {
                icon: "🔓",
                title: "Open Source Foundation",
                desc: "Built on OpenClaw, fully auditable. Not some mystery black box. Every line of code can be inspected.",
              },
              {
                icon: "🛡️",
                title: "Enterprise Security",
                desc: "Isolated Docker containers per user. No shared data, no shared compute. Your instance is yours alone.",
              },
              {
                icon: "🚪",
                title: "No Vendor Lock-in",
                desc: "Export your data anytime. Cancel with one click. No hoops, no hassles, no 'talk to sales' nonsense.",
              },
            ].map((item, i) => (
              <div 
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <p className="text-center text-gray-900 leading-relaxed">
              <span className="font-semibold">Unlike SimpleClaw and other AI wrapper scams,</span> Clawer gives you a real, isolated AI instance running on dedicated infrastructure. Not a shared API proxy pretending to be "your assistant."
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/blog/security"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Read Our Security Model →
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                About Clawer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
            Questions? We got you.
          </h2>
          <div className="mt-12 space-y-6">
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
                a: "OpenClaw is an open-source AI framework that went viral because it actually integrates with your email, calendar, etc. Problem: it requires running your own server. We made it work without that complexity.",
              },
              {
                q: "How is this different from SimpleClaw?",
                a: "WhatsApp is included (not extra), we have actual human support, and you can cancel with one click. Same price, more value.",
              },
              {
                q: "Why not just use ChatGPT?",
                a: "ChatGPT is great for conversations. This is great for tasks. It reads your actual emails, checks your real calendar, searches the web — the stuff you'd have to copy/paste manually with ChatGPT.",
              },
              {
                q: "What if something goes down?",
                a: "We monitor 24/7 and fix issues before you notice. If something does break, message us and we'll fix it in hours, not days.",
              },
              {
                q: "Is my data safe?",
                a: "Yes. Your conversations are encrypted. We never train AI on your data. You can delete everything anytime.",
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

      {/* Final CTA */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Stop fighting with servers.
          </h2>
          <p className="mt-4 text-blue-100 text-lg">
            OpenClaw in your favorite chat app. Running in 60 seconds. $49/month.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Start Free Trial →
          </Link>
          <p className="mt-4 text-blue-200 text-sm">
            7-day money-back guarantee · Cancel anytime · Real human support
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
