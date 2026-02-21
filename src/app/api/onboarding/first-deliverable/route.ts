import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { buildFirstDeliverablePrompt, getOnboardingTemplate } from '@/lib/onboarding-prompts';
import { FREE_TIER_PORT, FREE_TIER_TOKEN } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';

/**
 * POST /api/onboarding/first-deliverable
 * Generate the user's first deliverable based on template + answers.
 * Sends prompt to container, saves result to files/, returns content.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { templateId, answers } = body as {
      templateId: string;
      answers: Record<string, string>;
    };

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    const template = getOnboardingTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Unknown template' }, { status: 400 });
    }

    // Get user container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerPort: true,
        containerStatus: true,
        stripeSubscriptionId: true,
        gatewayToken: true,
        name: true,
      },
    });

    // Determine target container
    const hasSubscription = !!user?.stripeSubscriptionId;
    let targetPort: number;
    let targetToken: string | undefined;

    if (!hasSubscription || !user?.containerPort) {
      // Use shared free tier container for new users without provisioned containers
      targetPort = FREE_TIER_PORT;
      targetToken = FREE_TIER_TOKEN;
    } else {
      targetPort = user.containerPort;
      targetToken = undefined; // containerApi.chat will look up gateway token
    }

    // Build the prompt
    const prompt = buildFirstDeliverablePrompt(templateId, answers);

    // Send to container
    const sessionKey = `onboarding-first-deliverable-${userId}`;
    const result = await containerApi.chat(
      targetPort,
      prompt,
      sessionKey,
      {
        botName: 'Your AI Team',
        personality: 'helpful, clear, and action-oriented',
        customInstructions: `You are generating a user's first deliverable during onboarding. 
Make it genuinely useful, personalized, and immediately actionable. 
No fluff. Format clearly with markdown.`,
        communicationStyle: 'professional',
        responseLength: 'detailed',
        model: 'google/gemini-3-flash',
        tier: 'orchestrator',
        confidence: 0.9,
      },
      targetToken
    );

    if (result.error || !result.data) {
      console.error('[first-deliverable] Container error:', result.error);
      // Return a fallback response so onboarding doesn't get stuck
      return NextResponse.json({
        content: generateFallbackDeliverable(template, answers),
        title: template.deliverableTitle,
        icon: template.deliverableIcon,
        saved: false,
        savedPath: null,
      });
    }

    const content = result.data.content;

    // Try to save to user's files directory (if container exists)
    let savedPath: string | null = null;
    if (hasSubscription && user?.containerPort && content) {
      try {
        const containerName = `clawer_user_${userId}`;
        const filesDir = `/opt/clawer/userdata/${containerName}/clawd/files`;
        const filename = getDeliverableFilename(templateId);
        const filePath = path.join(filesDir, filename);

        await fs.mkdir(filesDir, { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        savedPath = filename;
      } catch (saveErr) {
        // Non-fatal — log and continue
        console.error('[first-deliverable] Failed to save file:', saveErr);
      }
    }

    return NextResponse.json({
      content,
      title: template.deliverableTitle,
      icon: template.deliverableIcon,
      saved: !!savedPath,
      savedPath,
    });
  } catch (error: any) {
    console.error('[first-deliverable] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate deliverable' },
      { status: 500 }
    );
  }
}

/** Generate a static fallback deliverable when the container is unavailable */
function generateFallbackDeliverable(
  template: ReturnType<typeof getOnboardingTemplate>,
  answers: Record<string, string>
): string {
  if (!template) return '# Your Deliverable\n\nWe\'ll have this ready for you in your dashboard!';

  switch (template.id) {
    case 'lifeos':
      return `# Your Weekly Life Structure

## Morning Routine (suggested)
- **6:30 AM** — Wake up, drink water
- **6:45 AM** — 10 minutes of movement or stretching
- **7:00 AM** — Review your top 3 priorities for the day

## This Week's Top 3 Priorities
1. Start: ${answers.start || 'Define your #1 goal for the week'}
2. Reduce: ${answers.stop || 'Identify one thing to cut back on'}
3. Tackle: ${answers.stress || 'Address your biggest current stressor'}

## This Week's Focus Habit
${answers.stop ? `**Stop ${answers.stop}** — Pick one moment today where you usually do this and pause intentionally.` : 'Choose one habit to focus on eliminating this week.'}

---
*Your agent will build on this structure each week as it learns your patterns.*`;

    case 'solopreneur':
      return `# Your Week of Content Ideas

### Monday: Authority Post
**Hook:** "Here's what I wish I knew when I started ${answers.business || 'my business'}..."
**Core:** Share a key lesson specific to your space
**CTA:** "Save this for later"

### Tuesday: Customer Story
**Hook:** "My ideal client ${answers.customer || 'customer'} came to me with this problem..."
**Core:** Walk through their transformation
**CTA:** "Does this sound like you?"

### Wednesday: Insight
**Hook:** "Unpopular opinion about ${answers.business ? answers.business.split(' ')[0] : 'my industry'}..."
**Core:** Contrarian take that sparks engagement
**CTA:** "Agree or disagree? Tell me below"

### Thursday: Value Post
**Hook:** "3 things that actually work for ${answers.customer || 'my clients'}:"
**Core:** Numbered list with genuine insights
**CTA:** "Which one will you try first?"

### Friday: Behind the Scenes
**Hook:** "What my week actually looked like (honest version):"
**Core:** Authentic behind-the-scenes
**CTA:** "Follow for more real talk"

---
*Platform optimized for: ${answers.platform || 'your preferred platform'}*`;

    default:
      return `# ${template.deliverableTitle}

Your personalized ${template.name} plan is being prepared. 

Check your dashboard — your AI team will have this ready within minutes.

**Your answers have been saved.** Your agent will use this context to help you every day.`;
  }
}

/** Get a filename for the deliverable based on template */
function getDeliverableFilename(templateId: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  const names: Record<string, string> = {
    lifeos: `weekly-life-structure-${dateStr}.md`,
    solopreneur: `content-ideas-week-of-${dateStr}.md`,
    'content-creator': `4-week-content-calendar-${dateStr}.md`,
    ecommerce: `competitor-analysis-${dateStr}.md`,
    'growth-ops': `growth-experiment-backlog-${dateStr}.md`,
    fitness: `4-week-workout-plan-${dateStr}.md`,
    mom: `family-weekly-overview-${dateStr}.md`,
    finance: `financial-clarity-snapshot-${dateStr}.md`,
  };

  return names[templateId] || `onboarding-deliverable-${dateStr}.md`;
}
