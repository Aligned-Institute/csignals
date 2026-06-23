'use client';

import { useState, use } from 'react';
import useSWR from 'swr';
import type { SignalResponse, ModelSummaryResponse } from '@/types/api';
import { SignalCard } from '@/components/signals/SignalCard';
import { CompositeBar } from '@/components/signals/CompositeBar';
import { SignalChart } from '@/components/signals/SignalChart';
import { TrafficLight } from '@/components/signals/TrafficLight';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DownloadReportButton from '@/components/DownloadReportButton';
import { AddToPortfolioButton } from '@/components/portfolio/AddToPortfolioButton';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ModelDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const { id } = params;
  const [days, setDays] = useState(90);

  // Use centralized api client for all requests
  const { data: summary, isLoading: loadingSummary, error: errorSummary } = useSWR<ModelSummaryResponse>(
    id && id !== 'undefined' ? `/signal/${id}/summary` : null,
    api.fetcher
  );

  const { data: latest, isLoading: loadingLatest, error: errorLatest } = useSWR<SignalResponse>(
    id && id !== 'undefined' ? `/signal/${id}/latest` : null,
    api.fetcher
  );

  const { data: signals, error: errorSignals } = useSWR<SignalResponse[]>(
    id && id !== 'undefined' ? `/signal/${id}?days=${days}` : null,
    api.fetcher
  );

  if (loadingSummary || loadingLatest) {
    return (
      <div className="space-y-6 animate-page-in">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Gracefully handle undefined or initial loading states
  if (id === 'undefined') {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Initializing model context...</div>;
  }

  if (errorSummary || errorLatest || errorSignals) {
    return (
      <div className="p-6 animate-page-in text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
        <h2 className="font-bold mb-2">Data Transmission Error</h2>
        <p className="text-sm opacity-80">Unable to retrieve intelligence signals for "{id}". Ensuring backend refinery is operational.</p>
      </div>
    );
  }

  // Consistency score from behavioral_consistency (0-2 divergence index -> 0-100 score)
  const consistencyScore = latest
    ? Math.max(0, 100 - (latest.behavioral_consistency * 50))
    : 0;

  return (
    <div className="space-y-8 animate-page-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{summary?.model_name ?? 'Model Intelligence'}</h1>
            {summary && <TrafficLight score={summary.overall_risk_score} size="md" />}
          </div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-tighter">
            {summary?.developer ?? 'ASI Ecosystem'} &middot; {summary?.total_audits ?? 0} historical audits
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/models/${id}/tear-sheet`} passHref>
            <Button variant="outline" className="text-sm font-bold border-primary/50 hover:bg-primary/10">
              Analysis Tear Sheet
            </Button>
          </Link>
          <AddToPortfolioButton modelId={id} />
        </div>
      </div>

      {/* Signal Cards */}
      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <SignalCard 
            label="Net Burn" 
            value={latest.net_burn} 
            score={Math.min(100, Math.max(0, (latest.net_burn + 10) / 20 * 100))} 
            format="currency" 
            description="Net computational spend per task cycle; lower values indicate greater operational efficiency."
          />
          <SignalCard 
            label="Task Success" 
            value={latest.task_success_rate} 
            score={latest.task_success_rate} 
            format="percent" 
            description="Percentage of benchmark tasks completed successfully without human intervention."
          />
          <SignalCard 
            label="Goal Alignment" 
            value={latest.goal_alignment_fidelity} 
            score={latest.goal_alignment_fidelity} 
            format="number" 
            description="Degree to which the model's outputs match the intended goal specification (0–100)."
          />
          <SignalCard 
            label="Reasoning Consistency" 
            value={consistencyScore} 
            score={consistencyScore} 
            format="number" 
            description="Divergence index measuring output variance across repeated tasks; lower means more consistent."
          />
          <SignalCard
            label="Cost / Outcome"
            value={latest.cost_per_outcome}
            score={Math.min(100, Math.max(0, 100 - (latest.cost_per_outcome - 1) * 5))}
            format="currency"
            description="USD cost incurred per successful task output; lower values indicate greater cost efficiency."
          />
          <SignalCard
            label="Alignment Premium"
            value={latest.alignment_premium}
            score={Math.min(100, Math.max(0, (2.0 - (latest.alignment_premium - 1.0)) / 2.0 * 100))}
            format="number"
            description="How much extra compute is needed to produce an aligned output; 1.0 means alignment is fully intrinsic."
          />
        </div>
      )}

      {/* Composite Bars */}
      {summary && (
        <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary/70">Composite Risk Metrics</h3>
          <div className="space-y-4">
            <CompositeBar label="Economic Health" value={summary.economic_health_score} />
            <CompositeBar label="Safety Alignment" value={summary.safety_alignment_score} />
            <CompositeBar label="Overall Risk Intelligence" value={summary.overall_risk_score} />
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-primary">Signal Event Stream</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Multi-signal historical telemetry</p>
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {[7, 30, 90].map((d) => (
              <Button 
                key={d} 
                size="sm" 
                variant={days === d ? 'default' : 'ghost'} 
                className="text-xs h-8 px-3"
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>
        <div className="h-[400px] w-full">
          {signals && signals.length > 0 ? (
            <SignalChart data={signals} />
          ) : (
            <div className="flex items-center justify-center h-full border border-dashed rounded-lg opacity-50 italic">
              Awaiting historical signal data...
            </div>
          )}
        </div>
      </div>

      {/* PDF Report */}
      {latest && (
        <div className="pt-4 border-t border-border">
          <DownloadReportButton data={{
            model_name: summary?.model_name,
            overall_risk_score: latest.overall_risk_score,
            safety_alignment_score: latest.safety_alignment_score,
            economic_health_score: latest.economic_health_score,
            net_burn: latest.net_burn,
            task_success_rate: latest.task_success_rate,
            goal_alignment_fidelity: latest.goal_alignment_fidelity,
            behavioral_consistency: latest.behavioral_consistency,
          }} />
        </div>
      )}
    </div>
  );
}
