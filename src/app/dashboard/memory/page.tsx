/**
 * /dashboard/memory — Agent Memory Details Page
 *
 * Shows a timeline of agent learning, topic cloud, and a prominent
 * "Your agent knows X things about you" display.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { conversations } from '@/lib/db/schema/conversations';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { resolveUserFilesDir, listFiles } from '@/lib/files';
import fs from 'fs/promises';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  date: string;    // ISO string
  label: string;
  icon: string;
  detail?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

async function readContainerMemoryFile(userId: string): Promise<string | null> {
  const containerName = `clawer_user_${userId}`;
  const memoryPath = `/opt/clawer/userdata/${containerName}/clawd/MEMORY.md`;
  try {
    return await fs.readFile(memoryPath, 'utf-8');
  } catch {
    return null;
  }
}

function parseMemoryFile(content: string): { facts: number; topics: string[]; lines: string[] } {
  const lines = content.split('\n');
  const nonBlank = lines.filter((l) => l.trim().length > 0);
  const topics = nonBlank
    .filter((l) => l.trimStart().startsWith('#'))
    .map((l) => l.replace(/^#+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 12);
  return { facts: nonBlank.length, topics, lines: nonBlank };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MemoryPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const clerkUser = await currentUser();

  // Load user
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) redirect('/dashboard');

  // Days of context
  const daysSinceSignup = daysBetween(new Date(user.createdAt), new Date());

  // Conversations
  const allConversations = await db.query.conversations.findMany({
    where: and(eq(conversations.userId, userId), isNull(conversations.deletedAt)),
    orderBy: [desc(conversations.createdAt)],
    columns: { id: true, title: true, createdAt: true, messageCount: true },
  });

  // File count
  let fileCount = 0;
  try {
    const baseDir = await resolveUserFilesDir(userId);
    const tree = await listFiles(baseDir);
    fileCount = tree.totalFiles;
  } catch {
    // container not provisioned yet
  }

  // MEMORY.md
  const memoryContent = await readContainerMemoryFile(userId);
  const { facts: memoryFacts, topics, lines: memoryLines } = memoryContent
    ? parseMemoryFile(memoryContent)
    : { facts: 0, topics: [], lines: [] };

  // Build timeline
  const timeline: TimelineEvent[] = [];

  // Signup event
  timeline.push({
    date: user.createdAt.toISOString(),
    label: 'You joined Clawer.ai',
    icon: '🦞',
    detail: 'Your agent started learning about you',
  });

  // Onboarding completion (use createdAt as proxy when completed)
  if (user.onboardingCompleted) {
    timeline.push({
      date: user.createdAt.toISOString(),
      label: 'Onboarding completed',
      icon: '✅',
      detail: `Template: ${user.teamTemplate || 'Personal Assistant'}`,
    });
  }

  // First conversation
  if (allConversations.length > 0) {
    const first = allConversations[allConversations.length - 1];
    timeline.push({
      date: first.createdAt.toISOString(),
      label: 'First conversation',
      icon: '💬',
      detail: first.title || 'Untitled conversation',
    });
  }

  // Most recent conversation
  if (allConversations.length > 1) {
    const latest = allConversations[0];
    timeline.push({
      date: latest.createdAt.toISOString(),
      label: 'Most recent conversation',
      icon: '🔄',
      detail: latest.title || 'Untitled conversation',
    });
  }

  // Sort ascending
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const userName = user.name || clerkUser?.firstName || 'you';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-gray-900">
              🦞 Clawer.ai
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard"          className="text-gray-500 hover:text-gray-900">Dashboard</Link>
              <Link href="/dashboard/chat"     className="text-gray-500 hover:text-gray-900">Chat</Link>
              <Link href="/dashboard/tasks"    className="text-gray-500 hover:text-gray-900">Tasks</Link>
              <Link href="/dashboard/files"    className="text-gray-500 hover:text-gray-900">Files</Link>
              <Link href="/dashboard/agent"    className="text-gray-500 hover:text-gray-900">Agent</Link>
              <span className="text-orange-600 font-semibold">Memory</span>
              <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-900">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {clerkUser?.emailAddresses[0]?.emailAddress}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Hero */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Agent's Memory</h1>
          <p className="text-gray-500 mt-1">
            Everything your agent has learned about {userName}.
          </p>
        </div>

        {/* Prominent stat */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl p-8 text-white text-center shadow-md">
          <p className="text-5xl font-bold mb-2">{memoryFacts}</p>
          <p className="text-lg font-medium opacity-90">
            {memoryFacts === 1 ? 'thing' : 'things'} your agent knows about you
          </p>
          <p className="mt-3 text-sm opacity-75">
            Across {daysSinceSignup} {daysSinceSignup === 1 ? 'day' : 'days'} of working together
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard emoji="💬" label="Conversations" value={allConversations.length} />
          <StatCard emoji="📁" label="Files created" value={fileCount} />
          <StatCard emoji="📅" label="Days of context" value={daysSinceSignup} />
        </div>

        {/* Topic cloud */}
        {topics.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Topics your agent knows about
            </h2>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-full font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
            {topics.length === 0 && (
              <p className="text-sm text-gray-500">
                No topics yet — start chatting so your agent can learn!
              </p>
            )}
          </section>
        )}

        {/* Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning timeline</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-gray-500">No history yet.</p>
          ) : (
            <ol className="relative border-l-2 border-orange-100 space-y-6 pl-6">
              {timeline.map((event, i) => (
                <li key={i} className="relative">
                  {/* Dot */}
                  <span className="absolute -left-[1.6rem] top-0.5 flex items-center justify-center w-8 h-8 bg-orange-50 border-2 border-orange-200 rounded-full text-base">
                    {event.icon}
                  </span>

                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 mb-1">{formatDate(event.date)}</p>
                    <p className="font-semibold text-gray-900 text-sm">{event.label}</p>
                    {event.detail && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{event.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Never resets callout */}
        <div className="p-5 bg-green-50 rounded-xl border border-green-100">
          <p className="text-sm text-green-800 leading-relaxed">
            ✅{' '}
            <strong>Your agent's memory never resets.</strong> Even if you don't log in for a while,
            your context accumulates. You can never lose progress with Clawer.ai.
          </p>
        </div>

        {/* Link to agent files */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/agent"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-full transition-colors shadow-sm"
          >
            🤖 Edit agent files directly
          </Link>
          <Link
            href="/dashboard/files"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium text-sm rounded-full transition-colors"
          >
            📁 View all files ({fileCount})
          </Link>
        </div>

        {/* Recent conversations */}
        {allConversations.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent conversations</h2>
            <ul className="space-y-2">
              {allConversations.slice(0, 5).map((conv) => (
                <li key={conv.id}>
                  <Link
                    href={`/dashboard/chat?conversation=${conv.id}`}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition-colors group"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">
                      {conv.title || 'Untitled conversation'}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                      {conv.messageCount} msgs · {formatDate(conv.createdAt.toISOString())}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {allConversations.length > 5 && (
              <Link
                href="/dashboard/conversations"
                className="mt-3 block text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                View all {allConversations.length} conversations →
              </Link>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
