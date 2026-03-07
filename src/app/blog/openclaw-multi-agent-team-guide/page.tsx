import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multi-Agent OpenClaw: Routing, Subagents & Teams Explained",
  description:
    "OpenClaw 'multi-agent' means three different things. Here's what routing, subagents, and teams actually are — with real examples of when to use each.",
  openGraph: {
    title: "Multi-Agent OpenClaw: Routing, Subagents & Teams Explained",
    description:
      "OpenClaw 'multi-agent' means three different things. Here's what routing, subagents, and teams actually are — with real examples of when to use each.",
    type: "article",
    publishedTime: "2026-03-07T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "Multi-Agent", "Subagents", "Routing", "AI Teams", "Tutorial"],
    url: "https://clawer.ai/blog/openclaw-multi-agent-team-guide",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi-Agent OpenClaw: Routing, Subagents & Teams Explained",
    description:
      "OpenClaw 'multi-agent' means three different things. Here's what routing, subagents, and teams actually are — with real examples of when to use each.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-multi-agent-team-guide",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Multi-Agent OpenClaw: Routing, Subagents & Teams Explained",
  description:
    "Clear explanation of OpenClaw's three multi-agent patterns: routing (isolated workspaces), subagents (task delegation), and teams (coordinated specialists). Includes real code examples and decision framework.",
  datePublished: "2026-03-07",
  dateModified: "2026-03-07",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-multi-agent-team-guide",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://clawer.ai" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://clawer.ai/blog" },
    {
      "@type": "ListItem",
      position: 3,
      name: "OpenClaw Multi-Agent Guide",
      item: "https://clawer.ai/blog/openclaw-multi-agent-team-guide",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does multi-agent mean in OpenClaw?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Multi-agent in OpenClaw can mean three different things: 1) Multi-agent routing (separate OpenClaw instances for work/personal with isolated workspaces), 2) Subagents (one agent spawning helper agents to complete complex tasks), or 3) AI Teams (pre-configured groups of specialist agents). The term is confusing because all three are technically 'multiple agents' but serve completely different purposes.",
      },
    },
    {
      "@type": "Question",
      name: "When should I use multi-agent routing vs subagents?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use multi-agent routing when you need complete isolation — separate phone numbers, different personalities, zero shared context (like work agent vs personal agent). Use subagents when one agent needs help with a complex task — like spawning a research agent + writing agent + review agent to produce a report. Routing = separate brains. Subagents = delegating subtasks.",
      },
    },
    {
      "@type": "Question",
      name: "How do I create subagents in OpenClaw?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use the sessions_spawn tool with a task description. Example: sessions_spawn({ task: 'Research the top 5 VPS providers for OpenClaw', runtime: 'subagent' }). The main agent spawns a temporary helper agent that completes the task and returns results. Subagents have their own context, model selection, and tools, but don't persist after the task completes.",
      },
    },
    {
      "@type": "Question",
      name: "Can OpenClaw subagents spawn more subagents?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Subagents can spawn their own subagents, creating multi-level orchestration. A main agent might spawn a 'blog writer' subagent, which spawns a 'research' subagent and a 'fact-checker' subagent. This is powerful for complex workflows but requires careful orchestration to avoid infinite loops or runaway costs. The agent-orchestra skill demonstrates this pattern for parallel task execution.",
      },
    },
    {
      "@type": "Question",
      name: "What's the difference between OpenClaw teams and subagents?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Teams are pre-configured groups of specialist agents that persist and work together long-term (like Clawer's Life OS or Content Creator templates). Subagents are temporary helpers spawned for specific tasks and destroyed after completion. Teams = permanent staff. Subagents = contractors hired for one job. Teams require managed hosting or complex self-hosted setup. Subagents work with any OpenClaw instance.",
      },
    },
    {
      "@type": "Question",
      name: "How much do OpenClaw subagents cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Subagents consume API tokens just like your main agent. Each spawned subagent uses tokens based on its model choice and task complexity. Example: spawning 3 Claude Sonnet subagents for a blog post might cost $0.50-2.00 in API fees. Subagent overhead is minimal (spawning takes ~2 seconds), but be careful with recursive spawning or you can burn through API quota quickly.",
      },
    },
  ],
};

