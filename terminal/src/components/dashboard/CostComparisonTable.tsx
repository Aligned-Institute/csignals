'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const EXPECTED_COST = 2.50;

const costData = [
  {
    model: 'claude-sonnet-4',
    actual: 2.88,
    loops: 12,
    errors: 0,
    goalAlignment: 92,
  },
  {
    model: 'gpt-4o',
    actual: 11.90,
    loops: 38,
    errors: 7,
    goalAlignment: 88,
  },
  {
    model: 'gemini-2.0-flash',
    actual: 1.20,
    loops: 7,
    errors: 0,
    goalAlignment: 42,
  },
  {
    model: 'llama-4',
    actual: 1.80,
    loops: 14,
    errors: 0,
    goalAlignment: 88,
  },
  {
    model: 'grok-3',
    actual: 6.20,
    loops: 9,
    errors: 0,
    goalAlignment: 85,
  },
  {
    model: 'deepseek-v3',
    actual: 0.45,
    loops: 18,
    errors: 4,
    goalAlignment: 58,
  },
  {
    model: 'qwen-2.5',
    actual: 0.80,
    loops: 13,
    errors: 0,
    goalAlignment: 78,
  },
  {
    model: 'mistral-large-3',
    actual: 1.60,
    loops: 11,
    errors: 0,
    goalAlignment: 89,
  },
];

function overrunPct(actual: number) {
  return ((actual - EXPECTED_COST) / EXPECTED_COST) * 100;
}

function overrunColor(pct: number) {
  if (pct > 50) return 'text-danger';
  if (pct > 0) return 'text-warning';
  return 'text-success';
}

function goalColor(score: number) {
  if (score >= 70) return 'bg-success/20 text-success';
  if (score >= 40) return 'bg-warning/20 text-warning';
  return 'bg-danger/20 text-danger';
}

export function CostComparisonTable() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
            Expected vs Actual Cost
          </h3>
        </div>
        <Badge variant="outline" className="text-xs">Live Demo Data</Badge>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-4">
          Benchmark: simple-refactor &middot; Expected: ${EXPECTED_COST.toFixed(2)}
        </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Expected</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Overrun</TableHead>
            <TableHead className="text-right">Loops</TableHead>
            <TableHead className="text-right">Errors</TableHead>
            <TableHead className="text-right">Goal Align</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costData.map((row) => {
            const pct = overrunPct(row.actual);
            return (
              <TableRow key={row.model}>
                <TableCell className="font-semibold">{row.model}</TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  ${EXPECTED_COST.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  ${row.actual.toFixed(2)}
                </TableCell>
                <TableCell className={`text-right font-mono font-bold ${overrunColor(pct)}`}>
                  {pct > 0 ? '+' : ''}{pct.toFixed(0)}%
                </TableCell>
                <TableCell className="text-right font-mono">{row.loops}</TableCell>
                <TableCell className="text-right font-mono">
                  {row.errors > 0 ? (
                    <span className="text-danger">{row.errors}</span>
                  ) : (
                    <span className="text-success">0</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${goalColor(row.goalAlignment)}`}>
                    {row.goalAlignment}/100
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">
        All 8 models &ldquo;succeeded&rdquo; &mdash; but success rate alone hides
        a <span className="text-danger font-semibold">376% cost overrun</span> (GPT-4o),
        a <span className="text-danger font-semibold">42/100 goal alignment</span> (Gemini),
        and <span className="text-danger font-semibold">4 errors across 18 loops</span> (DeepSeek)
        while completing only 1 of 3 handlers.
      </p>
    </div>
    </div>
  );
}
