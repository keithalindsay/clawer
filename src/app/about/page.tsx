import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Clawer.ai",
  description:
    "We're an AI-native company on a mission to make AI assistants accessible to everyone, not just developers. Learn about Clawer.ai.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🦞 Clawer.ai
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-gray-900 font-medium">About</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</Link>
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
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            AI assistants for{" "}
            <span className="text-blue-600">everyone</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            We believe powerful AI shouldn&apos;t require a computer science degree.
            That&apos;s why we built Clawer.ai&nbsp;— so anyone can get an AI team
            working for them in under a minute.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Story</h2>
          <div className="mt-6 space-y-4 text-gray-600 leading-relaxed text-lg">
            <p>
              Clawer.ai started with a simple frustration: AI tools were either
              too basic (glorified chatbots) or too complex (servers, APIs, Docker
              containers). There was nothing in between for the millions of people
              who just wanted AI to help with their actual work.
            </p>
            <p>
              We&apos;re an AI-native company — born in the era of large language
              models, not retrofitted for it. We took the best open-source AI
              framework (OpenClaw) and wrapped it in an experience so simple your
              parents could use it. No downloads, no configuration, no &quot;prompt
              engineering.&quot;
            </p>
            <p>
              Today, Clawer.ai helps people draft emails, schedule meetings,
              research anything, and manage their work — all from WhatsApp,
              Telegram, Slack, or a web browser. In 60 seconds flat.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Mission</h2>
          <p className="mt-6 text-2xl md:text-3xl font-medium text-blue-600 leading-snug">
            &ldquo;Make AI assistants accessible to everyone, not just developers.&rdquo;
          </p>
          <p className="mt-6 text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Every person deserves a tireless assistant that handles the boring
            stuff so they can focus on what matters. We&apos;re building that
            future — one chat message at a time.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900">
            What We Believe
          </h2>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: "🎯",
                title: "Simplicity First",
                desc: "If it takes more than 60 seconds to set up, we failed. Complexity is our enemy.",
              },
              {
                emoji: "🔒",
                title: "Privacy by Default",
                desc: "Your data is yours. We never train AI on your conversations. Delete everything anytime.",
              },
              {
                emoji: "🤝",
                title: "Humans Over Hype",
                desc: "Real support from real people. Honest pricing. No dark patterns. No vendor lock-in.",
              },
            ].map((v) => (
              <div key={v.title} className="text-center">
                <div className="text-4xl">{v.emoji}</div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{v.title}</h3>
                <p className="mt-2 text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">The Team</h2>
          <p className="mt-4 text-gray-600 text-lg">
            We&apos;re a small, focused team of builders who&apos;ve shipped AI products
            at scale. We move fast, talk to our users every day, and care
            deeply about getting the details right.
          </p>
          <p className="mt-6 text-gray-500">
            Team bios coming soon. In the meantime, say hi at{" "}
            <a
              href="mailto:hello@clawer.ai"
              className="text-blue-600 hover:underline"
            >
              hello@clawer.ai
            </a>
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-6 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Get in Touch</h2>
          <p className="mt-4 text-blue-100 text-lg">
            Questions, partnerships, or just want to chat? We&apos;d love to hear from you.
          </p>
          <a
            href="mailto:hello@clawer.ai"
            className="mt-8 inline-block bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-50 transition-colors"
          >
            hello@clawer.ai
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white font-bold text-lg">🦞 Clawer.ai</div>
          <div className="flex gap-8 text-sm">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:support@clawer.ai" className="hover:text-white transition-colors">Support</a>
          </div>
          <p className="text-sm">© 2026 Clawer.ai</p>
        </div>
      </footer>
    </div>
  );
}
