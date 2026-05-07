'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      const { data: { user: authUser } } = await client.auth.getUser();
      if (authUser) {
        const { data: profile } = await client
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: profile?.full_name || authUser.email || '',
          role: profile?.role || 'analyst',
          avatar: profile?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        fetchUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, role: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await client.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: name,
        role,
      });
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');
    const { error } = await client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }, []);

  return { user, loading, signIn, signUp, signOut, resetPassword };
}
