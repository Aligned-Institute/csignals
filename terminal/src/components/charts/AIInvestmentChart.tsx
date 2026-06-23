// terminal/src/components/charts/AIInvestmentChart.tsx
'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { CompanyName, TimeSeriesDataPoint } from '@/types/chart_data';
import { useChartData } from '@/hooks/useChartsData';
import { Skeleton } from '@/components/ui/skeleton';

interface AIInvestmentChartProps {
  companyName: CompanyName;
}

export default function AIInvestmentChart({ companyName }: AIInvestmentChartProps) {
  const { data, loading, error } = useChartData(companyName, 'aiInvestment');

  if (loading) return <Skeleton className="h-80 rounded-xl" />;
  if (error) return <div className="text-destructive text-sm h-80 flex items-center justify-center border rounded-xl">Error: {error}</div>;

  const chartData = data || [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 h-80 flex flex-col">
      <h3 className="text-sm font-semibold mb-3">{companyName} AI Investment (M USD)</h3>
      <div className="flex-grow min-h-0"> {/* FIXED HEIGHT PARENT */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" hide />
            <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} stroke="var(--border)" />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '0.5rem', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="value" stroke="var(--color-success)" fill="url(#investGradient)" strokeWidth={2} />
            <defs>
              <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
