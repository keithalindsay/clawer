/**
 * Team Members API - List provisioned agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { getTeamConfig } from '@/lib/teams';
import { sshExec } from '@/lib/ssh';

const USERDATA_PATH = process.env.USERDATA_PATH || '/opt/clawer/userdata';
const CONTAINER_PREFIX = process.env.CONTAINER_PREFIX || 'clawer_user_';

export interface TeamMemberInfo {
  id: string;
  name: string;
  role: string;
  emoji: string;
  description: string;
  isDefault: boolean;
  lastActive?: Date;
  provisioned: boolean;
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get user's team template
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { teamTemplate: true },
    });
    
    const templateName = user?.teamTemplate || 'lifeos';
    const teamConfig = getTeamConfig(templateName);
    
    if (!teamConfig) {
      return NextResponse.json({ error: 'Team template not found' }, { status: 404 });
    }
    
    // Read team config from container to get default agent
    const containerName = `${CONTAINER_PREFIX}${userId}`;
    let defaultAgentId = teamConfig.defaultMember || teamConfig.members[0].id;
    let provisionedAgents: string[] = [];
    
    try {
      const teamConfigPath = `${USERDATA_PATH}/${containerName}/clawd/.team-config`;
      const { stdout } = await sshExec(`test -f ${teamConfigPath} && cat ${teamConfigPath} || echo "{}"`);
      
      if (stdout.trim() && stdout.trim() !== '{}') {
        const config = JSON.parse(stdout);
        defaultAgentId = config.defaultAgent || defaultAgentId;
        provisionedAgents = config.agents || [];
      }
    } catch (error) {
      console.error('Failed to read team config from container:', error);
      // Continue with defaults
    }
    
    // Build member list with provisioning status
    const members: TeamMemberInfo[] = teamConfig.members.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role,
      emoji: member.emoji || '🤖',
      description: member.description || '',
      isDefault: member.id === defaultAgentId,
      provisioned: provisionedAgents.length > 0 ? provisionedAgents.includes(member.id) : true,
    }));
    
    return NextResponse.json({
      template: templateName,
      members,
      defaultAgentId,
    });
    
  } catch (error) {
    console.error('Team members API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
