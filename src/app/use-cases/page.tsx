import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Use Cases — Clawer.ai | AI Teams for Founders, Creators & Families",
  description:
    "Discover how solo founders, content creators, small teams, and families use Clawer to automate workflows, save time, and get more done with AI-powered assistants.",
  alternates: {
    canonical: "https://clawer.ai/use-cases",
  },
};

const USE_CASES = [
  {
    icon: "🚀",
    title: "Solo Founders",
    tagline:
      "Not assistants — operators. Hunter monitors your competitors daily and alerts you to pricing changes. Shield runs SEO audits overnight. Harper auto-follows up on cold outreach. You wake up to results, not tasks.",
    bullets: [
      "Competitor monitoring runs daily — you get alerts when something changes",
      "SEO audits and keyword tracking happen overnight while you sleep",
      "Cold outreach follow-ups fire automatically so your pipeline never stalls",
    ],
  },
  {
    icon: "🎬",
    title: "Content Creators",
    tagline:
      "You create once — your team multiplies it everywhere. Mia scans trends before they peak. Jordan turns one video into threads, reels, and blog posts. Blake drafts your newsletter overnight.",
    bullets: [
      "Trending topic alerts hit your inbox before the wave peaks",
      "Every video auto-repurposes into platform-specific content",
      "Newsletter drafts ready for review every morning — you just approve",
    ],
  },
  {
    icon: "👥",
    title: "Small Teams",
    tagline:
      "Give every team member AI operators that run workflows, not just answer questions. Morning briefings, overnight research, and proactive task execution.",
    bullets: [
      "Daily briefings delivered before standup — no one walks in blind",
      "Research requests run overnight and deliver findings by morning",
      "Tasks execute on schedule — drafts, reports, and follow-ups on autopilot",
    ],
  },
  {
    icon: "🏠",
    title: "Parents & Families",
    tagline:
      "Cal sends WhatsApp reminders before every pickup. Mel plans meals on Sunday and sends the grocery list to your phone. Prof tracks what each kid struggles with and adapts over time.",
    bullets: [
      "Proactive reminders before every practice, appointment, and pickup",
      "Weekly meal plans auto-generated with grocery lists sent to your phone",
      "Homework help that learns your child's weak spots and adapts",
    ],
  },
];

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-orange-500 font-semibold mb-3 text-sm tracking-wide uppercase">
            🦞 Use Cases
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Built for the way <span className="text-orange-500">you</span> work
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            These aren&apos;t chatbots. They monitor, research, follow up, and
            execute — overnight, on schedule, without being asked. You wake up
            to results.
          </p>
        </div>
      </section>

      {/* Use Case Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="border border-gray-200 rounded-2xl p-8 hover:shadow-lg hover:border-orange-200 transition-all"
            >
              <div className="text-4xl mb-4">{uc.icon}</div>
              <h2 className="text-2xl font-bold mb-2">{uc.title}</h2>
              <p className="text-gray-600 mb-5">{uc.tagline}</p>
              <ul className="space-y-3 mb-6">
                {uc.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="text-orange-500 mt-0.5 font-bold">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="inline-block bg-orange-500 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/25 text-sm"
              >
                Start Free
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-3xl mb-2">🦞</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to meet your AI team?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Start free — no credit card required. 100 messages to try everything.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-orange-500 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            Start Free
          </Link>
        </div>
      </section>
    </div>
  );
}
