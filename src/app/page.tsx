import { redirect } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function Home() {
  redirect('/login');
}
