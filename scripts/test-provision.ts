/**
 * Manual provisioning test script
 * 
 * Usage: npx tsx scripts/test-provision.ts <userId>
 * 
 * Tests the provisioning system by manually creating a container
 * for a test user. Useful for development and debugging.
 */

import { provisionContainer, getContainerStatus } from '../src/lib/provisioner';

async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('❌ Usage: npx tsx scripts/test-provision.ts <userId>');
    console.error('   Example: npx tsx scripts/test-provision.ts test_user_123');
    process.exit(1);
  }
  
  console.log(`🚀 Starting manual provisioning for user: ${userId}\n`);
  
  try {
    // Check current status first
    console.log('📊 Checking current status...');
    const currentStatus = await getContainerStatus(userId);
    console.log(`   Current status: ${currentStatus}\n`);
    
    if (currentStatus === 'running') {
      console.log('⚠️  Container already running. Use restart command instead.');
      console.log('   ssh root@YOUR_DOCKER_HOST "docker restart clawer_user_' + userId + '"');
      return;
    }
    
    // Provision container
    console.log('🐳 Provisioning container...\n');
    const result = await provisionContainer(userId, 'lifeos');
    
    if (result.success) {
      console.log('\n✅ Provisioning successful!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Container ID: ${result.containerId}`);
      console.log(`   API Port: ${result.port}`);
      console.log(`   Gateway Token: ${result.gatewayToken?.substring(0, 16)}...`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('🧪 Test container:');
      console.log(`   curl http://YOUR_DOCKER_HOST:${result.port}/api/health`);
      console.log(`   curl -H "Authorization: Bearer ${result.gatewayToken}" http://YOUR_DOCKER_HOST:${result.port}/api/status`);
      console.log('');
      console.log('📋 View logs:');
      console.log(`   ssh root@YOUR_DOCKER_HOST "docker logs clawer_user_${userId}"`);
      console.log('');
      console.log('🗑️  Remove container:');
      console.log(`   ssh root@YOUR_DOCKER_HOST "docker stop clawer_user_${userId} && docker rm clawer_user_${userId}"`);
    } else {
      console.log('\n❌ Provisioning failed!');
      console.log(`   Error: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error during provisioning:');
    console.error(error);
    process.exit(1);
  }
}

main();
