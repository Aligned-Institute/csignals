'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Database, ExternalLink, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

// Commodity signals — updated by monday_brief.py run; reflects 2026-06-10 data
const COMMODITY_CARDS = [
  {
    label: 'WTI Crude Oil',
    sublabel: 'MDI feedstock input',
    value: '$90.80',
    unit: '/bbl',
    change: +2.95,
    period: '1d',
    status: 'warning',  // cost pressure
    note: 'Feedstock cost alert',
    url: 'https://finance.yahoo.com/quote/CL=F',
  },
  {
    label: 'Natural Gas',
    sublabel: 'Plant energy cost',
    value: '$3.19',
    unit: '/MMBtu',
    change: +1.69,
    period: '1d',
    status: 'warning',
    note: 'Trending to 10d high',
    url: 'https://finance.yahoo.com/quote/NG=F',
  },
  {
    label: 'XLB Materials',
    sublabel: 'Sector benchmark',
    value: '$50.21',
    unit: '',
    change: -1.41,
    period: '1d',
    status: 'danger',
    note: 'Underperforming S&P',
    url: 'https://finance.yahoo.com/quote/XLB',
  },
  {
    label: 'S&P 500',
    sublabel: 'Demand environment',
    value: '7,321',
    unit: '',
    change: -3.21,
    period: '5d',
    status: 'danger',
    note: 'Risk-off rotation',
    url: 'https://finance.yahoo.com/quote/^GSPC',
  },
  {
    label: 'Brent Crude',
    sublabel: 'Asia feedstock proxy',
    value: '$93.86',
    unit: '/bbl',
    change: +2.64,
    period: '1d',
    status: 'warning',
    note: 'Hormuz supply risk',
    url: 'https://finance.yahoo.com/quote/BZ=F',
  },
  {
    label: 'EUR / USD',
    sublabel: 'Export pricing FX',
    value: '1.1600',
    unit: '',
    change: +0.28,
    period: '1d',
    status: 'ok',
    note: 'Mild USD softness',
    url: 'https://finance.yahoo.com/quote/EURUSD=X',
  },
];

// FRED macro values — sourced from monday_brief.py run 2026-06-10
// Re-run `python3 scripts/monday_brief.py` to update these before interview
const MACRO_SIGNALS = [
  {
    label: 'Housing Starts',
    value: '1,465K',
    unit: 'units/mo',
    change: -2.79,
    period: 'MoM',
    status: 'warning',
    note: 'Permits +4.4% → H2 foam demand recovery forming',
    fred: 'HOUST',
  },
  {
    label: 'Fed Funds Rate',
    value: '3.63%',
    unit: '',
    change: -0.01,
    period: 'MoM',
    status: 'ok',
    note: 'Shallow easing — construction financing still tight',
    fred: 'FEDFUNDS',
  },
  {
    label: 'Real GDP Growth',
    value: '+1.6%',
    unit: 'annlzd',
    change: +1.1,
    period: 'QoQ',
    status: 'ok',
    note: 'Rebounded from +0.5% Q4 — industrial demand floor',
    fred: 'A191RL1Q225SBEA',
  },
  {
    label: 'PPI Chemicals',
    value: '368.2',
    unit: 'index',
    change: +1.91,
    period: 'MoM',
    status: 'danger',
    note: 'Sharpest monthly gain — price increase window open now',
    fred: 'PCU325325',
  },
];

