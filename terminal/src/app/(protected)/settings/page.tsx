'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, RefreshCw, Database, Shield, ShieldAlert, CheckCircle2, 
  HelpCircle, Eye, EyeOff, Radio, Clock, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SourceEntry {
  id: string;
  tenant_id: string;
  source_name: string;
  domain: string;
  connector: string;
  freshness_ttl: string | { minutes?: number; hours?: number; days?: number };
  confidence: number;
  active: boolean;
  config: any;
}

export default function SettingsPage() {
  const [sources, setSources] = useState<SourceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/alignment/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      } else {
        setErrorMsg('Failed to load registered sources.');
      }
    } catch (err) {
      setErrorMsg('FastAPI backend or Next.js proxy unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const formatTTL = (ttl: any) => {
    if (typeof ttl === 'string') {
      return ttl;
    }
    if (typeof ttl === 'object' && ttl !== null) {
      const parts = [];
      if (ttl.days) parts.push(`${ttl.days}d`);
      if (ttl.hours) parts.push(`${ttl.hours}h`);
      if (ttl.minutes) parts.push(`${ttl.minutes}m`);
      if (ttl.seconds) parts.push(`${ttl.seconds}s`);
      return parts.join(' ') || '0s';
    }
    return '2 minutes';
  };

  return (
    <div className="animate-page-in space-y-8 select-none">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Settings className="size-6 text-[#bd00ff]" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#bd00ff] bg-clip-text text-transparent">
              Platform Settings
            </h1>
          </div>
          <p className="text-muted-foreground dark:text-white/80 text-sm">
            Configure market telemetry registry, agent endpoints, and cache policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSources}
            className="gap-1.5 border-[#bd00ff]/20 hover:border-[#bd00ff]/40 text-[#bd00ff]"
          >
            <RefreshCw className="size-3.5" />
            Refresh Registry
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="size-10 text-[#bd00ff] animate-spin" />
          <p className="text-muted-foreground text-sm font-mono font-medium">Querying agent registry...</p>
        </div>
      ) : errorMsg ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4 max-w-xl mx-auto">
          <ShieldAlert className="size-12 text-red-400 mx-auto" />
          <h3 className="text-lg font-semibold">Sources Registry Unavailable</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Could not fetch registered sources. Ensure the backend FastAPI server is running on port 8100 and that Supabase tables are seeded.
          </p>
          <div className="pt-2 text-xs font-mono text-muted-foreground/60">
            Details: {errorMsg}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Overview Info Alert */}
          <div className="rounded-xl border border-[#bd00ff]/20 bg-[#bd00ff]/5 p-5 flex items-start gap-4 shadow-md">
            <Database className="size-8 text-[#bd00ff] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Decoupled Agent Connectors</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ChemSignals connects to commodity brokers, macro indices, and chemical RSS feeds via decoupled connector classes. Cache TTL policies enforce data freshness, and confidence values weight parallel decision aggregation.
              </p>
              <div className="text-[10px] text-[#bd00ff] font-semibold font-mono mt-2 uppercase tracking-wider">
                Note: Editing capability is disabled on this sprint. Toggle controls are read-only.
              </div>
            </div>
          </div>

          {/* Sources Connector List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1 select-none">
              <Radio className="size-4.5 text-[#00f3ff]" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
                Registered Connector Feeds ({sources.length})
              </h3>
            </div>

            {sources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sources.map((s) => (
                  <div 
                    key={s.id} 
                    className={`rounded-xl border bg-card p-6 flex flex-col justify-between hover-lift shadow-sm transition-colors duration-200 ${
                      s.active 
                        ? 'border-border hover:border-[#00f3ff]/40' 
                        : 'border-border/40 opacity-60'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Name & Active Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-bold font-mono text-foreground leading-snug">
                            {s.source_name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            ID: {s.id.substring(0, 18)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.active ? (
                            <Badge className="bg-[#00ff9d]/10 border-[#00ff9d]/30 text-[#00ff9d] text-[9px] font-mono uppercase tracking-wider px-2 py-0.5">
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-border text-muted-foreground text-[9px] font-mono uppercase tracking-wider px-2 py-0.5">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Detail Metrics */}
                      <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-lg border border-white/5 font-mono text-xs text-muted-foreground">
                        <div>
                          <span className="text-[9px] uppercase text-muted-foreground/50 tracking-wider block">Domain Classification</span>
                          <span className="text-foreground font-semibold uppercase">{s.domain}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-muted-foreground/50 tracking-wider block">Connector Target</span>
                          <span className="text-foreground font-semibold">{s.connector}</span>
                        </div>
                        <div className="pt-1">
                          <span className="text-[9px] uppercase text-muted-foreground/50 tracking-wider block">Freshness Cache TTL</span>
                          <span className="text-foreground font-semibold flex items-center gap-1">
                            <Clock className="size-3.5 text-[#00f3ff]" />
                            {formatTTL(s.freshness_ttl)}
                          </span>
                        </div>
                        <div className="pt-1">
                          <span className="text-[9px] uppercase text-muted-foreground/50 tracking-wider block">Agent Confidence</span>
                          <span className="text-foreground font-semibold flex items-center gap-1">
                            <Shield className="size-3.5 text-[#bd00ff]" />
                            {(s.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Toggle Indicator */}
                    <div className="border-t border-border/40 pt-4 mt-6 flex items-center justify-between text-xs font-mono text-muted-foreground/70">
                      <span>Scope: {s.tenant_id}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] tracking-wider uppercase text-muted-foreground/50">Registry Status:</span>
                        {s.active ? (
                          <ToggleRight className="size-6 text-[#00ff9d]" />
                        ) : (
                          <ToggleLeft className="size-6 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card/25 p-12 text-center text-xs text-muted-foreground font-mono space-y-3 max-w-xl mx-auto">
                <ShieldAlert className="size-10 text-muted-foreground/50 mx-auto" />
                <h4 className="text-sm font-semibold">No Registered Connectors</h4>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  The sources registry table was returned empty. This is expected if the Supabase database migrations are not applied or seeded yet.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