export default function OpenClawMultiAgentGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/blog" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Blog
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-lg max-w-none">
          <h1>Multi-Agent OpenClaw: Routing, Subagents & Teams Explained</h1>

          <p className="text-xl text-gray-600">
            The term "multi-agent OpenClaw" is causing genuine confusion. People ask "how do I set up multi-agent?" 
            and get three completely different answers. Here's what routing, subagents, and teams actually are — 
            and when to use each.
          </p>

          <img 
            src="/blog/openclaw-multi-agent-guide-hero.png" 
            alt="OpenClaw multi-agent patterns: routing for isolated workspaces, subagents for task delegation, and AI teams for coordinated specialists" 
            className="rounded-xl w-full my-8"
          />

          <h2>The Three Meanings of "Multi-Agent"</h2>

          <p>
            When someone says "multi-agent OpenClaw," they could mean any of these three completely different architectural patterns:
          </p>

          <ol>
            <li><strong>Multi-agent routing</strong> — Multiple isolated OpenClaw instances (like "work" and "personal") running on one server, each with separate workspaces, personalities, and phone numbers</li>
            <li><strong>Subagents</strong> — One agent spawning temporary helper agents to complete complex tasks, then collecting their results</li>
            <li><strong>AI Teams</strong> — Pre-configured groups of specialist agents that persist and coordinate long-term (like Clawer's templates)</li>
          </ol>

          <p>All three involve "multiple agents." None of them are the same thing.</p>

          <h2>Pattern 1: Multi-Agent Routing (Separate Brains)</h2>

          <p>
            This is the pattern most blog posts cover. You run multiple OpenClaw agents on one server, each completely isolated from the others.
          </p>

          <h3>What It Actually Does</h3>

          <p>
            Each agent gets its own workspace directory, its own SOUL.md personality file, its own conversation history, 
            and its own channel bindings (phone numbers, Telegram bots, Discord accounts). They never share context. 
            Your work agent knows nothing about what you told your personal agent.
          </p>

          <p>Example config from <code>~/.openclaw/openclaw.json</code>:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "agents": {
    "list": [
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "model": "anthropic/claude-sonnet-4-5"
      },
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "model": "anthropic/claude-opus-4-6"
      }
    ]
  },
  "bindings": [
    { "agentId": "work", "match": { "channel": "whatsapp", "accountId": "biz" } },
    { "agentId": "personal", "match": { "channel": "whatsapp", "accountId": "personal" } }
  ]
}`}
          </pre>

          <p>
            This routes your business WhatsApp number to the work agent and your personal number to the personal agent. 
            They're completely separate brains.
          </p>

          <h3>When to Use Routing</h3>

          <ul>
            <li>You want work conversations completely isolated from personal ones (no cross-contamination)</li>
            <li>You're running agents for multiple people on one server</li>
            <li>You need different personalities or tool permissions per agent</li>
            <li>You want different AI models (fast Sonnet for daily tasks, Opus for deep work)</li>
          </ul>

          <h3>When NOT to Use Routing</h3>

          <ul>
            <li>You want agents to collaborate on tasks — they can't talk to each other by default</li>
            <li>You're trying to break down complex tasks — subagents are better for this</li>
            <li>You just want one agent to delegate work — that's subagents, not routing</li>
          </ul>

          <h2>Pattern 2: Subagents (Task Delegation)</h2>

          <p>
            This is the pattern almost nobody explains clearly. Your main agent spawns temporary helper agents 
            to complete specific subtasks, then collects their results.
          </p>

          <h3>What It Actually Does</h3>

          <p>
            When your main agent encounters a complex task, it can spawn one or more subagents using the <code>sessions_spawn</code> tool. 
            Each subagent gets:
          </p>

          <ul>
            <li>Its own isolated context (it doesn't inherit your main conversation history)</li>
            <li>A specific task description</li>
            <li>Optional attachments (files, data, context)</li>
            <li>Its own model selection (can use a different model than the parent)</li>
          </ul>

          <p>
            When the subagent completes its task, it returns results to the parent agent and is destroyed. 
            It doesn't persist. It's a temporary worker.
          </p>

          <h3>Real Example: Blog Post Production</h3>

          <p>You ask your main agent: "Write a 3,000-word blog post about OpenClaw security."</p>

          <img 
            src="/blog/openclaw-multi-agent-subagent-flow.png" 
            alt="AI agent spawning research, writer, and editor subagents for blog post production workflow" 
            className="rounded-xl w-full my-6"
          />

          <p>A smart main agent orchestrates this as three subagents:</p>

          <ol>
            <li><strong>Research subagent</strong> — Searches for "openclaw security vulnerabilities," fetches docs, analyzes CVE reports</li>
            <li><strong>Writer subagent</strong> — Takes research output and writes the blog post draft</li>
            <li><strong>Editor subagent</strong> — Reviews the draft for accuracy, flow, and SEO optimization</li>
          </ol>

          <p>Here's what the main agent's tool call looks like:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`sessions_spawn({
  runtime: "subagent",
  mode: "run",
  task: "Research OpenClaw security vulnerabilities. Search for CVE reports, analyze the ClawHavoc malware campaign, and summarize the top 5 security risks self-hosters face. Output a structured report with sources.",
  model: "anthropic/claude-sonnet-4-5",
  runTimeoutSeconds: 300
})`}
          </pre>

          <p>
            The subagent runs independently, uses web search, fetches URLs, and returns a structured report. 
            The main agent then spawns the writer subagent, passes the research report as context, and so on.
          </p>

          <h3>When to Use Subagents</h3>

          <ul>
            <li>Complex tasks that benefit from specialization (research, then write, then edit)</li>
            <li>Parallel execution (spawn 5 subagents to analyze different data sources simultaneously)</li>
            <li>Quality iteration (spawn review subagent, if score {"<"} 7, spawn rewrite subagent)</li>
            <li>Context isolation (you don't want the research phase polluting the writing phase)</li>
          </ul>

          <h3>When NOT to Use Subagents</h3>

          <ul>
            <li>Simple, single-step tasks — just do it yourself, spawning adds overhead</li>
            <li>Tasks requiring continuous back-and-forth — subagents don't persist</li>
            <li>When you're already near token limits — each subagent adds context overhead</li>
          </ul>

          <h3>How Agents Spawn Subagents</h3>

          <p>
            Your main agent uses the <code>sessions_spawn</code> tool internally. You don't call this directly — 
            you ask your agent to delegate a task, and it spawns the subagent for you.
          </p>

          <p>
            If you're building automation or configuring your agent's orchestration behavior in AGENTS.md, 
            here's what the tool call looks like:
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`// What your agent calls internally
sessions_spawn({
  runtime: "subagent",
  mode: "run",              // "run" = one-shot, "session" = persistent
  task: "Your task description here",
  model: "anthropic/claude-sonnet-4-5", // Optional: override model
  attachments: [            // Optional: provide files/context
    {
      name: "research.md",
      content: base64Data,
      mimeType: "text/markdown"
    }
  ],
  runTimeoutSeconds: 600    // Max runtime before auto-kill
})`}
          </pre>

          <p>
            Subagents can spawn their own subagents (recursive orchestration), but be careful — this can burn API quota fast if you're not managing it.
          </p>

          <h2>Pattern 3: AI Teams (Coordinated Specialists)</h2>

          <p>
            This is what Clawer's <Link href="/blog/openclaw-ai-teams" className="text-blue-600 hover:text-blue-700">AI Teams templates</Link> provide. 
            Multiple specialist agents that persist long-term and coordinate on complex workflows.
          </p>

          <h3>What It Actually Does</h3>

          <p>
            Instead of spawning temporary helpers, you deploy a permanent team of specialists. For example, 
            Clawer's Content Creator team includes:
          </p>

          <ul>
            <li><strong>Research Agent</strong> — Monitors trends, analyzes competitors, finds content gaps</li>
            <li><strong>Writer Agent</strong> — Produces drafts based on research briefs</li>
            <li><strong>Editor Agent</strong> — Reviews for quality, SEO, and brand voice</li>
            <li><strong>Scheduler Agent</strong> — Manages publishing calendar and cross-platform distribution</li>
          </ul>

          <p>
            These agents run continuously. They share a coordinated workflow. You interact with the team, 
            not individual agents (though you can message specific agents if needed).
          </p>

          <h3>When to Use AI Teams</h3>

          <ul>
            <li>You have ongoing, repeatable workflows (content production, customer support, business ops)</li>
            <li>You want "set it and forget it" automation, not manual orchestration</li>
            <li>You're willing to use managed hosting (self-hosting teams is complex)</li>
          </ul>

          <h3>When NOT to Use AI Teams</h3>

          <ul>
            <li>You're experimenting or building one-off workflows — subagents are simpler</li>
            <li>You want full control over every orchestration step — teams abstract this away</li>
            <li>You're self-hosting and don't want to manage multi-agent coordination infrastructure</li>
          </ul>

          <h2>Which Pattern Should You Use?</h2>

          <p>Here's the decision framework:</p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 my-8">
            <h3 className="text-lg font-semibold text-blue-900 mt-0">Use Multi-Agent Routing If:</h3>
            <ul className="mb-0">
              <li>You need complete isolation (work vs personal, client A vs client B)</li>
              <li>Different agents need different personalities, tools, or permissions</li>
              <li>You're running agents for multiple people on one server</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-600 p-6 my-8">
            <h3 className="text-lg font-semibold text-green-900 mt-0">Use Subagents If:</h3>
            <ul className="mb-0">
              <li>One agent needs help breaking down a complex task</li>
              <li>You want parallel execution (5 subagents researching different topics)</li>
              <li>You're building quality loops (generate → review → revise until score {">"} 8)</li>
              <li>You need task-specific context isolation</li>
            </ul>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-600 p-6 my-8">
            <h3 className="text-lg font-semibold text-purple-900 mt-0">Use AI Teams If:</h3>
            <ul className="mb-0">
              <li>You have repeatable, ongoing workflows (content, support, ops)</li>
              <li>You want zero-config deployment (use Clawer's templates)</li>
              <li>You're willing to pay for managed hosting to avoid orchestration complexity</li>
            </ul>
          </div>

          <h2>Can You Combine Patterns?</h2>

          <p>Yes. Real-world setups often use multiple patterns:</p>

          <ul>
            <li>
              <strong>Routing + Subagents:</strong> Your work agent uses subagents for complex reports. 
              Your personal agent uses subagents for research tasks. They're isolated via routing, 
              but both can spawn helpers.
            </li>
            <li>
              <strong>Teams + Subagents:</strong> Clawer's Content Creator team uses subagents internally. 
              The Writer agent might spawn a research subagent and a fact-checker subagent. You don't manage this — 
              the team template handles it.
            </li>
            <li>
              <strong>All Three:</strong> You run separate work/personal agents (routing), each can spawn subagents for complex tasks, 
              and you use Clawer's Life OS team for personal automation. Perfectly valid.
            </li>
          </ul>

          <h2>Common Mistakes (And How to Avoid Them)</h2>

          <h3>Mistake 1: Using Routing When You Want Delegation</h3>

          <p>
            Symptom: "I set up work and personal agents but they can't collaborate on tasks."
          </p>

          <p>
            Fix: Routing creates isolated brains. If you want one agent to delegate subtasks, use subagents within a single agent, 
            not multiple routed agents.
          </p>

          <h3>Mistake 2: Spawning Too Many Subagents</h3>

          <p>
            Symptom: Your API bill is 10x higher than expected and responses are slow.
          </p>

          <p>
            Fix: Each subagent consumes tokens. Spawning 20 subagents for a simple task is overkill. 
            Start with 1-3 subagents max. Use parallel spawning only when tasks are truly independent.
          </p>

          <h3>Mistake 3: Expecting Subagents to Persist</h3>

          <p>
            Symptom: "I spawned a research agent yesterday but can't find it today."
          </p>

          <p>
            Fix: Subagents are temporary by design (mode: "run"). If you need persistence, use mode: "session" or deploy a team instead.
          </p>

          <h3>Mistake 4: Not Setting Timeouts</h3>

          <p>
            Symptom: A subagent got stuck in an infinite loop and burned through your API quota.
          </p>

          <p>
            Fix: Always set <code>runTimeoutSeconds</code> when spawning subagents. Default is 300 seconds (5 minutes). 
            For research-heavy tasks, increase it. For simple tasks, lower it.
          </p>

          <h3>Mistake 5: Forgetting to Check Subagent Status</h3>

          <p>
            Symptom: "I spawned 10 subagents but only got 3 results back. Not sure what happened to the others."
          </p>

          <p>
            Fix: Ask your agent to list active subagents (it will use the <code>subagents</code> tool internally) or 
            check Gateway logs directly. Failed subagents often leave error messages. 
            Common causes: timeout hit, model API error, or the subagent hit a tool permission block.
          </p>

          <h2>Building Your First Multi-Agent Setup</h2>

          <p>Start simple. Here's the fastest path to each pattern:</p>

          <h3>To Try Routing (5 minutes)</h3>

          <ol>
            <li>
              Run: <code>openclaw agents add work</code>
            </li>
            <li>
              Run: <code>openclaw agents add personal</code>
            </li>
            <li>
              Edit <code>~/.openclaw/openclaw.json</code> and add bindings (map different Telegram bots or WhatsApp numbers to each agent)
            </li>
            <li>
              Restart: <code>openclaw gateway restart</code>
            </li>
          </ol>

          <p>Full walkthrough: <a href="https://docs.openclaw.ai/concepts/multi-agent" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener">OpenClaw Multi-Agent Routing Docs</a></p>

          <h3>To Try Subagents (2 minutes)</h3>

          <p>Ask your agent:</p>

          <blockquote>
            "Spawn a subagent to research the top 5 VPS providers for OpenClaw hosting, then report back with pricing and specs."
          </blockquote>

          <p>
            If your agent has the <code>sessions_spawn</code> tool enabled (it is by default), it will spawn a research subagent, 
            wait for results, and present them to you. Check your agent's logs to see the subagent spawn and completion.
          </p>

          <h3>To Try AI Teams (60 seconds)</h3>

          <p>
            The fastest way is <Link href="/pricing" className="text-blue-600 hover:text-blue-700">Clawer.ai</Link>. 
            Sign up, pick a team template (Life OS, Solopreneur, Content Creator), connect your WhatsApp or Telegram, 
            and you have a functioning multi-agent team in under a minute.
          </p>

          <p>
            Self-hosting teams requires significantly more setup (coordinating agent configs, shared memory, orchestration logic). 
            Only go this route if you're comfortable with advanced OpenClaw configuration and have time to debug.
          </p>

          <h2>What's Actually Happening Under the Hood</h2>

          <p>
            If you're technically curious or building your own orchestration, here's how each pattern works at the implementation level:
          </p>

          <h3>Routing Implementation</h3>

          <p>
            The OpenClaw Gateway receives inbound messages and checks <code>bindings</code> in config. 
            It matches on channel + accountId + peer (sender/group ID) and routes to the appropriate <code>agentId</code>. 
            Each agent has its own session store under <code>~/.openclaw/agents/{"<"}agentId{">"}/sessions</code>.
          </p>

          <p>No cross-agent communication unless you explicitly enable <code>tools.agentToAgent</code> and allowlist specific agents.</p>

          <h3>Subagent Implementation</h3>

          <p>
            When the main agent calls <code>sessions_spawn</code>, the Gateway creates a new isolated session with:
          </p>

          <ul>
            <li>A fresh context (empty conversation history)</li>
            <li>The task description as the first system message</li>
            <li>Optional attachments loaded into context</li>
            <li>A timer that kills the subagent after <code>runTimeoutSeconds</code></li>
          </ul>

          <p>
            The subagent runs until it returns a result or hits the timeout. Results are passed back to the parent agent 
            as a tool result. The subagent session is destroyed (unless mode: "session").
          </p>

          <h3>Teams Implementation</h3>

          <p>
            AI Teams are essentially routing + orchestration + shared memory. Each specialist agent is a separate <code>agentId</code> 
            with its own workspace and tool permissions. A coordinator agent (or shared memory layer) ensures workflow handoffs.
          </p>

          <p>
            Example: The Content Creator team's Writer agent writes to <code>shared/drafts/</code>. 
            The Editor agent watches that directory and picks up new drafts for review. 
            This requires file-based coordination or message-passing between agents.
          </p>

          <p>Clawer handles this orchestration automatically. Self-hosters need to build it.</p>

          <h2>Resources and Next Steps</h2>

          <ul>
            <li>
              <strong>Official Multi-Agent Routing Docs:</strong>{" "}
              <a href="https://docs.openclaw.ai/concepts/multi-agent" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener">
                https://docs.openclaw.ai/concepts/multi-agent
              </a>
            </li>
            <li>
              <strong>Subagent Tool Reference:</strong>{" "}
              <a href="https://docs.openclaw.ai/tools/sessions" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener">
                https://docs.openclaw.ai/tools/sessions
              </a>
            </li>
            <li>
              <strong>Clawer AI Teams:</strong>{" "}
              <Link href="/blog/openclaw-ai-teams" className="text-blue-600 hover:text-blue-700">
                OpenClaw Multi-Agent Teams: Deploy Your AI Team in 5 Minutes
              </Link>
            </li>
            <li>
              <strong>Agent Orchestra Skill (Advanced Subagent Orchestration):</strong>{" "}
              <a href="https://github.com/openclaw/agent-orchestra" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener">
                GitHub - openclaw/agent-orchestra
              </a>
            </li>
          </ul>

          <h2>Quick Decision Table</h2>

          <table className="w-full border-collapse my-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Pattern</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Use When</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Don't Use When</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-semibold">Routing</td>
                <td className="border border-gray-300 px-4 py-2">
                  Complete isolation needed (work/personal), different personalities, multiple people on one server
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  You want agents to collaborate, you're delegating subtasks, you're just experimenting
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold">Subagents</td>
                <td className="border border-gray-300 px-4 py-2">
                  Complex tasks need decomposition, parallel execution, quality iteration loops
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  Simple single-step tasks, continuous back-and-forth needed, near token limits
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-semibold">Teams</td>
                <td className="border border-gray-300 px-4 py-2">
                  Ongoing repeatable workflows, want zero-config deployment, willing to use managed hosting
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  One-off workflows, want full orchestration control, self-hosting without team infra
                </td>
              </tr>
            </tbody>
          </table>

          <p>
            If you find yourself manually orchestrating the same multi-agent workflows repeatedly — that's the signal 
            you've outgrown ad-hoc subagents. That's what <Link href="/blog/openclaw-ai-teams" className="text-blue-600 hover:text-blue-700">teams are designed for</Link>.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 my-12">
            <h3 className="text-2xl font-bold text-gray-900 mt-0 mb-4">
              Try Multi-Agent OpenClaw Without the Setup
            </h3>
            <p className="text-gray-600 mb-6">
              Clawer.ai deploys pre-configured AI teams with routing, subagents, and coordination built in. 
              Connect WhatsApp or Telegram and you're running a multi-agent system in under 60 seconds.
            </p>
            <div className="flex gap-4">
              <Link
                href="/pricing"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View Pricing
              </Link>
              <Link
                href="/blog/best-openclaw-hosting"
                className="inline-block bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Compare Hosting Options
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mt-16 border-t border-gray-200 pt-12">
            <h2>Frequently Asked Questions</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  What does multi-agent mean in OpenClaw?
                </h3>
                <p className="text-gray-700">
                  Multi-agent in OpenClaw can mean three different things: 1) Multi-agent routing (separate OpenClaw 
                  instances for work/personal with isolated workspaces), 2) Subagents (one agent spawning helper agents 
                  to complete complex tasks), or 3) AI Teams (pre-configured groups of specialist agents). The term is 
                  confusing because all three are technically "multiple agents" but serve completely different purposes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  When should I use multi-agent routing vs subagents?
                </h3>
                <p className="text-gray-700">
                  Use multi-agent routing when you need complete isolation — separate phone numbers, different personalities, 
                  zero shared context (like work agent vs personal agent). Use subagents when one agent needs help with a 
                  complex task — like spawning a research agent + writing agent + review agent to produce a report. 
                  Routing = separate brains. Subagents = delegating subtasks.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  How do I create subagents in OpenClaw?
                </h3>
                <p className="text-gray-700">
                  Use the sessions_spawn tool with a task description. Example: sessions_spawn({"{"} task: "Research the top 5 
                  VPS providers for OpenClaw", runtime: "subagent" {"}"}). The main agent spawns a temporary helper agent that 
                  completes the task and returns results. Subagents have their own context, model selection, and tools, 
                  but don't persist after the task completes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Can OpenClaw subagents spawn more subagents?
                </h3>
                <p className="text-gray-700">
                  Yes. Subagents can spawn their own subagents, creating multi-level orchestration. A main agent might 
                  spawn a "blog writer" subagent, which spawns a "research" subagent and a "fact-checker" subagent. 
                  This is powerful for complex workflows but requires careful orchestration to avoid infinite loops or 
                  runaway costs. The agent-orchestra skill demonstrates this pattern for parallel task execution.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  What's the difference between OpenClaw teams and subagents?
                </h3>
                <p className="text-gray-700">
                  Teams are pre-configured groups of specialist agents that persist and work together long-term 
                  (like Clawer's Life OS or Content Creator templates). Subagents are temporary helpers spawned for 
                  specific tasks and destroyed after completion. Teams = permanent staff. Subagents = contractors hired 
                  for one job. Teams require managed hosting or complex self-hosted setup. Subagents work with any 
                  OpenClaw instance.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  How much do OpenClaw subagents cost?
                </h3>
                <p className="text-gray-700">
                  Subagents consume API tokens just like your main agent. Each spawned subagent uses tokens based on 
                  its model choice and task complexity. Example: spawning 3 Claude Sonnet subagents for a blog post 
                  might cost $0.50-2.00 in API fees. Subagent overhead is minimal (spawning takes ~2 seconds), 
                  but be careful with recursive spawning or you can burn through API quota quickly.
                </p>
              </div>
            </div>
          </section>
        </article>

        {/* Related Posts */}
        <aside className="mt-16 border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/blog/openclaw-ai-teams"
              className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-600 transition-colors"
            >
              <h4 className="font-semibold text-gray-900 mb-2">
                OpenClaw Multi-Agent Teams: Deploy Your AI Team in 5 Minutes
              </h4>
              <p className="text-sm text-gray-600">
                Pre-built AI team templates for life management, content creation, and business operations. No setup required.
              </p>
            </Link>

            <Link
              href="/blog/best-openclaw-hosting"
              className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-600 transition-colors"
            >
              <h4 className="font-semibold text-gray-900 mb-2">
                Best OpenClaw Hosting in 2026: Honest Comparison
              </h4>
              <p className="text-sm text-gray-600">
                Compare 15+ OpenClaw hosting providers on pricing, security, setup time, and features. 
                Written by a managed hosting provider.
              </p>
            </Link>
          </div>
        </aside>
      </main>

      {/* Footer CTA */}
      <section className="bg-blue-600 text-white py-16 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Deploy Multi-Agent OpenClaw?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Start with Clawer's free tier. Multi-agent teams, routing, and subagent orchestration included.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
