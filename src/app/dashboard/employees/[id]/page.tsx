import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { EmployeeChat } from './EmployeeChat';

export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) redirect('/sign-in');

  const { containerPort, gatewayToken, containerStatus } = user[0];

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Dashboard
          </a>
        </div>
        <EmployeeChat
          employeeId={id}
          containerPort={containerPort ?? 0}
          gatewayToken={gatewayToken ?? ''}
          containerStatus={containerStatus ?? 'stopped'}
        />
      </div>
    </div>
  );
}
