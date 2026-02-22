import { currentUser } from '@clerk/nextjs/server';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  return (
    <div className="flex flex-col h-screen">
      <DashboardNav userEmail={userEmail} />
      <div className="flex-1 overflow-auto flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
