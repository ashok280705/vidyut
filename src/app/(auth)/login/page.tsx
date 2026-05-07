'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Power, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured()) {
      // Demo mode — just redirect
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    document.cookie = 'vidyut_demo_mode=true; path=/; max-age=86400';
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] h-[60%] w-[60%] rounded-full bg-primary/[0.03] blur-[150px]" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-blue-500/[0.03] blur-[120px]" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
            <Power className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] text-glow tracking-tight">VIDYUT</h1>
          <p className="text-sm text-muted-foreground mt-1">Smart Electricity Intelligence Platform</p>
          <p className="text-[11px] text-muted-foreground">BESCOM • Bangalore</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-lg font-semibold mb-6">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4 animate-slide-up">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@bescom.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded accent-primary" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-primary hover:underline">Forgot password?</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-[hsl(222,47%,7%)] text-[10px] text-muted-foreground uppercase tracking-wider">or</span></div>
          </div>

          <button onClick={handleDemoLogin}
            className="w-full py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-primary font-semibold text-sm hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
            <Power className="h-4 w-4" /> Launch Demo Mode
          </button>

          {/* Sample Credentials */}
          <div className="mt-8 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold text-center">Sample Credentials</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Admin', email: 'anuj@gmail.com', pass: 'Wtmg2135', icon: 'ShieldCheck' },
                { role: 'Field Eng', email: 'sho@gmail.com', pass: 'wtmg2135', icon: 'HardHat' },
                { role: 'Supervisor', email: 'rahul@gmail.com', pass: 'wtmg2135', icon: 'ClipboardCheck' },
                { role: 'Analyst', email: 'as@gmail.com', pass: 'Wtmg2135', icon: 'LineChart' }
              ].map((c) => (
                <button 
                  key={c.role}
                  type="button"
                  onClick={() => { setEmail(c.email); setPassword(c.pass); }}
                  className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-primary/20 transition-all text-left group"
                >
                  <p className="text-[10px] font-bold text-primary/80 group-hover:text-primary transition-colors">{c.role}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{c.email}</p>
                  <p className="text-[9px] text-muted-foreground/60 font-mono mt-0.5">{c.pass}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don&apos;t have an account? <a href="/signup" className="text-primary hover:underline">Sign up</a>
          </p>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          © 2026 VIDYUT • BESCOM Smart Grid Division
        </p>
      </div>
    </div>
  );
}