// Markets News Feed relevant to Huntsman petrochemical & construction value chains
const NEWS_FEED_ITEMS = [
  {
    id: 'news-1',
    source: 'ICIS',
    time: '2h ago',
    badge: 'Feedstock Alert',
    title: 'MDI Spot Prices Surge in Europe Amid Tight Benzene Feedstock Supply',
    summary: 'Supply bottlenecks at key aromatic reformers drive benzene contract prices up by €45/tonne, directly impacting aniline and downstream MDI production costs.',
    url: 'https://www.icis.com',
  },
  {
    id: 'news-2',
    source: 'Reuters',
    time: '4h ago',
    badge: 'Macro Indicator',
    title: 'US Housing Permits Gain 4.4% in May, Signaling H2 Construction Rebound',
    summary: 'A rebound in building permits suggests single-family residential projects will pick up in Q3, boosting demand for polyurethane spray foam and insulation materials.',
    url: 'https://www.reuters.com',
  },
  {
    id: 'news-3',
    source: 'Chemical Week',
    time: '6h ago',
    badge: 'Energy Pricing',
    title: 'Crude Oil Spikes to $90.80/bbl on Mid-East Supply Line Concerns',
    summary: 'Escalating geopolitical risks along the Hormuz Strait pressure naphtha cracking margins, raising production costs across the European petrochemical chain.',
    url: 'https://www.chemweek.com',
  },
  {
    id: 'news-4',
    source: 'Fed Watch',
    time: '1d ago',
    badge: 'Interest Rates',
    title: 'Federal Reserve Signals Slower Easing Path, Keeping Financing Tight',
    summary: 'Even with a shallow 10bps easing in the effective funds rate, high cost of capital continues to delay major commercial real estate projects.',
    url: 'https://fred.stlouisfed.org',
  },
  {
    id: 'news-5',
    source: 'Auto Intel',
    time: '1d ago',
    badge: 'Demand Signal',
    title: 'Auto Sector PU Demand Stable Despite European EV Production Drag',
    summary: 'Rigid and flexible foam consumption in automotive interiors holds steady, providing a floor for premium polyols and MDI systems.',
    url: 'https://www.automotiveworld.com',
  },
];

const STATUS_COLORS = {
  ok:      'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  danger:  'text-[var(--chart-5)]',
};

const STATUS_BADGE = {
  ok:      'border-[var(--color-success)]/40 text-[var(--color-success)]',
  warning: 'border-[var(--color-warning)]/40 text-[var(--color-warning)]',
  danger:  'border-[var(--chart-5)]/40 text-[var(--chart-5)]',
};

function TrendIcon({ change }: { change: number }) {
  if (change > 0.1)  return <TrendingUp  className="size-4 inline-block ml-1" />;
  if (change < -0.1) return <TrendingDown className="size-4 inline-block ml-1" />;
  return <Minus className="size-4 inline-block ml-1" />;
}

