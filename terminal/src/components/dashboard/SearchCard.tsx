'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface SearchCardProps {
  slotId: string;
}

const isTicker = (s: string) => /^[A-Z]{1,5}$/.test(s.trim());

// Deterministic seeded mock price data from a search term
function mockPrices(term: string) {
  let seed = term.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 20 }, (_, i) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return { i, v: 100 + (seed % 80) - 40 + i * 0.5 };
  });
}

export default function SearchCard({ slotId }: SearchCardProps) {
  const [input, setInput] = useState('');
  const [term, setTerm] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`dashboard-search-${slotId}`);
    if (stored) setTerm(stored);
  }, [slotId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const val = input.trim();
    setTerm(val);
    localStorage.setItem(`dashboard-search-${slotId}`, val);
    setInput('');
  };

  const handleClear = () => {
    setTerm(null);
    localStorage.removeItem(`dashboard-search-${slotId}`);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 min-h-[180px] flex flex-col">
      {!term ? (
        <>
          <p className="text-xs text-muted-foreground mb-3">Add a topic, ticker, or trend to track</p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 bg-background">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. NVDA, AI regulation, LLM costs..."
                className="bg-transparent text-xs outline-none flex-1 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" size="sm" className="text-xs h-8">Add</Button>
          </form>
        </>
      ) : isTicker(term) ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold font-mono">{term}</p>
            <button onClick={handleClear} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Mock price trend (live data coming soon)</p>
          <div className="flex-1 min-h-[80px]">
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={mockPrices(term)}>
                <Line type="linear" dataKey="v" stroke="var(--chart-1)" strokeWidth={1.5} dot={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'var(--border)', fontSize: '11px' }}
                  formatter={(v: any) => [`$${Number(v).toFixed(2)}`, term]}
                  labelFormatter={() => ''}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold truncate mr-2">{term}</p>
            <button onClick={handleClear} className="text-muted-foreground hover:text-foreground shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Latest news and analysis</p>
          <div className="flex-1 flex items-center justify-center">
            <a
              href={`https://news.google.com/search?q=${encodeURIComponent(term + ' AI')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View news for &ldquo;{term}&rdquo;
            </a>
          </div>
        </>
      )}
    </div>
  );
}
