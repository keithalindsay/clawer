/**
 * GET /api/models
 * 
 * Returns available models and user's current configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { modelConfigs } from '@/lib/db/schema/model-configs';
import { eq } from 'drizzle-orm';
import {
  ORCHESTRATOR_MODELS,
  WORKER_MODELS,
  BASE_PRICE_CENTS,
  getDefaultConfig,
  calculateTotalPrice,
} from '@/lib/db/schema/model-configs';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user's model configuration
    let userConfig = await db.query.modelConfigs.findFirst({
      where: eq(modelConfigs.userId, userId),
    });

    // If no config exists, create default
    if (!userConfig) {
      const defaultConfig = getDefaultConfig();
      const totalPrice = calculateTotalPrice(defaultConfig);
      
      [userConfig] = await db.insert(modelConfigs).values({
        userId,
        orchestratorModel: defaultConfig.orchestrator,
        workerModel: defaultConfig.worker,
        orchestratorAddonCents: ORCHESTRATOR_MODELS[defaultConfig.orchestrator].addonCents,
        workerAddonCents: WORKER_MODELS[defaultConfig.worker].addonCents,
        totalMonthlyCents: totalPrice,
      }).returning();
    }

    // Format orchestrator models for response
    const orchestrators = Object.values(ORCHESTRATOR_MODELS).map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      description: model.description,
      addonPrice: model.addonCents / 100,  // Convert cents to dollars
      quality: model.quality,
      recommended: model.recommended,
      inputPer1M: model.inputPer1M,
      outputPer1M: model.outputPer1M,
    }));

    // Format worker models for response
    const workers = Object.values(WORKER_MODELS).map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      description: model.description,
      addonPrice: model.addonCents / 100,  // Convert cents to dollars
      bestFor: model.bestFor,
      recommended: model.recommended,
      inputPer1M: model.inputPer1M,
      outputPer1M: model.outputPer1M,
    }));

    // Current configuration
    const current = {
      orchestrator: userConfig.orchestratorModel,
      worker: userConfig.workerModel,
      totalMonthly: userConfig.totalMonthlyCents / 100,  // Convert to dollars
      orchestratorAddon: userConfig.orchestratorAddonCents / 100,
      workerAddon: userConfig.workerAddonCents / 100,
    };

    return NextResponse.json({
      orchestrators,
      workers,
      current,
      basePrice: BASE_PRICE_CENTS / 100,  // Convert to dollars
    });

  } catch (error: any) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get models' },
      { status: 500 }
    );
  }
}
