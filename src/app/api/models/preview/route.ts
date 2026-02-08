/**
 * GET /api/models/preview
 * 
 * Preview price for a configuration without saving
 * Query params: ?orchestrator=xxx&worker=yyy
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
  validateConfig,
  calculateTotalPrice,
  getDefaultConfig,
  type ModelConfig,
  type OrchestratorModelId,
  type WorkerModelId,
} from '@/lib/db/schema/model-configs';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const orchestrator = searchParams.get('orchestrator');
    const worker = searchParams.get('worker');

    // Validate query params
    if (!orchestrator || !worker) {
      return NextResponse.json(
        { error: 'Both orchestrator and worker query params are required' },
        { status: 400 }
      );
    }

    // Validate model IDs
    const config: Partial<ModelConfig> = { 
      orchestrator: orchestrator as OrchestratorModelId, 
      worker: worker as WorkerModelId 
    };
    if (!validateConfig(config)) {
      return NextResponse.json(
        { error: 'Invalid model IDs. Please select valid models.' },
        { status: 400 }
      );
    }

    // Get models
    const orchestratorModel = ORCHESTRATOR_MODELS[config.orchestrator as OrchestratorModelId];
    const workerModel = WORKER_MODELS[config.worker as WorkerModelId];

    // Calculate preview price
    const previewTotalCents = calculateTotalPrice(config);

    // Get user's current configuration for comparison
    let currentConfig = await db.query.modelConfigs.findFirst({
      where: eq(modelConfigs.userId, userId),
    });

    // If no current config, use defaults
    if (!currentConfig) {
      const defaultConfig = getDefaultConfig();
      const totalPrice = calculateTotalPrice(defaultConfig);
      
      currentConfig = {
        userId,
        orchestratorModel: defaultConfig.orchestrator,
        workerModel: defaultConfig.worker,
        orchestratorAddonCents: ORCHESTRATOR_MODELS[defaultConfig.orchestrator].addonCents,
        workerAddonCents: WORKER_MODELS[defaultConfig.worker].addonCents,
        totalMonthlyCents: totalPrice,
      } as any;
    }

    // Calculate price difference
    const currentPriceCents = currentConfig.totalMonthlyCents;
    const differenceCents = previewTotalCents - currentPriceCents;
    const percentageChange = currentPriceCents > 0 
      ? ((differenceCents / currentPriceCents) * 100)
      : 0;

    return NextResponse.json({
      preview: {
        orchestrator: {
          id: config.orchestrator,
          name: orchestratorModel.name,
          provider: orchestratorModel.provider,
          addonPrice: orchestratorModel.addonCents / 100,
        },
        worker: {
          id: config.worker,
          name: workerModel.name,
          provider: workerModel.provider,
          addonPrice: workerModel.addonCents / 100,
        },
        basePrice: BASE_PRICE_CENTS / 100,
        totalMonthly: previewTotalCents / 100,
      },
      comparison: {
        currentPrice: currentPriceCents / 100,
        newPrice: previewTotalCents / 100,
        difference: differenceCents / 100,  // positive = more expensive, negative = cheaper
        percentageChange: Math.round(percentageChange * 10) / 10,  // Round to 1 decimal
        isUpgrade: differenceCents > 0,
        isDowngrade: differenceCents < 0,
        noChange: differenceCents === 0,
      },
      breakdown: {
        base: BASE_PRICE_CENTS / 100,
        orchestratorAddon: orchestratorModel.addonCents / 100,
        workerAddon: workerModel.addonCents / 100,
      },
    });

  } catch (error: any) {
    console.error('Preview models error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview configuration' },
      { status: 500 }
    );
  }
}
