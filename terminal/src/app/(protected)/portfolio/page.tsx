'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { FileText, BookOpen, Calendar, Database } from 'lucide-react';

interface Brief {
  filename: string;
  date: string;
  content: string;
  excerpt: string;
}

interface IntelFile {
  filename: string;
  label: string;
  size: string;
  type: string;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-base leading-relaxed break-words max-w-full overflow-hidden">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# '))
          return <h1 key={i} className="text-2xl font-bold mt-6 mb-2 text-primary">{line.substring(2)}</h1>;
        if (line.startsWith('## '))
          return <h2 key={i} className="text-lg font-bold mt-5 mb-1 border-b border-border pb-1">{line.substring(3)}</h2>;
        if (line.startsWith('### '))
          return <h3 key={i} className="text-base font-semibold mt-4 mb-1 text-primary/80">{line.substring(4)}</h3>;
        if (line.match(/^━+$/))
          return <hr key={i} className="border-border my-2" />;
        if (line.startsWith('* ') || line.startsWith('- '))
          return <li key={i} className="ml-5 list-disc text-sm text-foreground/90">{line.substring(2)}</li>;
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-5 list-decimal text-sm text-foreground/90">{line.replace(/^\d+\.\s/, '')}</li>;
        if (line.trim() === '')
          return <div key={i} className="h-2" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-sm text-foreground/85 leading-relaxed">
            {parts.map((p, j) =>
              j % 2 === 1
                ? <strong key={j} className="text-foreground font-semibold">{p}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function PortfolioPage() {
  const [briefs, setBriefs]           = useState<Brief[]>([]);
  const [intel, setIntel]             = useState<IntelFile[]>([]);
  const [loading, setLoading]         = useState(true);
  const [openBrief, setOpenBrief]     = useState<Brief | null>(null);

  useEffect(() => {
    fetch('/api/briefs')
      .then(r => r.json())
      .then(data => {
        setBriefs(data.briefs ?? []);
        setIntel(data.intel ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-page-in space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Brief Archive</h1>
        <p className="text-muted-foreground text-sm">
          Generated intelligence briefs and source intel files — updated Monday &amp; Friday at 7am
        </p>
      </div>

      {/* ── Weekly Intelligence Briefs ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest">
            Weekly Intelligence Briefs
          </h2>
          <span className="text-sm text-muted-foreground dark:text-white/70 font-mono ml-auto">
            {briefs.length} {briefs.length === 1 ? 'brief' : 'briefs'} on file
          </span>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-xl border border-border bg-card h-40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && briefs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <FileText className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-base text-muted-foreground">No briefs generated yet.</p>
            <p className="text-sm text-muted-foreground/70 dark:text-white/60 mt-1 font-mono">
              Run: python3 scripts/monday_brief.py
            </p>
          </div>
        )}

        {!loading && briefs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {briefs.map((b) => (
              <div
                key={b.filename}
                className="rounded-xl border border-border bg-card p-5 space-y-3 hover-lift hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => setOpenBrief(b)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary flex-none" />
                    <span className="text-sm font-mono text-muted-foreground dark:text-white/70">
                      {b.date}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[11px] border-primary/40 text-primary">
                    COMPLETE
                  </Badge>
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">
                    {fmtDate(b.date)}
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-white/80 leading-relaxed line-clamp-3">
                    {b.excerpt}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Open Brief
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Intel Library ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest">
            Intel Library
          </h2>
          <span className="text-sm text-muted-foreground dark:text-white/70 font-mono ml-auto">
            {intel.length} source files
          </span>
        </div>

        {!loading && intel.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <Database className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No intel files found.</p>
          </div>
        )}

        {!loading && intel.length > 0 && (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {intel.map((f) => (
              <div key={f.filename} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <BookOpen className="size-4 text-muted-foreground flex-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground truncate">{f.label}</p>
                  <p className="text-xs text-muted-foreground dark:text-white/70 font-mono mt-0.5">{f.filename}</p>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <span className="text-xs text-muted-foreground dark:text-white/70 font-mono">{f.size}</span>
                  <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                    {f.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Brief Viewer Dialog ── */}
      <Dialog open={!!openBrief} onOpenChange={(open) => !open && setOpenBrief(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
              <Calendar className="size-4" />
              {openBrief && fmtDate(openBrief.date)}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              {openBrief?.filename} · Performance Products Market Intelligence
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {openBrief && <MarkdownBody content={openBrief.content} />}
          </div>
          <div className="mt-6 pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              Print to PDF
            </Button>
            <Button size="sm" onClick={() => setOpenBrief(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
