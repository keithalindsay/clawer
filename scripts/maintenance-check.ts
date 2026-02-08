#!/usr/bin/env tsx
/**
 * Clawer Container Maintenance Agent - CLI Entry Point
 * 
 * Usage:
 *   pnpm tsx scripts/maintenance-check.ts           # Run single check
 *   pnpm tsx scripts/maintenance-check.ts --daemon  # Run continuous monitoring
 *   pnpm tsx scripts/maintenance-check.ts --help    # Show help
 */

import { MaintenanceAgent } from '@/lib/maintenance';
import { resolve } from 'path';

const HELP_TEXT = `
Clawer Container Maintenance Agent (CCMA)

Usage:
  maintenance-check [options]

Options:
  --daemon              Run in daemon mode (continuous monitoring)
  --interval <minutes>  Check interval in minutes (default: 5)
  --help               Show this help message

Examples:
  # Run a single check (for cron jobs)
  tsx scripts/maintenance-check.ts

  # Run continuous monitoring every 5 minutes
  tsx scripts/maintenance-check.ts --daemon

  # Run continuous monitoring every 10 minutes
  tsx scripts/maintenance-check.ts --daemon --interval 10

Cron Setup (every 5 minutes):
  */5 * * * * cd /path/to/clawer && pnpm tsx scripts/maintenance-check.ts >> logs/maintenance-cron.log 2>&1
`;

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const isDaemon = args.includes('--daemon');
  const intervalIndex = args.indexOf('--interval');
  const intervalMinutes = intervalIndex !== -1 && args[intervalIndex + 1]
    ? parseInt(args[intervalIndex + 1], 10)
    : 5;

  if (isNaN(intervalMinutes) || intervalMinutes < 1) {
    console.error('Error: --interval must be a positive number');
    process.exit(1);
  }

  // Create agent instance
  const agent = new MaintenanceAgent({
    healthCheckIntervalMs: intervalMinutes * 60 * 1000,
    logPath: resolve(process.cwd(), 'logs/maintenance.log'),
  });

  if (isDaemon) {
    // Run in daemon mode
    console.log(`Starting maintenance agent in daemon mode (interval: ${intervalMinutes} minutes)`);
    
    await agent.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await agent.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await agent.stop();
      process.exit(0);
    });

    // Keep process alive
    console.log('Daemon running. Press Ctrl+C to stop.');
    
  } else {
    // Run single check (for cron)
    console.log('Running single maintenance check...');
    
    const initialized = await agent.initialize();
    if (!initialized) {
      console.error('Failed to initialize maintenance agent');
      process.exit(1);
    }

    await agent.runCheck();
    
    const status = agent.getStatus();
    console.log('Check complete:', {
      stats: status.stats,
    });
    
    process.exit(0);
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
