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
      "Your AI team handles customer support, content creation, and operations while you focus on building.",
    bullets: [
      "Auto-respond to customer emails and support tickets 24/7",
      "Generate blog posts, social content, and newsletters on schedule",
      "Track KPIs, summarize metrics, and flag what needs attention",
    ],
  },
  {
    icon: "🎬",
    title: "Content Creators",
    tagline:
      "Schedule posts, research trends, and manage your audience across platforms automatically.",
    bullets: [
      "Research trending topics and generate content briefs in seconds",
      "Schedule and cross-post to Twitter, YouTube, TikTok, and more",
      "Manage DMs, comments, and community engagement hands-free",
    ],
  },
  {
    icon: "👥",
    title: "Small Teams",
    tagline:
      "Give every team member AI-powered assistants that learn your workflows and tools.",
    bullets: [
      "Onboard new hires with AI that knows your SOPs and docs",
      "Route tasks, summarize meetings, and keep projects on track",
      "Connect Slack, Notion, Google Workspace — your tools, unified",
    ],
  },
  {
    icon: "🏠",
    title: "Parents & Families",
    tagline:
      "Homework help, meal planning, schedule management — your family's AI command center.",
    bullets: [
      "Step-by-step homework help that actually teaches, not just answers",
      "Weekly meal plans with grocery lists tailored to your preferences",
      "Coordinate family calendars, appointments, and reminders via WhatsApp",
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
            Whether you&apos;re a one-person startup or a family of five, Clawer
            gives you an AI team that adapts to your life.
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
                Get Started Free →
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
            Start free — no credit card required. 200 messages to try everything.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-orange-500 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            Get Started Free →
          </Link>
        </div>
      </section>
    </div>
  );
}
