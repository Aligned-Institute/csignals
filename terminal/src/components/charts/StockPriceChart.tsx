import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { CompanyName, TimeSeriesDataPoint } from '@/types/chart_data';
import { COMPANIES } from '@/types/chart_data';
import { useChartData } from '@/hooks/useChartsData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useSWR from 'swr'; // Import useSWR
import { api } from '@/lib/api'; // Import api client
import { MOCK_FUNDING_DATA } from '@/components/charts/mockData'; // Re-add MOCK_FUNDING_DATA import

interface StockPriceChartProps {
  companyName: CompanyName;
}

// Define FundingRound interface for API response
interface FundingRound {
  round: string;
  date: string;
  amount: number;
  leadInvestor?: string;
}

interface FundingData {
  company: CompanyName;
  totalRaised: number;
  rounds: FundingRound[];
}

const ROUND_COLORS = [
  'var(--chart-1)',
  'var(--color-success)',
  'var(--chart-2)',
  'var(--chart-4)',
  'var(--chart-1)',
  'var(--chart-1)',
  'var(--color-success)',
];

const getCompanyInfo = (name: CompanyName) => COMPANIES.find((c) => c.name === name);

const USE_MOCK_FUNDING_DATA = process.env.NEXT_PUBLIC_DATA_PROVIDER_FINANCIAL === 'mock';

export default function StockPriceChart({ companyName }: StockPriceChartProps) {
  const [timeline, setTimeline] = useState<'12m' | '5y'>('12m');
  const { data, loading, error } = useChartData(companyName, 'stockPrice', timeline); // useChartData no longer needs generic type

  const companyInfo = getCompanyInfo(companyName);

  // SWR for fetching funding data for private companies
  const { data: fetchedFundingData, isLoading: loadingFunding, error: fundingError } = useSWR<FundingData>(
    companyInfo && !companyInfo.isPublic && !USE_MOCK_FUNDING_DATA ? `${api.API_BASE}/api/v1/signals/${companyName}/funding` : null,
    api.fetcher
  );

  if (!companyInfo) return <div className="text-destructive">Company info not found.</div>;
  if (loading || (loadingFunding && !USE_MOCK_FUNDING_DATA)) return <Skeleton className="h-80 rounded-xl" />;
  if (error) return <div className="text-destructive text-sm">Error: {error}</div>;
  if (fundingError && !USE_MOCK_FUNDING_DATA) return <div className="text-destructive text-sm">Funding Error: {fundingError.message}</div>;

  // Private companies: show funding rounds instead of stock price
  if (!companyInfo.isPublic) {
    const funding = USE_MOCK_FUNDING_DATA
      ? MOCK_FUNDING_DATA.find((f) => f.company === companyName)
      : fetchedFundingData;

    if (!funding || !funding.rounds || funding.rounds.length === 0) {
      return (
        <div className="rounded-xl border border-border bg-card p-6 h-80 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No funding data available for {companyName}.</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border bg-card p-4 h-80 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{companyName} Funding Rounds</h3>
          <span className="text-xs text-muted-foreground font-mono">
            ${(funding.totalRaised / 1000).toFixed(1)}B total
          </span>
        </div>
        <div className="flex-grow min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funding.rounds} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="round"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                stroke="var(--border)"
              />
              <YAxis
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v}M`}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                stroke="var(--border)"
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '0.5rem', fontSize: '12px' }}
                labelStyle={{ color: 'var(--muted-foreground)' }}
                formatter={(value: number | string | undefined, _name: string | undefined, props: any) => {
                  const v = Number(value ?? 0);
                  const label = v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v}M`;
                  return [label + (props.payload?.leadInvestor ? ` (${props.payload.leadInvestor})` : ''), 'Raised'];
                }}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {funding.rounds.map((_, i) => (
                  <Cell key={i} fill={ROUND_COLORS[i % ROUND_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Public companies: show stock price
  const chartData = data
    ? data.filter((_, index, arr) => {
        if (timeline === '12m') return index >= arr.length - 365;
        return true;
      })
    : [];

  const formatYAxis = (tick: number) => `$${tick.toFixed(0)}`;
  const formatXAxis = (tick: string) =>
    new Date(tick).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="rounded-xl border border-border bg-card p-4 h-80 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{companyName} Stock Price</h3>
        <div className="flex gap-1">
          <Button size="sm" variant={timeline === '12m' ? 'default' : 'outline'} className="h-6 text-xs px-2" onClick={() => setTimeline('12m')}>12M</Button>
          <Button size="sm" variant={timeline === '5y' ? 'default' : 'outline'} className="h-6 text-xs px-2" onClick={() => setTimeline('5y')}>5Y</Button>
        </div>
      </div>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} stroke="var(--border)" interval="preserveStartEnd" />
            <YAxis tickFormatter={formatYAxis} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} stroke="var(--border)" />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '0.5rem', fontSize: '12px' }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
              formatter={(value: number | string | undefined) => [`$${Number(value ?? 0).toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Date: ${new Date(String(label)).toLocaleDateString()}`}
            />
            <Bar dataKey="value" fill="var(--chart-1)" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
