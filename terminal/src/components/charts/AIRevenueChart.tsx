// terminal/src/components/charts/AIRevenueChart.tsx
'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { CompanyName, TimeSeriesDataPoint } from '@/types/chart_data';
import { useChartData } from '@/hooks/useChartsData';
import { Skeleton } from '@/components/ui/skeleton';

interface AIRevenueChartProps {
  companyName: CompanyName;
}

export default function AIRevenueChart({ companyName }: AIRevenueChartProps) {
  const { data, loading, error } = useChartData(companyName, 'aiRevenue');

  if (loading) return <Skeleton className="h-80 rounded-xl" />;
  if (error) return <div className="text-destructive text-sm h-80 flex items-center justify-center border rounded-xl">Error: {error}</div>;

  const chartData = data || [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 h-80 flex flex-col">
      <h3 className="text-sm font-semibold mb-3">{companyName} AI Revenue (M USD)</h3>
      <div className="flex-grow min-h-0"> {/* FIXED HEIGHT PARENT */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" hide />
            <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} stroke="var(--border)" />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '0.5rem', fontSize: '12px' }}
            />
            <Bar dataKey="value" fill="var(--chart-2)" fillOpacity={0.75} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
