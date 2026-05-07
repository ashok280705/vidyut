'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';
import { 
  Users, UserPlus, Shield, Mail, Calendar, 
  MoreVertical, Edit2, Trash2, ShieldCheck, ShieldAlert
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'field_engineer' });
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const client = getSupabaseClient();
    if (!client) return;

    setLoading(true);
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const downloadCredentials = (email: string, pass: string, name: string) => {
    const csvContent = `Full Name,Email,Password,Role,Login URL\n${name},${email},${pass},${formData.role},${window.location.origin}/login`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Credentials_${name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        showToast(`User ${formData.fullName} created successfully.`);
        downloadCredentials(formData.email, formData.password, formData.fullName);
        setIsModalOpen(false);
        setFormData({ fullName: '', email: '', password: '', role: 'engineer' });
        fetchUsers();
      } else {
        showToast(result.error || 'Failed to create user', 'error');
      }
    } catch (error) {
      showToast('Network error while creating user', 'error');
    } finally {
      setIsCreating(false);
    }
  }

  async function updateRole(userId: string, newRole: string) {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      showToast('Failed to update role', 'error');
    } else {
      showToast(`User role updated to ${newRole}`);
      fetchUsers();
    }
  }

  if (!isAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Access Restricted</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          You do not have the required administrative permissions to manage platform users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage platform access, roles, and security permissions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)]"
        >
          <UserPlus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.06]">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Joined</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-8 h-16 bg-white/[0.01]" />
                </tr>
              ))
            ) : (
              users.map((u) => (
                <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{u.full_name || 'Unnamed User'}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="bg-black/40 border border-white/[0.1] rounded-lg px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="analyst">Analyst</option>
                      <option value="field_engineer">Field Engineer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/[0.1] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold font-[family-name:var(--font-outfit)] mb-1">Add New User</h2>
            <p className="text-xs text-muted-foreground mb-6">Create a new platform account and assign a role.</p>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 block">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 block">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rahul@vidyut.com"
                  className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 block">Password</label>
                <input 
                  required
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 block">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                >
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="analyst">Analyst</option>
                  <option value="field_engineer">Field Engineer</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-xs font-bold uppercase tracking-widest hover:bg-white/[0.05] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? 'Creating...' : 'Create & Download CSV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-up z-50",
          toast.type === 'success' ? "bg-emerald-500 text-emerald-950 border-emerald-400" : "bg-red-500 text-white border-red-400"
        )}>
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
