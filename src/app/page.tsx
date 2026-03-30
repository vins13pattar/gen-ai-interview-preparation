export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { hasAPIKey } from '@/lib/apikey';

export default async function Home() {
  const configured = await hasAPIKey();
  if (!configured) {
    redirect('/setup');
  }
  redirect('/domains');
}
