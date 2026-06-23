// terminal/src/components/tear-sheet/TearSheet.tsx
import React from 'react';
import { TearSheetData, BenchmarkResult, BenchmarkStatus } from '@/types/chart_data';
import { ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, XCircle, AlertTriangle, Download, Share2 } from 'lucide-react';
import Link from 'next/link';

interface TearSheetProps {
  data: TearSheetData | null | undefined;
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable' | undefined) => {
  switch (trend) {
    case 'up':
      return <ArrowUpRight className="text-green-500 w-4 h-4 inline-block ml-1" />;
    case 'down':
      return <ArrowDownRight className="text-red-500 w-4 h-4 inline-block ml-1" />;
    case 'stable':
    default:
      return <Minus className="text-gray-500 w-4 h-4 inline-block ml-1" />;
  }
};

const getBenchmarkStatusIcon = (status: BenchmarkStatus | undefined) => {
  switch (status) {
    case 'passed':
      return <CheckCircle2 className="text-green-500 w-5 h-5" />;
    case 'failed':
      return <XCircle className="text-red-500 w-5 h-5" />;
    case 'partial':
      return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
    case 'n/a':
    default:
      return <Minus className="text-gray-500 w-5 h-5" />;
  }
};

const TearSheet: React.FC<TearSheetProps> = ({ data }) => {
  // Defensive guard for missing or initializing data
  // Cast to any to allow check against "Initializing..." without type errors
  if (!data || !data.companyInfo || (data.companyInfo.name as any) === 'Initializing...') {
    return (
      <div className="bg-card rounded-lg shadow-xl p-12 text-center text-muted-foreground animate-pulse">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-xl font-semibold">Generating Risk Intelligence Report...</p>
        <p className="text-sm mt-2">Connecting to decentralized sensors and aggregating event streams.</p>
      </div>
    );
  }

  const {
    companyInfo,
    asiCompositeScore,
    coreMetrics,
    benchmarkPerformance,
    qualitativeSummary,
    technicalDetails,
    recentAuditHistory,
  } = data;

  return (
    <div className="bg-card rounded-lg shadow-xl p-8 space-y-8 text-foreground animate-page-in">
      {/* Header & Executive Summary */}
      <div className="flex justify-between items-center border-b border-border pb-6 mb-6">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            {companyInfo.name || 'Unknown Model'}
          </h1>
          <p className="text-lg text-muted-foreground">{companyInfo.isPublic ? 'Public Entity' : 'Private Project'}</p>
        </div>
        <div className="text-right">
          <div className="text-6xl font-bold text-green-400 mb-1">
            {asiCompositeScore?.score ?? 'N/A'}
          </div>
          <p className="text-xl text-muted-foreground">{asiCompositeScore?.verbalRating ?? 'Rating Pending'}</p>
          <div className="mt-4 space-x-2">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded inline-flex items-center text-sm">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </button>
            <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded inline-flex items-center text-sm">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Core Risk & Economic Metrics */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Core Risk & Economic Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TearSheetMetricCard
            title="Vaporware Probability"
            value={coreMetrics?.vaporwareProbability?.value !== undefined ? `${coreMetrics.vaporwareProbability.value}%` : 'N/A'}
            trend={coreMetrics?.vaporwareProbability?.trend}
            description="Likelihood of performance-to-hype mismatch."
          />
          <TearSheetMetricCard
            title="Safety Score"
            value={coreMetrics?.safetyScore?.value !== undefined ? `${coreMetrics.safetyScore.value}/100` : 'N/A'}
            trend={coreMetrics?.safetyScore?.trend}
            description="Ethical alignment and constraint adherence."
          />
          <TearSheetMetricCard
            title="Unit Economics"
            value={coreMetrics?.unitEconomics?.value !== undefined ? `$${coreMetrics.unitEconomics.value}/output` : 'N/A'}
            trend={coreMetrics?.unitEconomics?.trend}
            description="Normalized cost per successful task outcome."
          />
        </div>
      </section>

      {/* Standardized Benchmark Performance */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Standardized Benchmark Performance</h2>
        <div className="grid grid-cols-1 gap-4">
          {benchmarkPerformance?.map((benchmark, index) => (
            <BenchmarkItemCard key={index} benchmark={benchmark} />
          )) ?? <p className="text-muted-foreground italic">Performance data pending benchmark completion.</p>}
        </div>
      </section>

      {/* Qualitative Behavior Summary */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Qualitative Behavior Summary</h2>
        <div className="bg-muted p-6 rounded-lg">
          <p className="text-muted-foreground italic mb-4">"{qualitativeSummary?.synopsis ?? 'Awaiting behavioral analysis synopsis...'}"</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-green-400 mb-2">Capabilities:</h3>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                {qualitativeSummary?.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                )) ?? <li>Observation pending</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-400 mb-2">Weaknesses / Risk Factors:</h3>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                {qualitativeSummary?.weaknesses?.map((w, i) => (
                  <li key={i}>{w}</li>
                )) ?? <li>No critical risks detected</li>}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technical & Contextual Details */}
      {data.technicalDetails && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Technical & Contextual Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {data.technicalDetails.architecture && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Architecture</p>
                <p className="font-mono text-xs">{data.technicalDetails.architecture}</p>
              </div>
            )}
            {data.technicalDetails.trainingDataOverview && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Training Data</p>
                <p className="text-xs">{data.technicalDetails.trainingDataOverview}</p>
              </div>
            )}
            {data.technicalDetails.pricingModel && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pricing Model</p>
                <p className="text-xs">{data.technicalDetails.pricingModel}</p>
              </div>
            )}
            {data.technicalDetails.apiEndpoints && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">API Endpoints</p>
                <p className="font-mono text-xs">{data.technicalDetails.apiEndpoints}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Audit History */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Recent Audit History</h2>
        <div className="bg-muted p-6 rounded-lg overflow-x-auto">
          <table className="min-w-full text-left text-muted-foreground text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Benchmark Suite</th>
                <th className="py-2 px-4">Safety</th>
                <th className="py-2 px-4">Cost</th>
                <th className="py-2 px-4">Outcome</th>
                <th className="py-2 px-4">Lineage</th>
              </tr>
            </thead>
            <tbody>
              {recentAuditHistory?.map((audit, index) => (
                <tr key={index} className="border-b border-border last:border-b-0 hover:bg-white/5">
                  <td className="py-2 px-4 whitespace-nowrap">{audit.date ? new Date(audit.date).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-2 px-4">{audit.benchmark || 'General Audit'}</td>
                  <td className="py-2 px-4">{audit.safetyScore ?? '??'}/100</td>
                  <td className="py-2 px-4">${Number(audit.cost ?? 0).toFixed(3)}</td>
                  <td className="py-2 px-4 font-medium">{audit.outcome || 'Unknown'}</td>
                  <td className="py-2 px-4">
                    <Link href={`/audits/${audit.auditId}`} className="text-blue-400 hover:underline">
                      Proof
                    </Link>
                  </td>
                </tr>
              )) ?? <tr><td colSpan={6} className="text-center py-8 opacity-50 italic">No historical event streams available.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

// Helper Components
const TearSheetMetricCard: React.FC<{ title: string; value: string; trend: any; description: string }> = ({
  title,
  value,
  trend,
  description,
}) => (
  <div className="bg-muted p-4 rounded-lg flex flex-col justify-between border border-border/50">
    <div>
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</h3>
      <div className="text-3xl font-bold text-primary flex items-baseline gap-2">
        {value} {getTrendIcon(trend)}
      </div>
    </div>
    <p className="text-[10px] leading-tight text-muted-foreground mt-3">{description}</p>
  </div>
);

const BenchmarkItemCard: React.FC<{ benchmark: BenchmarkResult }> = ({ benchmark }) => (
  <div className="bg-muted/50 p-4 rounded-lg flex items-start space-x-4 border border-border/30 hover:border-border/60 transition-colors">
    <div className="flex-shrink-0 mt-1">
      {getBenchmarkStatusIcon(benchmark.status)}
    </div>
    <div className="flex-grow">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-md font-semibold text-foreground">{benchmark.name || 'Standard Benchmark'}</h3>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
          benchmark.status === 'passed' ? 'bg-green-900/50 text-green-400' :
          benchmark.status === 'failed' ? 'bg-red-900/50 text-red-400' :
          benchmark.status === 'partial' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-gray-800 text-gray-400'
        }`}>
          {benchmark.status || 'Unknown'}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{benchmark.summary || 'Summary pending analysis.'}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {benchmark.keyMetrics?.map((metric, i) => (
          <p key={i}><strong>{metric.label}:</strong> {metric.value}</p>
        ))}
      </div>
    </div>
  </div>
);


export default TearSheet;
