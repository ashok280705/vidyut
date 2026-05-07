'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Power, Mail, Lock, User, ArrowRight, Shield } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'analyst' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) { router.push('/dashboard'); return; }
    setLoading(true); setError('');
    try {
      await signUp(form.email, form.password, form.name, form.role);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] -right-[10%] h-[60%] w-[60%] rounded-full bg-primary/[0.03] blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
            <Power className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] text-glow">VIDYUT</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your account</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@bescom.gov.in" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" required minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition-all appearance-none cursor-pointer">
                  <option value="analyst">Analyst</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="field_engineer">Field Engineer</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6">Already have an account? <a href="/login" className="text-primary hover:underline">Sign in</a></p>
        </div>
      </div>
    </div>
  );
}
