/**
 * Use Cases - 30 Automations Guide
 * Shows users exactly what they can build with Clawer
 */

import Link from "next/link";

const USE_CASE_CATEGORIES = [
  {
    title: "Start Your Day Right",
    emoji: "🌅",
    color: "from-orange-500 to-yellow-500",
    cases: [
      {
        name: "Morning Briefing",
        description: "AI reads 50 industry sources, gives you a 2-minute summary before coffee",
        prompt: "Set up a morning briefing with tech industry news",
      },
      {
        name: "Meeting Prep",
        description: "Before every call: who you're meeting, context, your last conversation",
        prompt: "Prep me for my 10am meeting with context on the attendees",
      },
      {
        name: "Daily Dashboard",
        description: "Calendar, priorities, weather, and news pulled into one message",
        prompt: "Build me a daily dashboard with my calendar and top priorities",
      },
    ],
  },
  {
    title: "Work Smarter",
    emoji: "💼",
    color: "from-blue-500 to-indigo-500",
    cases: [
      {
        name: "Meeting Notes → Actions",
        description: "Recording becomes notes, action items, and follow-up emails automatically",
        prompt: "Turn these meeting notes into action items and draft follow-up emails",
      },
      {
        name: "Meeting → SOPs",
        description: "Turn recordings into step-by-step procedures for your team",
        prompt: "Create an SOP from this meeting recording",
      },
      {
        name: "Weekly Team Updates",
        description: "Auto-generated from your project management tools",
        prompt: "Generate a weekly team update from our project status",
      },
      {
        name: "Brain Dump → Plan",
        description: "Messy thoughts become structured project plans",
        prompt: "Turn this brain dump into a structured project plan with milestones",
      },
    ],
  },
  {
    title: "Documents & Research",
    emoji: "📄",
    color: "from-green-500 to-emerald-500",
    cases: [
      {
        name: "Contract Scanner",
        description: "AI reads your contracts and flags what actually matters",
        prompt: "Review this contract and flag the key terms I should negotiate",
      },
      {
        name: "PDF Summarizer",
        description: "Any report or research paper summarized in 30 seconds",
        prompt: "Summarize this PDF in 5 bullet points",
      },
      {
        name: "Legal/Tax Translator",
        description: "Complex documents explained like you're 10",
        prompt: "Explain this legal document in simple terms",
      },
      {
        name: "YouTube → Notes",
        description: "Videos become summaries, notes, or blog posts",
        prompt: "Turn this YouTube video into a blog post",
      },
    ],
  },
  {
    title: "Money & Finance",
    emoji: "💰",
    color: "from-emerald-500 to-teal-500",
    cases: [
      {
        name: "Spending Summary",
        description: "Monthly transactions categorized without opening a spreadsheet",
        prompt: "Categorize my transactions from last month and show where I'm overspending",
      },
      {
        name: "Subscription Finder",
        description: "AI spots recurring charges you forgot about",
        prompt: "Find all the subscriptions I'm paying for",
      },
      {
        name: "Auto-Invoice",
        description: "Generate invoices when projects complete",
        prompt: "Generate an invoice for the project I just finished",
      },
    ],
  },
  {
    title: "Content & Writing",
    emoji: "✍️",
    color: "from-purple-500 to-pink-500",
    cases: [
      {
        name: "Voice → Content",
        description: "Memos become notes, tasks, or blog posts",
        prompt: "Turn this voice memo into a structured blog post",
      },
      {
        name: "One → Many",
        description: "Long-form content becomes social posts automatically",
        prompt: "Turn this article into 5 Twitter posts and a LinkedIn post",
      },
      {
        name: "Podcast → Everything",
        description: "Episodes become show notes, tweets, newsletters",
        prompt: "Create show notes and social posts from this podcast transcript",
      },
      {
        name: "Style Matcher",
        description: "AI reviews your writing and matches any tone",
        prompt: "Rewrite this in a more conversational tone like Paul Graham",
      },
      {
        name: "Outline → Presentation",
        description: "Rough notes become full slide decks",
        prompt: "Turn this outline into a 10-slide presentation",
      },
    ],
  },
  {
    title: "Personal Productivity",
    emoji: "🎯",
    color: "from-red-500 to-orange-500",
    cases: [
      {
        name: "Habit Tracker",
        description: "Weekly AI performance review on your goals",
        prompt: "Review my habits this week and give me a performance score",
      },
      {
        name: "Smart CRM",
        description: "AI reminds you who to follow up with and why",
        prompt: "Who should I follow up with this week and what should I say?",
      },
      {
        name: "Resume Tailor",
        description: "Auto-customize for each job application",
        prompt: "Tailor my resume for this job posting",
      },
      {
        name: "Journal Prompts",
        description: "Daily prompts based on what's happening in your life",
        prompt: "Give me a journaling prompt based on my week",
      },
    ],
  },
  {
    title: "Health & Life",
    emoji: "🏃",
    color: "from-cyan-500 to-blue-500",
    cases: [
      {
        name: "Meal Planner",
        description: "Weekly meals + grocery list based on diet and budget",
        prompt: "Plan my meals for next week, high protein, under $100",
      },
      {
        name: "Workout Generator",
        description: "Programs based on your goals and available equipment",
        prompt: "Create a 4-week workout plan for home with dumbbells only",
      },
    ],
  },
  {
    title: "Communication",
    emoji: "📧",
    color: "from-indigo-500 to-purple-500",
    cases: [
      {
        name: "Reply Drafter",
        description: "Client emails written in your voice",
        prompt: "Draft a reply to this client email in my usual tone",
      },
      {
        name: "Support Auto-Responder",
        description: "Tickets categorized and answered",
        prompt: "Draft responses for these support tickets",
      },
      {
        name: "Multi-Language",
        description: "Content translated and localized instantly",
        prompt: "Translate this to Spanish and localize for Latin American audience",
      },
    ],
  },
  {
    title: "Intelligence & Monitoring",
    emoji: "📊",
    color: "from-slate-500 to-zinc-600",
    cases: [
      {
        name: "Competitor Watch",
        description: "Weekly updates on what they're doing",
        prompt: "What did my competitors announce this week?",
      },
      {
        name: "File Organizer",
        description: "Downloads auto-sorted and labeled",
        prompt: "Organize my downloads folder by project and type",
      },
    ],
  },
];

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            🦞 CLAWER<span className="text-blue-500">.AI</span>
          </Link>
          <Link
            href="/sign-up"
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            30 Things Your AI Can Do
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            "I don't know what to automate" — Pick any one. Your life gets better.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Free Trial →
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          {USE_CASE_CATEGORIES.map((category) => (
            <div key={category.title}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{category.emoji}</span>
                <h2 className="text-2xl font-bold text-white">{category.title}</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.cases.map((useCase) => (
                  <div
                    key={useCase.name}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors group"
                  >
                    <h3 className="font-semibold text-white mb-2">{useCase.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{useCase.description}</p>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Try saying:</p>
                      <p className="text-sm text-blue-400 italic">"{useCase.prompt}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pro Tip */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-800/50 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-4">💡 Pro Tip</h3>
            <p className="text-gray-300 mb-6">
              Combine multiple automations into a personal dashboard. Your AI can build it for you.
            </p>
            <div className="bg-gray-900/50 rounded-lg p-4 inline-block">
              <p className="text-blue-400 italic">
                "Build me a morning dashboard that shows my calendar, top priorities, and industry news"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to automate your life?
          </h2>
          <p className="text-gray-400 mb-8">
            These aren't hypotheticals. Clawer users run all of these today.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started — $49/month →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>© 2026 Clawer.AI</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