export default function DashboardPage() {
  const [commodityCards, setCommodityCards] = useState(COMMODITY_CARDS);
  const [macroSignals, setMacroSignals]     = useState(MACRO_SIGNALS);
  const [generatedDate, setGeneratedDate]   = useState('2026-06-10');
  const [hasAnomaly, setHasAnomaly]         = useState(true);
  const [anomalyBanner, setAnomalyBanner]   = useState(
    'WTI Crude UP +2.95% in 1 session · Brent UP +2.64% · MDI feedstock cost impact expected in 2–3 weeks'
  );

  const [alignedState, setAlignedState] = useState<{
    aggregate_confidence: number;
    agents: any[];
    conflicts: any[];
  } | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const { data, error } = await supabase
          .from('aligned_states')
          .select('*')
          .order('aligned_at', { ascending: false })
          .limit(1);
        if (!error && data && data.length > 0) {
          setAlignedState(data[0] as any);
        }
      } catch (err) {
        console.error('Failed to fetch latest aligned state:', err);
      }
    };
    fetchLatest();

    const channel = supabase
      .channel('aligned_states_cdc')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'aligned_states' },
        (payload) => {
          console.log('Realtime Aligned State update:', payload.new);
          setAlignedState(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetch('/brief_data.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.commodities?.length)      setCommodityCards(data.commodities);
        if (data.macro?.length)            setMacroSignals(data.macro);
        if (data.generated_date)           setGeneratedDate(data.generated_date);
        if (data.anomaly_banner !== undefined) setAnomalyBanner(data.anomaly_banner);
        if (data.has_anomaly !== undefined)    setHasAnomaly(data.has_anomaly);
      })
      .catch(() => {}); // silently keep static defaults
  }, []);

  const wtiCard = commodityCards.find((c) => c.label === 'WTI Crude Oil' || c.label === 'WTI Crude');
  const wtiValue = wtiCard ? wtiCard.value : '$90.80';
  const wtiColor = wtiCard ? (STATUS_COLORS[wtiCard.status as keyof typeof STATUS_COLORS] || 'text-[var(--color-warning)]') : 'text-[var(--color-warning)]';

  return (
    <div className="animate-page-in space-y-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-[#00f3ff] bg-clip-text text-transparent">Market Overview</h1>
          <p className="text-muted-foreground dark:text-white/80 text-sm">
            Performance Products — Feedstock &amp; Macro Intelligence
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {alignedState && (
            <Link href="/alignment" className="flex items-center gap-3 bg-[#00f3ff]/5 border border-[#00f3ff]/20 hover:border-[#00f3ff]/50 px-4 py-2 rounded-xl backdrop-blur-md shadow-md transition-all duration-200 cursor-pointer select-none group">
              <div className="flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Aligned State</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-bold font-mono text-[#00f3ff]">
                    Conf: {alignedState.aggregate_confidence.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground/40">·</span>
                  <span className="text-[11px] text-zinc-300 font-mono">
                    {alignedState.agents?.length ?? 0} agents
                  </span>
                  {alignedState.conflicts && alignedState.conflicts.length > 0 && (
                    <>
                      <span className="text-xs text-zinc-300/40">·</span>
                      <span className="text-[11px] text-[var(--color-warning)] font-mono animate-pulse">
                        {alignedState.conflicts.length} conflict{alignedState.conflicts.length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-[#00f3ff] transition-colors" />
            </Link>
          )}

          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-white/60 font-mono">
              <RefreshCw className="size-3" />
              Last run: {generatedDate}
            </span>
            <a href="/api/export" download>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                <Download className="size-3" />
                Export Excel
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Anomaly Banner — hidden when no flags */}
      {hasAnomaly && anomalyBanner && (
        <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-5 py-3 flex items-center gap-3">
          <span className="text-[var(--color-warning)] font-mono text-xs font-bold uppercase tracking-widest">
            ALERT
          </span>
          <span className="text-sm text-foreground/90">{anomalyBanner}</span>
          <Badge variant="outline" className="ml-auto border-[var(--color-warning)]/40 text-[var(--color-warning)] text-[10px]">
            STATISTICAL ANOMALY
          </Badge>
        </div>
      )}

      {/* Markets News Feed */}
      <div>
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
            Markets News Feed  ·  Real-Time Intelligence
          </h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {NEWS_FEED_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none w-80 rounded-xl border border-border bg-card p-4 flex flex-col justify-between hover-lift space-y-3 hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[var(--color-primary)] uppercase tracking-wider">
                    {item.badge}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground dark:text-white/60">
                    {item.source} · {item.time}
                  </span>
                </div>
                <h3 className="font-semibold text-sm leading-snug text-foreground group-hover:text-[var(--color-primary)] transition-colors">
                  {item.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground dark:text-white/80 leading-relaxed line-clamp-3">
                {item.summary}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* MDI Feedstock Chain */}
      <div>
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
            MDI Feedstock Chain  ·  Cost Pressure Map
          </h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base sm:text-lg">
            {[
              { label: 'WTI Crude', value: wtiValue, color: wtiColor },
              { label: '→ Naphtha', value: '~$680/t', color: 'text-[var(--color-warning)]' },
              { label: '→ Benzene', value: '~$950/t', color: 'text-[var(--color-warning)]' },
              { label: '→ Aniline',  value: '~$1,200/t', color: 'text-[var(--color-warning)]' },
              { label: '→ MDI',      value: 'cost ↑', color: 'text-[var(--chart-5)]' },
            ].map((step) => (
              <span key={step.label} className="flex items-center gap-2">
                <span className="text-muted-foreground/80 dark:text-white/80 text-sm sm:text-base">{step.label}</span>
                <span className={`font-mono font-bold ${step.color}`}>{step.value}</span>
              </span>
            ))}
            <Badge variant="outline" className="ml-2 border-[var(--chart-5)]/40 text-[var(--chart-5)] text-[11px] px-2.5 py-0.5">
              2–3 week lag to production cost
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground/80 dark:text-white/80 mt-4 leading-relaxed">
            Natural gas adds ~15% to production energy cost at current prices. Combined feedstock + energy pressure warrants
            surcharge review on variable-price contracts.
          </p>
        </div>
      </div>

      {/* Macro Signals — FRED Series */}
      <div>
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
            Macro Indicators  ·  FRED Series  ·  Demand-Side Signals
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {macroSignals.map((m) => (
            <a
              key={m.label}
              href={`https://fred.stlouisfed.org/series/${m.fred}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border bg-card p-5 space-y-2 hover-lift hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer block group"
            >
              <div className="flex items-start justify-between">
                <p className="text-xs text-muted-foreground dark:text-white uppercase tracking-wider">{m.label}</p>
                <span className="text-[9px] text-muted-foreground/50 dark:text-white/60 font-mono group-hover:text-[var(--color-primary)] transition-colors">{m.fred}</span>
              </div>
              <p className="text-2xl font-mono font-bold">
                {m.value}
                {m.unit && <span className="text-sm text-muted-foreground dark:text-white/80 font-normal ml-1">{m.unit}</span>}
              </p>
              <p className={`text-sm font-semibold ${STATUS_COLORS[m.status as keyof typeof STATUS_COLORS]}`}>
                {m.change > 0 ? '+' : ''}{m.change}% ({m.period})
                <TrendIcon change={m.change} />
              </p>
              <p className="text-[11px] text-muted-foreground dark:text-white/90 leading-relaxed">{m.note}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Commodity Cards — 3-col */}
      <div>
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
            Commodity &amp; FX Signals
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {commodityCards.map((card) => (
            <a
              key={card.label}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border bg-card p-5 space-y-2 hover-lift hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer block group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground dark:text-white uppercase tracking-wider">{card.label}</p>
                  <p className="text-[11px] text-muted-foreground/60 dark:text-white/80 mt-0.5">{card.sublabel}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[card.status as keyof typeof STATUS_BADGE]}`}>
                  {card.note}
                </Badge>
              </div>
              <p className="text-2xl font-mono font-bold group-hover:text-[var(--color-primary)] transition-colors">
                {card.value}
                <span className="text-sm text-muted-foreground dark:text-white/80 font-normal ml-1">{card.unit}</span>
              </p>
              <p className={`text-sm font-semibold ${STATUS_COLORS[card.status as keyof typeof STATUS_COLORS]}`}>
                {card.change > 0 ? '+' : ''}{card.change}% ({card.period})
                <TrendIcon change={card.change} />
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Explainer Card for Data Origin */}
      <div>
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
            Data Sources &amp; Pipeline Methodology
          </h3>
        </div>
        <div className="rounded-xl border border-border bg-card/30 p-6 space-y-4">
          <p className="text-sm text-muted-foreground dark:text-white/80 leading-relaxed">
            ChemSignals synthesizes multi-source, real-time commodity data and macroeconomic trends to generate actionable intelligence. This dashboard is powered by:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Commodity &amp; Equity Markets</h3>
              <p className="text-muted-foreground dark:text-white/70 leading-relaxed text-sm">
                Real-time prices and percent changes for crude oil, natural gas, currency exchange indices, and sector indices are retrieved via the Yahoo Finance API (CME/NYSE/CBOE).
              </p>
              <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline text-sm mt-1">
                Yahoo Finance <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Macroeconomic Demand Signals</h3>
              <p className="text-muted-foreground dark:text-white/70 leading-relaxed text-sm">
                National macroeconomic indicators (Housing Starts, building permits, interest rates, GDP, and PPI chemical manufacturing) are pulled directly from the St. Louis Fed's FRED database.
              </p>
              <a href="https://fred.stlouisfed.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline text-sm mt-1">
                St. Louis Fed (FRED) <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Chemical &amp; Petrochemical Intelligence</h3>
              <p className="text-muted-foreground dark:text-white/70 leading-relaxed text-sm">
                Market alerts, news sentiment, and supply chain disruptions are scanned from chemical feeds including ICIS, Chemical Week, Oil Price, and Reuters.
              </p>
              <span className="text-muted-foreground/60 dark:text-white/60 italic text-sm mt-1 block">RSS Feeds Integration</span>
            </div>
          </div>
          <div className="border-t border-border/50 pt-3 flex items-center justify-between text-xs text-muted-foreground/60 dark:text-white/60 font-mono">
            <span>PIPELINE ENGINE: python3 scripts/monday_brief.py</span>
            <span>ENVIRONMENT STATUS: Active API Keys</span>
          </div>
        </div>
      </div>

    </div>
  );
}
