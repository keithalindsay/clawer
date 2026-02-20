import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { FilesPage } from '@/components/files/FilesPage';

export const metadata = {
  title: 'Files — Clawer.ai',
  description: 'View files created by your AI agents',
};

export default async function FilesServerPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return <FilesPage />;
}
