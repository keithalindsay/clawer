"use client";
/**
 * Clawer.ai Pricing Page
 *
 * Three tiers: Free, Pro ($49/mo), Enterprise (custom)
 * Comparison table + FAQ section
 */

import Link from "next/link";

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <span className="text-green-600 text-lg font-bold">✓</span>;
  if (value === false) return <span className="text-gray-300 text-lg">—</span>;
  return <span className="text-gray-700 text-sm">{value}</span>;
}

export default function PricingPage() {
  const TIERS = [
    {
      name: "Free",
      badge: "Get Started",
      price: "$0",
      period: "/forever",
      description: "Kick the tires — no credit card required.",
      features: [
        "100 total messages",
        "Basic model",
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
      price: "$49",
      period: "/month",
      description: "Your full AI team, unleashed.",
      features: [
        "500 messages per day",
        "Full AI team — all members unlocked",
        "Priority model (MiniMax M2.5)",
        "Custom skills from curated marketplace",
        "WhatsApp + Telegram + Slack",
        "Smart model routing",
        "Priority email support",
      ],
      cta: "Get Pro",
      ctaHref: "/api/stripe/checkout?plan=monthly",
      highlighted: true,
      ctaStyle: "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25",
    },
  ] as const;

  const COMPARISON = [
    { name: "Messages", free: "100 total", pro: "500/day" },
    { name: "AI model", free: "Basic", pro: "MiniMax M2.5" },
    { name: "Custom skills", free: false, pro: true },
    { name: "Channels", free: "Web only", pro: "WhatsApp, Telegram, Slack" },
    { name: "Smart model routing", free: false, pro: true },
    { name: "Priority support", free: false, pro: true },
  ] as const;

  const FAQS = [
    {
      q: "How does the free plan work?",
      a: "You get 100 total messages to try everything out — no credit card required. Once you've used them, upgrade to Pro for 500 messages per day and your full AI team.",
    },
    {
      q: "What are AI Teams?",
      a: "AI Teams are multiple specialized agents that work together. Pick a template — Life OS, Solopreneur, Content Creator, and more — each with agents built for that workflow.",
    },
    {
      q: "Can I switch plans anytime?",
      a: "Yes. Upgrade, downgrade, or cancel from your dashboard. No lock-in contracts. Pro-rated refunds on downgrades.",
    },
    {
      q: "Is my data safe?",
      a: "Every instance runs in an isolated container. We never train AI on your data. See our security blog post for details.",
    },
    {
      q: "Do I need a credit card to start?",
      a: "Nope. Free plan requires no credit card. Just sign up and start chatting.",
    },
    {
      q: "What channels can I connect?",
      a: "Pro unlocks WhatsApp, Telegram, and Slack — chat with your AI team from wherever you already work. Free is web-only.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://clawer.ai" },
      { "@type": "ListItem", position: 2, name: "Pricing", item: "https://clawer.ai/pricing" },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🦞 Clawer.ai
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="/#teams" className="text-gray-600 hover:text-gray-900 transition-colors">
              AI Teams
            </Link>
            <Link href="/pricing" className="text-orange-500 font-medium">
              Pricing
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <Link href="/use-cases" className="text-gray-600 hover:text-gray-900 transition-colors">
              Use Cases
            </Link>
            <Link href="/sign-in" className="text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-medium hover:bg-orange-600 transition-colors"
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

        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl p-8 border ${
                tier.highlighted
                  ? "border-orange-500 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500"
                  : "border-gray-200 shadow-sm"
              }`}
            >
              {tier.badge && (
                <span
                  className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold ${
                    tier.highlighted ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
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

              {"billingNote" in tier && (tier as any).billingNote && (
                <p className="mt-1 text-sm text-gray-500">{(tier as any).billingNote}</p>
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
                  <th className="text-center py-4 px-4 text-orange-500 font-semibold">Pro</th>
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
      <section className="py-20 px-6 bg-orange-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to build with AI Teams?
          </h2>
          <p className="mt-4 text-orange-100 text-lg">
            100 free messages to start. No credit card. Upgrade whenever.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-block bg-white text-orange-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-orange-50 transition-colors"
            >
              Start Free
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
          <div className="text-white font-bold text-lg">🦞 Clawer.ai</div>
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
