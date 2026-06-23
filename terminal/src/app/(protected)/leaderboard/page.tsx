'use client';

import { useState, useEffect } from 'react';
import { TrafficLight } from '@/components/signals/TrafficLight';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Commodity signal data — reflects 2026-06-10 brief run
const SIGNALS = [
  {
    id: 'wti',
    name: 'WTI Crude Oil',
    category: 'Feedstock — MDI Chain',
    ticker: 'CL=F',
    price: '$90.80 /bbl',
    change_1d: +2.95,
    change_5d: +4.12,
    signal_score: 34,   // low score = cost pressure risk
    cost_index: 81,     // high = elevated input cost
    demand_index: 58,
    verdict: 'Cost Alert',
    verdictColor: 'bg-danger/20 text-[var(--chart-5)]',
    detail: 'WTI spiked +2.95% in a single session — the third consecutive day above $88. The MDI feedstock chain (crude → naphtha → benzene → aniline → MDI) transmits this within 2–3 weeks. At $90+ sustained, energy surcharge clauses on variable-rate contracts should be reviewed. Asia exposure amplified by Brent at $93.86.',
  },
  {
    id: 'brent',
    name: 'Brent Crude',
    category: 'Feedstock — Asia Proxy',
    ticker: 'BZ=F',
    price: '$93.86 /bbl',
    change_1d: +2.64,
    change_5d: +3.80,
    signal_score: 31,
    cost_index: 85,
    demand_index: 55,
    verdict: 'Supply Risk',
    verdictColor: 'bg-danger/20 text-[var(--chart-5)]',
    detail: 'Brent/WTI spread at $3.06 signals tightening global supply. Hormuz disruption headline (confirmed in news feeds) creates availability risk for Asia-Pacific benzene and aniline intermediates. Our Asian operations source benzene regionally — monitor for spot price premium of $50–100/t over contract prices within 4 weeks.',
  },
  {
    id: 'benzene',
    name: 'Benzene Spot (USGC)',
    category: 'Feedstock — MDI Chain',
    ticker: 'BENZ-USGC',
    price: '$1,010 /tonne',
    change_1d: +1.85,
    change_5d: +3.40,
    signal_score: 39,
    cost_index: 82,
    demand_index: 68,
    verdict: 'Cost Alert',
    verdictColor: 'bg-danger/20 text-[var(--chart-5)]',
    detail: 'Benzene is the primary feedstock building block for aniline and MDI. European reformer shutdowns and rising crude costs have pushed USGC spot benzene to $1,010/tonne. Huntsman is a major buyer; a $50/tonne increase in benzene increases MDI cash cost by ~$38/tonne, threatening margin compression if not passed through to downstream systems.',
  },
  {
    id: 'propylene_oxide',
    name: 'Propylene Oxide (USGC)',
    category: 'Intermediate — Polyurethanes',
    ticker: 'PO-USGC',
    price: '$1,350 /tonne',
    change_1d: -2.10,
    change_5d: -4.35,
    signal_score: 72,
    cost_index: 30,
    demand_index: 45,
    verdict: 'Margin Expansion',
    verdictColor: 'bg-success/20 text-[var(--color-success)]',
    detail: 'Propylene Oxide spot prices eased by 2.10% due to capacity additions in the US Gulf Coast. Lower PO prices expand Huntsman\'s polyol margins (specifically for polyether polyols used in flexible seating foams), compensating for MDI cost pressure.',
  },
  {
    id: 'maleic_anhydride',
    name: 'Maleic Anhydride (US)',
    category: 'Intermediate — Performance Products',
    ticker: 'MAN-US',
    price: '$1,420 /tonne',
    change_1d: +0.50,
    change_5d: -1.20,
    signal_score: 61,
    cost_index: 48,
    demand_index: 52,
    verdict: 'Neutral',
    verdictColor: 'bg-success/20 text-[var(--color-success)]',
    detail: 'Maleic anhydride is critical for unsaturated polyester resins (UPR) and lube additives, which are core focus segments for Performance Products. Spot prices are stable at $1,420/tonne. Upstream butane feedstocks remain in a seasonal surplus. Downstream demand from automotive lubricants is steady, keeping margins within target bands.',
  },
  {
    id: 'natgas',
    name: 'Natural Gas (Henry Hub)',
    category: 'Operations — Energy Cost',
    ticker: 'NG=F',
    price: '$3.19 /MMBtu',
    change_1d: +1.69,
    change_5d: +0.44,
    signal_score: 52,
    cost_index: 58,
    demand_index: 62,
    verdict: 'Watch',
    verdictColor: 'bg-warning/20 text-[var(--color-warning)]',
    detail: 'Natural gas trending toward its 10-day high of $3.40. At $3.19, energy costs for U.S. Gulf Coast MDI and amine production are elevated. A move to $3.40+ would add ~$12–18/t to production costs for energy-intensive polyurethane systems. Monitor weekly NYMEX strip for forward curve inflection.',
  },
  {
    id: 'xlb',
    name: 'XLB Materials Sector',
    category: 'Sector — Demand Proxy',
    ticker: 'XLB',
    price: '$50.21',
    change_1d: -1.41,
    change_5d: -2.54,
    signal_score: 38,
    cost_index: 45,
    demand_index: 35,
    verdict: 'Sector Weak',
    verdictColor: 'bg-danger/20 text-[var(--chart-5)]',
    detail: 'XLB fell 1.41% vs S&P\'s -0.89% — chemicals/materials are underperforming the broader market on both 1-day and 5-day timeframes. XLB trading near its 10-day low of $49.84 signals no institutional buying support. Historically, XLB weakness of >2% week-over-week precedes softer downstream demand by 3–5 weeks.',
  },
  {
    id: 'sp500',
    name: 'S&P 500',
    category: 'Macro — Demand Environment',
    ticker: '^GSPC',
    price: '7,321',
    change_1d: -0.89,
    change_5d: -3.21,
    signal_score: 42,
    cost_index: 40,
    demand_index: 38,
    verdict: 'Risk-Off',
    verdictColor: 'bg-warning/20 text-[var(--color-warning)]',
    detail: 'S&P 500 down 3.21% over five trading days — a meaningful signal that institutional money is rotating out of cyclical growth assets. Performance Products end-markets (automotive OEM, construction) are cyclically sensitive. Historical pattern: S&P 5-day drawdown >3% precedes softening in industrial chemical volumes by 4–6 weeks.',
  },
  {
    id: 'eurusd',
    name: 'EUR / USD',
    category: 'FX — Export Pricing',
    ticker: 'EURUSD=X',
    price: '1.1600',
    change_1d: +0.28,
    change_5d: +0.15,
    signal_score: 65,
    cost_index: 35,
    demand_index: 60,
    verdict: 'Mild Tailwind',
    verdictColor: 'bg-success/20 text-[var(--color-success)]',
    detail: 'Euro slightly stronger vs. dollar — a mild tailwind for U.S.-produced products sold into Europe, as dollar softness improves Huntsman\'s price competitiveness on euro-denominated contracts. Effect is modest at current spread. Watch for sustained USD weakening to >1.18 as a more meaningful pricing opportunity for European specialty markets.',
  },
  {
    id: 'usdcny',
    name: 'USD / CNY',
    category: 'FX — Asia Competition',
    ticker: 'CNYUSD=X',
    price: '0.1500',
    change_1d: 0.00,
    change_5d: -0.02,
    signal_score: 58,
    cost_index: 50,
    demand_index: 55,
    verdict: 'Stable',
    verdictColor: 'bg-success/20 text-[var(--color-success)]',
    detail: 'USD/CNY effectively flat — no meaningful shift in competitive positioning vs. Chinese MDI producers (Wanhua) this week. Chinese producers maintain structural cost advantage of ~$80–120/t on MDI due to scale and lower energy costs. Currency stability means the competitive gap is unchanged; differentiation must come from technical service and specialty formulation value.',
  },
];

