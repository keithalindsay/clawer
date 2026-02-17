"use client";
/**
 * CLAWER.AI Pricing Page
 *
 * Three tiers: Free, Pro ($19/mo), Enterprise ($49/mo)
 * Comparison table + FAQ section
 */

"use client";

import Link from "next/link";
import { useState } from "react";

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <span className="text-green-600 text-lg font-bold">✓</span>;
  if (value === false) return <span className="text-gray-300 text-lg">—</span>;
  return <span className="text-gray-700 text-sm">{value}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const TIERS = [
    {
      name: "Free",
      badge: "Get Started",
      price: "$0",
      period: "/forever",
      description: "Kick the tires — no credit card required.",
      features: [
        "1 container",
        "GPT-4o-mini model",
        "100 messages per day",
        "Web chat only",
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
      price: annual ? "$15" : "$19",
      period: "/month",
      billingNote: annual ? "Billed annually ($180/yr)" : undefined,
      description: "For builders who want the full toolkit.",
      features: [
        "MiniMax M2.5 model",
        "Unlimited messages",
        "AI Teams — multiple agents working together",
        "Custom skills from curated marketplace",
        "WhatsApp + Telegram + Slack",
        "Smart model routing",
        "Priority email support",
      ],
      cta: "Get Pro →",
      ctaHref: annual
        ? "/api/stripe/checkout?plan=pro-annual"
        : "/api/stripe/checkout?plan=pro-monthly",
      highlighted: true,
      ctaStyle: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25",
    },
    {
      name: "Enterprise",
      badge: "Full Power",
      price: annual ? "$39" : "$49",
      period: "/month",
      billingNote: annual ? "Billed annually ($468/yr)" : undefined,
      description: "Dedicated resources. Zero compromises.",
      features: [
        "Everything in Pro",
        "Dedicated container resources",
        "Custom model support (bring your own)",
        "Priority support (real humans, fast)",
        "Full API access",
        "Team management & SSO",
        "99.9% uptime SLA",
        "Custom onboarding",
      ],
      cta: "Get Enterprise →",
      ctaHref: annual
        ? "/api/stripe/checkout?plan=enterprise-annual"
        : "/api/stripe/checkout?plan=enterprise-monthly",
      highlighted: false,
      ctaStyle:
        "border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600",
    },
  ] as const;

  const COMPARISON = [
    { name: "Daily messages", free: "100", pro: "Unlimited", enterprise: "Unlimited" },
    { name: "Containers", free: "1", pro: "1", enterprise: "Dedicated" },
    { name: "AI model", free: "GPT-4o-mini", pro: "MiniMax M2.5", enterprise: "Custom models" },
    { name: "AI Teams", free: false, pro: true, enterprise: true },
    { name: "Custom skills", free: false, pro: true, enterprise: true },
    { name: "Channels", free: "Web only", pro: "WhatsApp, Telegram, Slack", enterprise: "All + custom" },
    { name: "Smart model routing", free: false, pro: true, enterprise: true },
    { name: "API access", free: false, pro: false, enterprise: true },
    { name: "Dedicated resources", free: false, pro: false, enterprise: true },
    { name: "Team management & SSO", free: false, pro: false, enterprise: true },
    { name: "SLA guarantee", free: false, pro: false, enterprise: true },
    { name: "Priority support", free: false, pro: true, enterprise: true },
  ] as const;

  const FAQS = [
    {
      q: "What happens when I hit 100 messages on Free?",
      a: "The counter resets every day at midnight UTC. Or upgrade to Pro for unlimited messages and access to AI Teams, custom skills, and all messaging channels.",
    },
    {
      q: "What's the difference between GPT-4o-mini and MiniMax M2.5?",
      a: "GPT-4o-mini is great for basic tasks. MiniMax M2.5 is significantly more capable — better reasoning, longer context, and faster responses. Pro also includes smart model routing that picks the best model for each task automatically.",
    },
    {
      q: "What are AI Teams?",
      a: "AI Teams let you run multiple specialized agents that collaborate. Think: a researcher, a writer, and a fact-checker working together on a single task. Available on Pro and Enterprise.",
    },
    {
      q: "Can I bring my own API keys / models?",
      a: "Enterprise plan supports custom model configurations. Bring your own OpenAI, Anthropic, or any compatible API. Pro uses our pre-configured models with smart routing.",
    },
    {
      q: "Can I switch plans anytime?",
      a: "Yes. Upgrade, downgrade, or cancel from your dashboard. No lock-in contracts. Pro-rated refunds on downgrades.",
    },
    {
      q: "Is my data safe?",
      a: "Every instance runs in an isolated container. We never train AI on your data. Enterprise gets dedicated resources with full data isolation. See our security blog post for details.",
    },
    {
      q: "Do I need a credit card to start?",
      a: "Nope. Free plan is completely free, forever. No credit card required.",
    },
    {
      q: "What's included in priority support?",
      a: "Pro gets priority email support with 24-hour response time. Enterprise gets dedicated support with sub-4-hour response, plus a Slack channel with our team.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
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
              Start Free
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
            Start free. Upgrade when you need more power. No surprises.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 p-1.5 rounded-full">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                !annual ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2.5 rounded-full font-medium transition-all relative ${
                annual ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
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
              {tier.badge && (
                <span
                  className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold ${
                    tier.highlighted ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tier.badge}
                </span>
              )}

              <h3 className="mt-2 text-2xl font-bold text-gray-900">{tier.name}</h3>

              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                <span className="ml-1 text-lg text-gray-500">{tier.period}</span>
              </div>

              {"billingNote" in tier && tier.billingNote && (
                <p className="mt-1 text-sm text-gray-500">{tier.billingNote}</p>
              )}

              <p className="mt-2 text-gray-600 text-sm">{tier.description}</p>

              <ul className="mt-8 space-y-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-700 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaHref}
                className={`mt-8 block w-full py-3.5 rounded-full text-center font-medium transition-colors ${tier.ctaStyle}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          7-day money-back guarantee on paid plans · No credit card for Free · Cancel anytime
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
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.name}
                    className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="py-4 pr-4 text-gray-700 font-medium text-sm">{row.name}</td>
                    <td className="text-center py-4 px-4"><CellValue value={row.free} /></td>
                    <td className="text-center py-4 px-4"><CellValue value={row.pro} /></td>
                    <td className="text-center py-4 px-4"><CellValue value={row.enterprise} /></td>
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
            Ready to build with AI Teams?
          </h2>
          <p className="mt-4 text-blue-100 text-lg">
            100 free messages per day. No credit card. Upgrade whenever.
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
              Talk to Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white font-bold text-lg">🦞 CLAWER.AI</div>
          <div className="flex gap-8 text-sm">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm">© 2026 Clawer.ai</p>
        </div>
      </footer>
    </div>
  );
}
