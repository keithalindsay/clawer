import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { tasks } from '@/lib/db/schema/tasks';
import { eq } from 'drizzle-orm';
import { getTeamConfig } from '@/lib/teams';
import { TaskBoard } from '@/components/dashboard/TaskBoard';

export default async function TasksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      name: true,
      teamTemplate: true,
    },
  });

  const teamTemplate = user?.teamTemplate || 'lifeos';
  const teamConfig = getTeamConfig(teamTemplate);
  const teamMembers = teamConfig?.members || [];

  const initialTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(tasks.createdAt);

  return (
    <TaskBoard
      initialTasks={initialTasks}
      teamMembers={teamMembers}
      userName={user?.name || undefined}
    />
  );
}
