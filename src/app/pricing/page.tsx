/**
 * CLAWER.AI Pricing Page
 *
 * Three tiers: Free (trial), Pro ($49/mo), Enterprise (contact us)
 * Comparison table + FAQ section
 */

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - CLAWER.AI",
  description:
    "Simple, transparent pricing. Start free, upgrade when you're ready. AI assistants for WhatsApp, Telegram, Slack, and more.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const TIERS = [
  {
    name: "Free",
    badge: "Trial",
    price: "$0",
    period: "/forever",
    description: "Try it out — no credit card required.",
    features: [
      "50 messages per month",
      "Web chat only",
      "1 AI model (GPT-4o)",
      "Basic email assistant",
      "Community support",
    ],
    cta: "Start Free",
    ctaHref: "/sign-up",
    highlighted: false,
    ctaStyle:
      "border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600",
  },
  {
    name: "Pro",
    badge: "Most Popular",
    price: "$49",
    period: "/month",
    description: "Everything you need. Cancel anytime.",
    features: [
      "Unlimited messages",
      "WhatsApp + Telegram + Slack",
      "Smart model routing",
      "All 12 AI assistants",
      "Gmail & Calendar sync",
      "Priority support (real humans)",
      "99.9% uptime guarantee",
    ],
    cta: "Get Started →",
    ctaHref: "/api/stripe/checkout",
    highlighted: true,
    ctaStyle: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25",
  },
  {
    name: "Enterprise",
    badge: "Custom",
    price: "Custom",
    period: "",
    description: "For teams that need more control.",
    features: [
      "Everything in Pro",
      "Custom AI models",
      "Full API access",
      "Dedicated instance",
      "SLA & uptime guarantee",
      "Team management & SSO",
      "Onboarding & training",
    ],
    cta: "Contact Us",
    ctaHref: "mailto:hello@clawer.ai",
    highlighted: false,
    ctaStyle:
      "border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600",
  },
] as const;

const COMPARISON_FEATURES = [
  { name: "Monthly messages", free: "50", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Channels", free: "Web only", pro: "WhatsApp, Telegram, Slack", enterprise: "All + custom" },
  { name: "AI models", free: "1 (GPT-4o)", pro: "Smart routing (4+ models)", enterprise: "Custom models" },
  { name: "Assistants", free: "1 (email)", pro: "All 12", enterprise: "All + custom" },
  { name: "Gmail & Calendar", free: false, pro: true, enterprise: true },
  { name: "Smart model routing", free: false, pro: true, enterprise: true },
  { name: "API access", free: false, pro: false, enterprise: true },
  { name: "Dedicated instance", free: false, pro: false, enterprise: true },
  { name: "Team management & SSO", free: false, pro: false, enterprise: true },
  { name: "SLA guarantee", free: false, pro: false, enterprise: true },
  { name: "Priority support", free: false, pro: true, enterprise: true },
  { name: "Custom onboarding", free: false, pro: false, enterprise: true },
] as const;

const FAQS = [
  {
    q: "What happens when my free 50 messages run out?",
    a: "You can keep using Clawer on the free plan — the counter resets every month. Or upgrade to Pro for unlimited messages and access to WhatsApp, Telegram, and Slack.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade, downgrade, or cancel anytime from your dashboard. No lock-in contracts, no hidden fees.",
  },
  {
    q: "What's 'smart model routing'?",
    a: "Pro uses the best AI model for each task automatically — faster models for quick answers, more powerful models for complex work. You get better results without thinking about it.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "Nope. The free plan is completely free — no credit card required. You only pay when you upgrade to Pro.",
  },
  {
    q: "What channels does Pro include?",
    a: "WhatsApp, Telegram, Slack, Discord, iMessage, and Web Chat — all included at no extra cost. Most competitors charge extra for WhatsApp.",
  },
  {
    q: "What does the Enterprise plan include?",
    a: "Custom AI models, full API access, a dedicated instance, SLA guarantees, team management with SSO, and a dedicated onboarding specialist. Email us at hello@clawer.ai and we'll build a plan for your team.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes — 7-day money-back guarantee on Pro, no questions asked. If it's not for you, we'll refund you completely.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Conversations are encrypted end-to-end. We never train AI on your data. Enterprise customers get a dedicated instance with full data isolation.",
  },
];

/* ------------------------------------------------------------------ */
/*  Helper: render a comparison cell value                             */
/* ------------------------------------------------------------------ */

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <span className="text-green-600 text-lg font-bold">✓</span>;
  if (value === false) return <span className="text-gray-300 text-lg">—</span>;
  return <span className="text-gray-700 text-sm">{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/use-cases" className="text-gray-600 hover:text-gray-900 transition-colors">
              Use Cases
            </Link>
            <Link href="/pricing" className="text-blue-600 font-medium">
              Pricing
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <Link href="/sign-in" className="text-gray-600 hover:text-gray-900 transition-colors">
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

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade when you&apos;re ready. No surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl p-8 border ${
                tier.highlighted
                  ? "border-blue-600 shadow-xl shadow-blue-600/10 ring-2 ring-blue-600"
                  : "border-gray-200 shadow-sm"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <span
                  className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold ${
                    tier.highlighted
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tier.badge}
                </span>
              )}

              <h3 className="mt-2 text-2xl font-bold text-gray-900">{tier.name}</h3>

              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                {tier.period && (
                  <span className="ml-1 text-lg text-gray-500">{tier.period}</span>
                )}
              </div>

              <p className="mt-2 text-gray-600 text-sm">{tier.description}</p>

              {/* Features */}
              <ul className="mt-8 space-y-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-700 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {tier.ctaHref.startsWith("mailto:") ? (
                <a
                  href={tier.ctaHref}
                  className={`mt-8 block w-full py-3.5 rounded-full text-center font-medium transition-colors ${tier.ctaStyle}`}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link
                  href={tier.ctaHref}
                  className={`mt-8 block w-full py-3.5 rounded-full text-center font-medium transition-colors ${tier.ctaStyle}`}
                >
                  {tier.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          7-day money-back guarantee on Pro · No credit card for Free · Cancel anytime
        </p>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Compare plans side by side
          </h2>
          <p className="mt-3 text-center text-gray-600">
            See exactly what&apos;s included in each plan.
          </p>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 pr-4 text-gray-900 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-gray-900 font-semibold">Free</th>
                  <th className="text-center py-4 px-4 text-blue-600 font-semibold">Pro</th>
                  <th className="text-center py-4 px-4 text-gray-900 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row, i) => (
                  <tr
                    key={row.name}
                    className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="py-4 pr-4 text-gray-700 font-medium text-sm">{row.name}</td>
                    <td className="text-center py-4 px-4">
                      <CellValue value={row.free} />
                    </td>
                    <td className="text-center py-4 px-4">
                      <CellValue value={row.pro} />
                    </td>
                    <td className="text-center py-4 px-4">
                      <CellValue value={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-center text-gray-600">
            Everything you need to know about our pricing.
          </p>

          <div className="mt-12 space-y-6">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900">{faq.q}</h3>
                <p className="mt-2 text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-blue-100 text-lg">
            50 free messages. No credit card. Upgrade whenever you want.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Start Free →
            </Link>
            <a
              href="mailto:hello@clawer.ai"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-colors"
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white font-bold text-lg">🦞 CLAWER.AI</div>
          <div className="flex gap-8 text-sm">
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
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
          <p className="text-sm">© 2026 Clawer.ai</p>
        </div>
      </footer>
    </div>
  );
}
