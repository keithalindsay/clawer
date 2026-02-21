import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

/**
 * POST /api/onboarding/context
 * Save onboarding context answers and channel preference.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { templateId, answers, preferredChannel } = body as {
      templateId: string;
      answers: Record<string, string>;
      preferredChannel?: string;
    };

    if (!templateId || !answers) {
      return NextResponse.json(
        { error: 'templateId and answers are required' },
        { status: 400 }
      );
    }

    // Map answer keys to DB column names (template-specific)
    const updateData: Record<string, string | null> = {
      updatedAt: new Date().toISOString(),
    };

    if (preferredChannel) {
      updateData.preferredChannel = preferredChannel;
    }

    // Store template
    updateData.teamTemplate = templateId;

    // Map answers to DB fields based on template
    const fieldMap: Record<string, string> = {
      // LifeOS
      stress: 'onboardingStress',
      start: 'onboardingStart',
      stop: 'onboardingStop',
      // Solopreneur
      business: 'onboardingBusiness',
      customer: 'onboardingCustomer',
      platform: 'onboardingPlatform',
      // Content Creator
      niche: 'onboardingNiche',
      platforms: 'onboardingPlatforms',
      best_content: 'onboardingBestContent',
      // E-Commerce
      product: 'onboardingProduct',
      competitor: 'onboardingCompetitor',
      challenge: 'onboardingChallenge',
      // Growth Ops
      stage: 'onboardingStage',
      blocker: 'onboardingBlocker',
      tried: 'onboardingTried',
      // Fitness
      goal: 'onboardingGoal',
      days: 'onboardingDays',
      restrictions: 'onboardingRestrictions',
      // Mom/Parent
      kids_ages: 'onboardingKidsAges',
      schedule_complexity: 'onboardingScheduleComplexity',
      pain_point: 'onboardingPainPoint',
      // Finance
      finance_goal: 'onboardingFinanceGoal',
      money_stress: 'onboardingMoneyStress',
      income_range: 'onboardingIncomeRange',
    };

    for (const [answerKey, value] of Object.entries(answers)) {
      const dbField = fieldMap[answerKey];
      if (dbField && value) {
        (updateData as any)[dbField] = value;
      }
    }

    await db
      .update(users)
      .set(updateData as any)
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[onboarding/context] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save context answers' },
      { status: 500 }
    );
  }
}
