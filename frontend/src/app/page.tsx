import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export default async function IndexPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  } else {
    redirect('/dashboard');
  }
}
