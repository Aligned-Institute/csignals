'use client';

import { useState, useEffect } from 'react';
import { 
  GitCompare, RefreshCw, AlertTriangle, CheckCircle2, Clock, 
  ShieldAlert, Database, Cpu, History, ArrowRight, ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentDetail {
  agent_id: string;
  domain: string;
  source: string;
  fetched_at: string;
  freshness_status: string;
  confidence: number;
  data: any;
  raw_text: string;
}

interface ConflictRecord {
  agents: string[];
  type: string;
  description: string;
  resolution: string;
}

interface AlignedState {
  id: string;
  version: number;
  query_context: string;
  agents: AgentDetail[];
  conflicts: ConflictRecord[];
  aggregate_confidence: number;
  freshness_flags: {
    freshness_mismatch: boolean;
    stale_agents: string[];
    details: Record<string, any>;
  };
  aligned_at: string;
  state_hash: string;
}

interface HistoryItem {
  id: string;
  version: number;
  query_context: string;
  aggregate_confidence: number;
  aligned_at: string;
}

export default function AlignmentPage() {
  const [latestState, setLatestState] = useState<AlignedState | null>(null);
  const [selectedState, setSelectedState] = useState<AlignedState | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Latest Aligned State
  const fetchLatestState = async () => {
    setLoadingLatest(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/alignment/latest');
      if (res.ok) {
        const data = await res.json();
        setLatestState(data);
        setSelectedState(null); // default back to latest
      } else {
        const err = await res.json().catch(() => ({ error: 'Not found' }));
        setErrorMsg(err.error || 'Failed to fetch latest aligned state.');
      }
    } catch (err) {
      setErrorMsg('FastAPI backend or Next.js proxy unreachable.');
    } finally {
      setLoadingLatest(false);
    }
  };

  // Fetch History List
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/alignment/history?limit=15');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch Specific State by ID
  const inspectState = async (stateId: string) => {
    try {
      const res = await fetch(`/api/alignment/${stateId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedState(data);
      }
    } catch (err) {
      console.error('Failed to fetch specific state:', err);
    }
  };

  useEffect(() => {
    fetchLatestState();
    fetchHistory();

    // Subscribe to new aligned states written to Supabase
    const channel = supabase
      .channel('alignment_page_cdc')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'aligned_states' },
        (payload) => {
          console.log('Realtime insert detected:', payload.new);
          const newState = payload.new as AlignedState;
          setLatestState(newState);
          setSelectedState(null); // Reset selection to highlight latest
          
          // Prepend to history
          setHistory(prev => {
            const exists = prev.some(h => h.id === newState.id);
            if (exists) return prev;
            return [
              {
                id: newState.id,
                version: newState.version,
                query_context: newState.query_context,
                aggregate_confidence: newState.aggregate_confidence,
                aligned_at: newState.aligned_at
              },
              ...prev
            ].slice(0, 15);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeState = selectedState || latestState;
  const isViewingHistorical = selectedState !== null;

  // Render Status Badge
  const renderStatus = (state: AlignedState) => {
    const conf = state.aggregate_confidence;
    const hasMismatch = state.freshness_flags?.freshness_mismatch;
    const conflictsCount = state.conflicts?.length ?? 0;

    if (conf < 0.6) {
      return (
        <Badge className="bg-red-500/10 border-red-500/30 text-red-400 gap-1.5 px-3 py-1 font-mono uppercase tracking-wider text-xs">
          <ShieldAlert className="size-3.5" />
          Degraded State
        </Badge>
      );
    }
    if (hasMismatch) {
      return (
        <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400 gap-1.5 px-3 py-1 font-mono uppercase tracking-wider text-xs animate-pulse">
          <Clock className="size-3.5" />
          Freshness Mismatch
        </Badge>
      );
    }
    if (conflictsCount > 0) {
      return (
        <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400 gap-1.5 px-3 py-1 font-mono uppercase tracking-wider text-xs">
          <AlertTriangle className="size-3.5" />
          Resolving Conflicts
        </Badge>
      );
    }
    return (
      <Badge className="bg-[#00ff9d]/10 border-[#00ff9d]/30 text-[#00ff9d] gap-1.5 px-3 py-1 font-mono uppercase tracking-wider text-xs">
        <CheckCircle2 className="size-3.5" />
        Aligned Optimal
      </Badge>
    );
  };

  return (
    <div className="animate-page-in space-y-8 select-none">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <GitCompare className="size-6 text-[#00f3ff]" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#00f3ff] bg-clip-text text-transparent">
              Alignment Inspector
            </h1>
          </div>
          <p className="text-muted-foreground dark:text-white/80 text-sm">
            Canonical aligned state monitoring, multi-agent conflicts, and resolution telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { fetchLatestState(); fetchHistory(); }}
            className="gap-1.5 border-[#00f3ff]/20 hover:border-[#00f3ff]/40 text-[#00f3ff]"
          >
            <RefreshCw className="size-3.5" />
            Force Sync
          </Button>
        </div>
      </div>

      {loadingLatest ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="size-10 text-[#00f3ff] animate-spin" />
          <p className="text-muted-foreground text-sm font-mono">Querying Supabase registry...</p>
        </div>
      ) : errorMsg ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4 max-w-xl mx-auto">
          <ShieldAlert className="size-12 text-red-400 mx-auto" />
          <h3 className="text-lg font-semibold">No Aligned Engine Context Available</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            FastAPI did not return a latest aligned state. This is normal if the server was just booted and no MCP agents have run yet, or if tables are not migrated in Supabase.
          </p>
          <div className="pt-2 text-xs font-mono text-muted-foreground/60">
            Details: {errorMsg}
          </div>
        </div>
      ) : activeState ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left 3 Columns: Inspector Detail */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Context & Overview Widget */}
            <div className="rounded-xl border border-border bg-card/40 backdrop-blur-md p-6 relative overflow-hidden shadow-lg glow-cyan/5">
              {isViewingHistorical && (
                <div className="absolute top-0 right-0 bg-purple-500/20 border-b border-l border-purple-500/30 text-purple-300 px-4 py-1 rounded-bl-lg font-mono text-[10px] uppercase tracking-widest font-bold">
                  Historical Version (v{activeState.version})
                </div>
              )}
              {!isViewingHistorical && (
                <div className="absolute top-0 right-0 bg-[#00f3ff]/10 border-b border-l border-[#00f3ff]/20 text-[#00f3ff] px-4 py-1 rounded-bl-lg font-mono text-[10px] uppercase tracking-widest font-bold">
                  Live Active State
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">
                    Version Context v{activeState.version}
                  </span>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Hash: <span className="text-zinc-300 font-semibold">{activeState.state_hash.substring(0, 16)}...</span>
                  </span>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(activeState.aligned_at).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider block">Query Target Context</span>
                  <h2 className="text-lg font-mono font-bold text-[#00f3ff] leading-relaxed">
                    "{activeState.query_context}"
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">Engine Status:</span>
                    {renderStatus(activeState)}
                  </div>
                  {isViewingHistorical && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedState(null)}
                      className="text-xs h-7 text-[#bd00ff] hover:text-[#bd00ff]/80 hover:bg-[#bd00ff]/10"
                    >
                      Return to Live Latest
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Confidence & Mismatch Gauge Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Radial Confidence Gauge Card */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-md">
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">Aggregate Score</span>
                <div className="relative size-32 flex items-center justify-center">
                  <svg className="size-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="40" 
                      className="stroke-muted dark:stroke-white/5" 
                      strokeWidth="8" fill="transparent" 
                    />
                    <circle 
                      cx="50" cy="50" r="40" 
                      className="stroke-[#00f3ff]" 
                      strokeWidth="8" fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - activeState.aggregate_confidence)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold font-mono text-white">
                      {(activeState.aggregate_confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">Aligned</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-3">
                  Score: {activeState.aggregate_confidence.toFixed(3)}
                </div>
              </div>

              {/* Freshness Health Card */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between relative shadow-md">
                <div>
                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-3">Freshness Health</span>
                  {activeState.freshness_flags?.freshness_mismatch ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Clock className="size-5 shrink-0" />
                        <span className="text-sm font-semibold">Mismatch Alert</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Data from agents representing different times are mixed in this query run. Confidence score has been penalized.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[#00ff9d]">
                        <CheckCircle2 className="size-5 shrink-0" />
                        <span className="text-sm font-semibold">Synchronized Health</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        All active agents fetched data within their respective TTL constraints. Temporal alignment is optimal.
                      </p>
                    </div>
                  )}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground/60 border-t border-border/40 pt-2.5 mt-4">
                  Stale count: {activeState.freshness_flags?.stale_agents?.length ?? 0} agents
                </div>
              </div>

              {/* Data Sources Health Card */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between relative shadow-md">
                <div>
                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-3">Active Pipeline</span>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#00f3ff]">
                      <Cpu className="size-5" />
                      <span className="text-sm font-semibold font-mono">{activeState.agents?.length ?? 0} Agents Live</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeState.agents?.map(a => (
                        <Badge key={a.agent_id} variant="outline" className="text-[10px] font-mono border-white/10 dark:text-white">
                          {a.agent_id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground/60 border-t border-border/40 pt-2.5 mt-4">
                  Conflict registry: {activeState.conflicts?.length ?? 0} active
                </div>
              </div>
            </div>

            {/* Conflict Resolution Registry */}
            <div>
              <div className="flex items-center gap-2 mb-3 select-none">
                <ShieldAlert className="size-4.5 text-[#00f3ff]" />
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
                  Conflict Registry &amp; Resolutions
                </h3>
              </div>

              {activeState.conflicts && activeState.conflicts.length > 0 ? (
                <div className="space-y-4">
                  {activeState.conflicts.map((conflict, idx) => (
                    <div 
                      key={idx} 
                      className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3 shadow-md glow-amber/5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] uppercase font-mono tracking-widest px-2 py-0.5">
                            {conflict.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            Involved: {conflict.agents.join(' + ')}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400/80">
                          Penalized: -0.1
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 font-mono leading-relaxed bg-black/25 px-4 py-2.5 rounded-lg border border-white/5">
                        {conflict.description}
                      </p>
                      <div className="flex items-start gap-2 bg-[#00f3ff]/5 border border-[#00f3ff]/20 px-4 py-2.5 rounded-lg">
                        <CheckCircle2 className="size-4.5 text-[#00f3ff] shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase font-mono text-muted-foreground tracking-wider block">Annotated Resolution Directive</span>
                          <p className="text-xs text-[#00f3ff] font-semibold leading-relaxed font-mono">
                            {conflict.resolution}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[#00ff9d]/30 bg-[#00ff9d]/5 p-6 flex items-center gap-4 shadow-sm">
                  <CheckCircle2 className="size-10 text-[#00ff9d] shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Perfect Data Convergence</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      No active anomalies, contradictions, or directional mismatches were identified by gemma3:4b for this agent set. Synthesis runs on unified state.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Agent Telemetry Inspector */}
            <div>
              <div className="flex items-center gap-2 mb-3 select-none">
                <Database className="size-4.5 text-[#00f3ff]" />
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
                  Agent Telemetry Cards
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeState.agents?.map((a) => (
                  <div key={a.agent_id} className="rounded-xl border border-border bg-card p-5 space-y-4 flex flex-col justify-between hover-lift shadow-sm hover:border-[var(--color-primary)]/50 transition-colors duration-200">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold font-mono text-foreground capitalize">
                            {a.agent_id} Agent
                          </h4>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {a.source}
                          </span>
                        </div>
                        {a.freshness_status === 'stale' ? (
                          <Badge variant="outline" className="border-red-500/30 text-red-400 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 animate-pulse">
                            Stale (TTL Expired)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-[#00ff9d]/30 text-[#00ff9d] font-mono text-[9px] uppercase tracking-wider px-2 py-0.5">
                            Fresh
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground dark:text-white/80 leading-relaxed font-mono bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin">
                        {a.raw_text}
                      </div>
                    </div>

                    <div className="border-t border-border/40 pt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground/70">
                      <span>Conf: <strong className="text-zinc-200">{a.confidence.toFixed(2)}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(a.fetched_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Version History Sidebar (1 Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2 mb-1 select-none">
              <History className="size-4 text-[#bd00ff]" />
              <h3 className="text-xs font-bold text-[#bd00ff] uppercase tracking-widest font-mono">
                State Version History
              </h3>
            </div>

            {loadingHistory ? (
              <div className="text-center py-6 text-xs text-muted-foreground font-mono">Loading history...</div>
            ) : history.length > 0 ? (
              <div className="rounded-xl border border-border bg-card/30 p-2 space-y-1 max-h-[80vh] overflow-y-auto scrollbar-thin">
                {history.map((h) => {
                  const isCurrentSelected = activeState.id === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => inspectState(h.id)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                        isCurrentSelected
                          ? 'bg-[#00f3ff]/5 border-[#00f3ff]/30 text-white'
                          : 'border-transparent bg-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isCurrentSelected ? 'text-[#00f3ff]' : 'text-zinc-400'}`}>
                          v{h.version} State
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          {new Date(h.aligned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono line-clamp-2 leading-relaxed">
                        "{h.query_context}"
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-muted-foreground/60">
                        <span>Conf: {h.aggregate_confidence.toFixed(2)}</span>
                        {isCurrentSelected && <span className="text-[#00f3ff] text-[9px] uppercase tracking-widest">Selected</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card/25 p-6 text-center text-xs text-muted-foreground font-mono">
                No past alignments recorded.
              </div>
            )}
          </div>

        </div>
      ) : null}

    </div>
  );
}
