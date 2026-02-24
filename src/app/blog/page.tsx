import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — Clawer.ai",
  description: "Insights on AI assistants, OpenClaw hosting, security, and productivity from the Clawer team.",
  alternates: {
    canonical: "https://clawer.ai/blog",
  },
};

const BLOG_POSTS = [
  {
    slug: "openclaw-clawhub-malware-security",
    title: "341 Malicious Skills Found on ClawHub: How to Protect Your OpenClaw Agent",
    date: "February 23, 2026",
    readTime: "15 min read",
    excerpt: "ClawHavoc infected 1,184 OpenClaw skills with infostealers, keyloggers, and backdoors. Learn what happened, how skills become malware delivery vehicles, and how to stay safe.",
    tags: ["Security", "ClawHub", "Malware"],
  },
  {
    slug: "openclaw-agents-md-tips",
    title: "5 AGENTS.md Rules That Make Your OpenClaw Agent 10x Better",
    date: "February 22, 2026",
    readTime: "15 min read",
    excerpt: "Community-proven AGENTS.md rules that dramatically improve OpenClaw agent behavior. Real before/after examples and copy-paste snippets for immediate use.",
    tags: ["Tips", "AGENTS.md", "Configuration"],
  },
  {
    slug: "openclaw-mistakes-cost-money",
    title: "10 OpenClaw Mistakes That Waste Money (And How to Fix Them)",
    date: "February 21, 2026",
    readTime: "12 min read",
    excerpt: "These OpenClaw mistakes waste hundreds monthly on tokens, hosting, and debugging time. Here's what most users get wrong and how to fix it.",
    tags: ["Tips", "Cost Optimization", "Configuration"],
  },
  {
    slug: "openclaw-wrappers-make-money",
    title: "How to Make Money with OpenClaw Wrappers (Or Just Use Clawer.ai)",
    date: "February 21, 2026",
    readTime: "10 min read",
    excerpt: "Packaging pre-configured OpenClaw setups for specific niches is a real business. Here's the DIY cost breakdown vs. using Clawer.ai's managed wrapper platform.",
    tags: ["Business", "Wrappers", "Side Hustle"],
  },
  {
    slug: "openclaw-whatsapp-setup",
    title: "OpenClaw on WhatsApp: Complete Setup Guide (2026)",
    date: "February 20, 2026",
    readTime: "16 min read",
    excerpt: "Connect OpenClaw to WhatsApp in 10 minutes. QR code setup, config examples, common errors (status=515 fix), and when to use WhatsApp vs Telegram.",
    tags: ["WhatsApp", "Setup Guide", "Messaging"],
  },
  {
    slug: "how-to-set-up-openclaw",
    title: "How to Set Up OpenClaw in 2026: Complete Guide",
    date: "February 19, 2026",
    readTime: "25 min read",
    excerpt: "Set up OpenClaw on Mac, Linux, Windows, or a VPS — with real commands, API cost guidance, and a post-install workflow. Includes the no-server option.",
    tags: ["Setup Guide", "Installation", "Tutorial"],
  },
  {
    slug: "best-openclaw-hosting",
    title: "Best OpenClaw Hosting in 2026: An Honest Provider-to-Provider Comparison",
    date: "February 18, 2026",
    readTime: "22 min read",
    excerpt: "Compare 15+ OpenClaw hosting providers. Pricing, security scores, setup time, and what each actually includes. Written by a hosting provider.",
    tags: ["Hosting", "Comparison", "2026"],
  },
  {
    slug: "openclaw-self-hosted-vs-managed",
    title: "Self-Hosted vs Managed OpenClaw: The True Cost Comparison",
    date: "February 18, 2026",
    readTime: "14 min read",
    excerpt: "The real TCO of self-hosting OpenClaw vs managed hosting. We do the math across 4 user scenarios so you don't have to guess. Honest numbers, clear verdict.",
    tags: ["Hosting", "Self-Hosting", "Cost Comparison"],
  },
  {
    slug: "openclaw-security-guide",
    title: "OpenClaw Security: Why 42,000+ Instances Are Exposed (And How to Fix It)",
    date: "February 16, 2026",
    readTime: "8 min read",
    excerpt: "CVE-2026-25253, 341 malicious ClawHub skills, and 42,000+ exposed instances. The OpenClaw security crisis explained — and how Clawer solves it.",
    tags: ["Security", "OpenClaw", "CVE"],
  },
  {
    slug: "managed-openclaw-hosting",
    title: "Managed OpenClaw Hosting: Stop Wrestling with Docker and Start Building",
    date: "February 16, 2026",
    readTime: "6 min read",
    excerpt: "Docker setup, config hell, security patches, model provider juggling — or one click. The case for managed OpenClaw hosting.",
    tags: ["Hosting", "OpenClaw", "Docker"],
  },
  {
    slug: "openclaw-security",
    title: "OpenClaw's Security Crisis: Why Self-Hosting Your AI Assistant Just Got Dangerous",
    date: "February 9, 2026",
    readTime: "6 min read",
    excerpt: "Over 340 malicious skills discovered on ClawHub, 21,000+ exposed instances, and a critical CVE. Here's why hosted AI is the safer choice.",
    tags: ["Security", "OpenClaw", "Hosting"],
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Back to Clawer.ai
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-2">Blog</h1>
          <p className="mt-2 text-xl text-gray-600">
            Guides, comparisons, and insights for running AI teams.
          </p>
        </div>
      </header>

      {/* Blog Posts */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <time>{post.date}</time>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>

              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors mb-3">
                  {post.title}
                </h2>
              </Link>

              <p className="text-gray-700 mb-4 leading-relaxed">{post.excerpt}</p>

              <div className="flex items-center gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              >
                Read article
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </article>
          ))}
        </div>

        {/* Empty state for future posts */}
        {BLOG_POSTS.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
}
