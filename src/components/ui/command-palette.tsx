'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { NAV_ITEMS } from '@/lib/constants';
import { Search, ArrowRight, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, anomalies } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build command items
  const items: CommandItem[] = useMemo(() => {
    const navItems: CommandItem[] = NAV_ITEMS.map(nav => ({
      id: nav.href,
      label: nav.label,
      description: `Navigate to ${nav.label}`,
      action: () => { router.push(nav.href); setCommandPaletteOpen(false); },
      category: 'Navigation',
    }));

    const actionItems: CommandItem[] = [
      { id: 'refresh', label: 'Refresh Dashboard', description: 'Reload all data', action: () => { window.location.reload(); }, category: 'Actions' },
      { id: 'theme', label: 'Toggle Theme', description: 'Switch color mode', action: () => {}, category: 'Actions' },
    ];

    return [...navItems, ...actionItems];
  }, [router, setCommandPaletteOpen]);

  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [commandPaletteOpen]);

  // Arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(filtered.length - 1, i + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(0, i - 1)); }
    if (e.key === 'Enter' && filtered[selectedIndex]) { filtered[selectedIndex].action(); }
  };

  if (!commandPaletteOpen) return null;

  const categories = [...new Set(filtered.map(i => i.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 animate-fade-in" onClick={() => setCommandPaletteOpen(false)}>
      <div className="w-full max-w-lg glass-card rounded-2xl overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search commands, pages..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <kbd className="text-[10px] bg-white/[0.06] px-2 py-0.5 rounded font-mono text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2 font-semibold">{cat}</p>
              {filtered.filter(i => i.category === cat).map((item, idx) => {
                const globalIdx = filtered.indexOf(item);
                return (
                  <button key={item.id} onClick={item.action}
                    className={cn('w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors',
                      globalIdx === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-white/[0.04]')}>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.description && <p className="text-[11px] text-muted-foreground">{item.description}</p>}
                    </div>
                    {globalIdx === selectedIndex && <ArrowRight className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No results found</p>}
        </div>
      </div>
    </div>
  );
}
