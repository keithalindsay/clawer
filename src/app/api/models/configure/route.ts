/**
 * POST /api/models/configure
 * 
 * Updates user's model configuration
 * Body: { orchestrator: string, worker: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { modelConfigs } from '@/lib/db/schema/model-configs';
import { eq } from 'drizzle-orm';
import {
  ORCHESTRATOR_MODELS,
  WORKER_MODELS,
  validateConfig,
  calculateTotalPrice,
  type ModelConfig,
  type OrchestratorModelId,
  type WorkerModelId,
} from '@/lib/db/schema/model-configs';

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { orchestrator, worker } = body;

    // Validate request
    if (!orchestrator || !worker) {
      return NextResponse.json(
        { error: 'Both orchestrator and worker models are required' },
        { status: 400 }
      );
    }

    // Validate model IDs
    const config: Partial<ModelConfig> = { orchestrator, worker };
    if (!validateConfig(config)) {
      return NextResponse.json(
        { error: 'Invalid model IDs. Please select valid models.' },
        { status: 400 }
      );
    }

    // Calculate new pricing
    const totalPrice = calculateTotalPrice(config);
    const orchestratorModel = ORCHESTRATOR_MODELS[config.orchestrator as OrchestratorModelId];
    const workerModel = WORKER_MODELS[config.worker as WorkerModelId];

    // Get current config to determine if this is an update or insert
    const existingConfig = await db.query.modelConfigs.findFirst({
      where: eq(modelConfigs.userId, userId),
    });

    let updatedConfig;
    
    if (existingConfig) {
      // Update existing configuration
      [updatedConfig] = await db
        .update(modelConfigs)
        .set({
          orchestratorModel: config.orchestrator,
          workerModel: config.worker,
          orchestratorAddonCents: orchestratorModel.addonCents,
          workerAddonCents: workerModel.addonCents,
          totalMonthlyCents: totalPrice,
          updatedAt: new Date(),
        })
        .where(eq(modelConfigs.userId, userId))
        .returning();
    } else {
      // Create new configuration
      [updatedConfig] = await db
        .insert(modelConfigs)
        .values({
          userId,
          orchestratorModel: config.orchestrator,
          workerModel: config.worker,
          orchestratorAddonCents: orchestratorModel.addonCents,
          workerAddonCents: workerModel.addonCents,
          totalMonthlyCents: totalPrice,
        })
        .returning();
    }

    // Determine if payment update is required (price increased)
    const requiresPaymentUpdate = existingConfig 
      ? totalPrice > existingConfig.totalMonthlyCents
      : false;

    return NextResponse.json({
      success: true,
      newPrice: totalPrice / 100,  // Convert cents to dollars
      effectiveDate: updatedConfig.updatedAt.toISOString(),
      requiresPaymentUpdate,
      configuration: {
        orchestrator: {
          id: config.orchestrator,
          name: orchestratorModel.name,
          addonPrice: orchestratorModel.addonCents / 100,
        },
        worker: {
          id: config.worker,
          name: workerModel.name,
          addonPrice: workerModel.addonCents / 100,
        },
      },
    });

  } catch (error: any) {
    console.error('Configure models error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
