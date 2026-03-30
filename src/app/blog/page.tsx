import type { Metadata } from "next";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "OpenClaw Hosting Blog — Guides, Reviews & Tutorials | Clawer.ai",
  description:
    "Expert guides on OpenClaw hosting, setup, security, and AI agents. Comparisons, tutorials, and honest reviews to help you run AI teams without the ops headache.",
  alternates: {
    canonical: "https://clawer.ai/blog",
  },
  openGraph: {
    title: "OpenClaw Hosting Blog — Guides, Reviews & Tutorials | Clawer.ai",
    description:
      "Expert guides on OpenClaw hosting, setup, security, and AI agents. Comparisons, tutorials, and honest reviews to help you run AI teams without the ops headache.",
    url: "https://clawer.ai/blog",
    type: "website",
    siteName: "Clawer.ai",
    images: [
      {
        url: "https://clawer.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clawer.ai OpenClaw Hosting Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw Hosting Blog — Guides, Reviews & Tutorials | Clawer.ai",
    description:
      "Expert guides on OpenClaw hosting, setup, security, and AI agents. No fluff, real data.",
    images: ["https://clawer.ai/og-image.png"],
  },
};

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  dateISO: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  url: string;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const manifestPath = path.join(process.cwd(), "public", "blog-manifest.json");
    const raw = await fs.readFile(manifestPath, "utf-8");
    const data = JSON.parse(raw);
    return data.posts as BlogPost[];
  } catch {
    // Fallback: return empty array if manifest is missing
    console.error("Failed to load blog-manifest.json");
    return [];
  }
}

const blogListSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Clawer.ai Blog",
  url: "https://clawer.ai/blog",
  description:
    "Expert guides on OpenClaw hosting, setup, security, and AI agents from the Clawer team.",
  publisher: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />
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
          {posts.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <time dateTime={post.dateISO}>{post.date}</time>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>

              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors mb-3">
                  {post.title}
                </h2>
              </Link>

              <p className="text-gray-700 mb-4 leading-relaxed">{post.excerpt}</p>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
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

        {/* Empty state */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
}