type SortKey = 'signal_score' | 'cost_index' | 'demand_index' | 'change_1d';

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'signal_score', label: 'Signal Health' },
  { value: 'cost_index',   label: 'Cost Pressure' },
  { value: 'demand_index', label: 'Demand Index' },
  { value: 'change_1d',    label: '1d Price Change' },
];

export default function LeaderboardPage() {
  const [sortBy, setSortBy]         = useState<SortKey>('signal_score');
  const [order, setOrder]           = useState<'asc' | 'desc'>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [signals, setSignals]       = useState(SIGNALS);

  useEffect(() => {
    fetch('/brief_data.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.commodities) return;
        const updated = SIGNALS.map((s) => {
          const labelMap: Record<string, string> = {
            wti: 'WTI Crude Oil',
            brent: 'Brent Crude',
            natgas: 'Natural Gas',
            xlb: 'XLB Materials',
            sp500: 'S&P 500',
            eurusd: 'EUR / USD',
          };
          const matchLabel = labelMap[s.id];
          if (matchLabel) {
            const card = data.commodities.find((c: any) => c.label === matchLabel);
            if (card) {
              let unitSuffix = '';
              if (s.id === 'wti' || s.id === 'brent') unitSuffix = ' /bbl';
              else if (s.id === 'natgas') unitSuffix = ' /MMBtu';

              let verdict = s.verdict;
              let verdictColor = s.verdictColor;
              let signal_score = s.signal_score;
              let cost_index = s.cost_index;

              if (card.status === 'ok') {
                verdict = s.id === 'eurusd' ? 'Mild Tailwind' : 'Stable';
                verdictColor = 'bg-success/20 text-[var(--color-success)]';
                signal_score = 65;
                cost_index = 40;
              } else if (card.status === 'warning') {
                verdict = s.id === 'natgas' ? 'Watch' : 'Cost Alert';
                verdictColor = 'bg-warning/20 text-[var(--color-warning)]';
                signal_score = 48;
                cost_index = 65;
              } else if (card.status === 'danger') {
                verdict = 'Cost Alert';
                verdictColor = 'bg-danger/20 text-[var(--chart-5)]';
                signal_score = 30;
                cost_index = 85;
              }

              let detail = s.detail;
              const priceMoveStr = `${card.change > 0 ? 'spiked +' : 'softened '}${Math.abs(card.change)}%`;
              detail = detail.replace(/spiked \+?\-?\d+(\.\d+)?%|softened \+?\-?\d+(\.\d+)?%/, priceMoveStr);
              detail = detail.replace(/\$\d+(\.\d+)?/, card.value);

              return {
                ...s,
                price: `${card.value}${unitSuffix}`,
                change_1d: card.change,
                change_5d: s.id === 'sp500' ? card.change : s.change_5d,
                verdict,
                verdictColor,
                signal_score,
                cost_index,
                detail,
              };
            }
          }
          return s;
        });
        setSignals(updated);
      })
      .catch(() => {});
  }, []);

  const sorted = [...signals].sort((a, b) =>
    order === 'asc' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]
  );

  return (
    <div className="animate-page-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Signal Board</h1>
        <p className="text-muted-foreground text-sm">
          Commodity &amp; macro signals ranked by health score — click any row for analysis
        </p>
      </div>

      {/* Relevant Alert Card */}
      <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-5 py-3 flex items-center gap-3 mb-6">
        <span className="text-[var(--color-danger)] font-mono text-xs font-bold uppercase tracking-widest">
          ALERT
        </span>
        <span className="text-sm text-foreground/90">
          Upstream aromatic feedstocks signaling margin pressure. Benzene Spot USGC above $1,010/t + Brent crude above $93/bbl trigger Cost Alerts for MDI and amines operations.
        </span>
        <Badge variant="outline" className="ml-auto border-[var(--color-danger)]/40 text-[var(--color-danger)] text-[10px]">
          CRITICAL COST PRESSURE
        </Badge>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm text-muted-foreground self-center mr-2">Sort by:</span>
        {sortOptions.map((o) => (
          <Button
            key={o.value}
            size="sm"
            variant={sortBy === o.value ? 'default' : 'outline'}
            onClick={() => setSortBy(o.value)}
          >
            {o.label}
          </Button>
        ))}
        <span className="text-sm text-muted-foreground self-center ml-4 mr-2">Order:</span>
        <Button size="sm" variant={order === 'desc' ? 'default' : 'outline'} onClick={() => setOrder('desc')}>
          High → Low
        </Button>
        <Button size="sm" variant={order === 'asc' ? 'default' : 'outline'} onClick={() => setOrder('asc')}>
          Low → High
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right select-none">
                <button 
                  onClick={() => {
                    setSortBy('change_1d');
                    toast.info('1-Day Price Move: Percentage change in price over the last trading day.');
                  }}
                  className="cursor-pointer hover:text-primary transition-colors underline decoration-dotted decoration-muted-foreground/30 font-semibold"
                >
                  1d %
                </button>
              </TableHead>
              <TableHead className="text-right select-none">
                <button 
                  onClick={() => {
                    setSortBy('signal_score');
                    toast.info('Signal Health (0-100): Composite index. Low scores represent high threat/cost pressure. High scores indicate favorable conditions.');
                  }}
                  className="cursor-pointer hover:text-primary transition-colors underline decoration-dotted decoration-muted-foreground/30 font-semibold"
                >
                  Health
                </button>
              </TableHead>
              <TableHead className="text-right select-none">
                <button 
                  onClick={() => {
                    setSortBy('cost_index');
                    toast.info('Cost Index (0-100): Input feedstock cost pressure. High scores indicate elevated margins compression threat.');
                  }}
                  className="cursor-pointer hover:text-primary transition-colors underline decoration-dotted decoration-muted-foreground/30 font-semibold"
                >
                  Cost
                </button>
              </TableHead>
              <TableHead className="text-right select-none">
                <button 
                  onClick={() => {
                    setSortBy('demand_index');
                    toast.info('Demand Index (0-100): Downstream volume indicators. High scores indicate robust downstream purchase sentiment.');
                  }}
                  className="cursor-pointer hover:text-primary transition-colors underline decoration-dotted decoration-muted-foreground/30 font-semibold"
                >
                  Demand
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s, i) => {
              const isExpanded = expandedId === s.id;
              const dayColor = s.change_1d > 0
                ? 'text-[var(--color-success)]'
                : s.change_1d < 0
                  ? 'text-[var(--chart-5)]'
                  : 'text-muted-foreground';
              return (
                <>
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  >
                    <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-semibold">
                      {s.name}
                      <Badge variant="outline" className={`ml-2 text-[10px] ${s.verdictColor}`}>
                        {s.verdict}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.category}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.price}</TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${dayColor}`}>
                      {s.change_1d > 0 ? '+' : ''}{s.change_1d.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono">{s.signal_score}</span>
                        <TrafficLight score={s.signal_score} size="sm" />
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{s.cost_index}</TableCell>
                    <TableCell className="text-right font-mono">{s.demand_index}</TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow key={`${s.id}-detail`} className="bg-secondary/40 hover:bg-secondary/40">
                      <TableCell colSpan={8} className="p-0 whitespace-normal">
                        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
                          {/* Left: score cards */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                              <p className="text-xs text-muted-foreground">Signal Health</p>
                              <p className="text-xl font-bold font-mono text-foreground">{s.signal_score}<span className="text-sm text-muted-foreground">/100</span></p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                              <p className="text-xs text-muted-foreground">Cost Index</p>
                              <p className={cn("text-xl font-bold font-mono", s.cost_index > 70 ? 'text-[var(--chart-5)]' : s.cost_index > 50 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]')}>
                                {s.cost_index}<span className="text-sm text-muted-foreground">/100</span>
                              </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                              <p className="text-xs text-muted-foreground">5-Day Move</p>
                              <p className={cn("text-xl font-bold font-mono", s.change_5d > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]')}>
                                {s.change_5d > 0 ? '+' : ''}{s.change_5d.toFixed(2)}%
                              </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                              <p className="text-xs text-muted-foreground">Demand Index</p>
                              <p className={cn("text-xl font-bold font-mono", s.demand_index < 45 ? 'text-[var(--chart-5)]' : s.demand_index < 60 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]')}>
                                {s.demand_index}<span className="text-sm text-muted-foreground">/100</span>
                              </p>
                            </div>
                          </div>
                          {/* Right: analysis */}
                          <div>
                            <h3 className="text-sm font-semibold text-primary mb-2 font-mono uppercase tracking-wider">Market Analysis</h3>
                            <p className="text-sm text-foreground/90 leading-relaxed">{s.detail}</p>
                            <p className="text-[11px] text-muted-foreground mt-3 font-mono">
                              Source: {s.ticker} via CME/NYSE · ChemSignals brief engine
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Explainer Card at the bottom */}
      <div className="mt-8 space-y-2">
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
            Signal Metrics &amp; Scoring Methodology
          </h3>
        </div>
        <div className="rounded-xl border border-border bg-card/30 p-6 space-y-4">
        <p className="text-sm text-muted-foreground dark:text-white/80 leading-relaxed">
          The ChemSignals Board rates, compiles, and ranks raw intermediate commodities and macroeconomic indicators to evaluate stress and pricing risk in Huntsman's supply chain.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">Signal Health Score (0-100)</h3>
            <p className="text-muted-foreground dark:text-white/70 leading-relaxed text-sm">
              A composite score evaluating the baseline health of an asset. Low scores (&lt; 40) signal high cost-pressure warnings or supply disruptions, requiring immediate commercial response (e.g., contract surcharges).
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">Cost Pressure Index (0-100)</h3>
            <p className="text-muted-foreground dark:text-white/70 leading-relaxed text-sm">
              Measures direct margin compression risk from upstream feedstock pricing. An index &gt; 70 highlights critical cost transmission windows, such as benzene/aniline inflation trickling down to MDI products.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">Demand Index (0-100)</h3>
            <p className="text-muted-foreground dark:text-white/70 leading-relaxed text-sm">
              Quantifies downstream volume pull from core sectors like housing construction (FRED HOUST) and automotive seating, signaling whether to adjust forward supply quotas or pricing structures.
            </p>
          </div>
        </div>
        <div className="border-t border-border/50 pt-3 flex items-center justify-between text-xs text-muted-foreground/60 dark:text-white/60 font-mono">
          <span>PIPELINE ENGINE: python3 scripts/monday_brief.py</span>
          <span>ANALYTIC CHANNELS: CME · FRED · ICIS Spot · Yahoo Finance</span>
        </div>
      </div>
      </div>
    </div>
  );
}
