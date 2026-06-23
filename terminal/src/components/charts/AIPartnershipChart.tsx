'use client';

import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AIPartnershipData, CompanyName } from '@/types/chart_data';
import { useChartData } from '@/hooks/useChartsData';
import { Skeleton } from '@/components/ui/skeleton';

interface AIPartnershipChartProps {
  companyName: CompanyName;
}

export default function AIPartnershipChart({ companyName }: AIPartnershipChartProps) {
  const { data, loading, error } = useChartData(companyName, 'aiPartnerships');

  if (loading) return <Skeleton className="h-80 rounded-xl" />;
  if (error) return <div className="text-destructive text-sm">Error: {error}</div>;

  const chartData = data || [];
  const formatXAxis = (tick: string) =>
    new Date(tick).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="rounded-xl border border-border bg-card p-4 h-80 flex flex-col">
      <h3 className="text-sm font-semibold mb-3">{companyName} AI Business Partnerships</h3>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} stroke="var(--border)" interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} stroke="var(--border)" />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '0.5rem', fontSize: '12px' }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
            formatter={(value: number | string | undefined) => [`${value ?? 0}`, 'Partnerships']}
            labelFormatter={(label) => `Date: ${new Date(String(label)).toLocaleDateString()}`}
          />
          <Bar dataKey="value" barSize={20} fill="var(--chart-1)" fillOpacity={0.3} radius={[2, 2, 0, 0]} />
          <Line type="monotone" dataKey="value" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
