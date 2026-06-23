'use client';

import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { CompanyName, TimeSeriesDataPoint } from '@/types/chart_data'; // Added TimeSeriesDataPoint type
import {
  MOCK_STOCK_PRICE_DATA,
  MOCK_AI_INVESTMENT_DATA,
  MOCK_AI_REVENUE_DATA,
  MOCK_AI_PARTNERSHIP_DATA,
} from '@/components/charts/mockData'; // Re-add mock data imports
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export type MetricKey = 'stockPrice' | 'aiInvestment' | 'aiRevenue' | 'aiPartnerships';
export type ChartType = 'LineChart' | 'BarChart' | 'AreaChart' | 'ComposedChart';

interface CustomChartRendererProps {
  companies: CompanyName[];
  metrics: MetricKey[];
  chartType: ChartType;
  timeline: '12m' | '5y';
}

const COLORS = [
  'var(--chart-1)',
  'var(--color-success)',
  'var(--chart-2)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--info)',
  'var(--orange)',
  'var(--violet)',
];

const METRIC_LABELS: Record<MetricKey, string> = {
  stockPrice: 'Stock Price',
  aiInvestment: 'AI Investment',
  aiRevenue: 'AI Revenue',
  aiPartnerships: 'Partnerships',
};

// Helper to get mock data based on metric
function getMockDataForMetric(metric: MetricKey, company: CompanyName): TimeSeriesDataPoint[] {
  switch (metric) {
    case 'stockPrice':
      return MOCK_STOCK_PRICE_DATA.find((d) => d.company === company)?.data.map((p) => ({
        date: p.date,
        value: p.value,
      })) ?? [];
    case 'aiInvestment':
      return MOCK_AI_INVESTMENT_DATA.find((d) => d.company === company)?.data.map((p) => ({
        date: p.date,
        value: p.value,
      })) ?? [];
    case 'aiRevenue':
      return MOCK_AI_REVENUE_DATA.find((d) => d.company === company)?.data.map((p) => ({
        date: p.date,
        value: p.value,
      })) ?? [];
    case 'aiPartnerships':
      return MOCK_AI_PARTNERSHIP_DATA.find((d) => d.company === company)?.data.map((p) => ({
        date: p.date,
        value: p.count,
      })) ?? [];
    default:
      return [];
  }
}

function mergeData(
  fetchedData: { company: CompanyName; metric: MetricKey; data: TimeSeriesDataPoint[] }[],
  metrics: MetricKey[],
  timeline: '12m' | '5y',
): { data: Record<string, string | number>[]; seriesKeys: string[] } {
  const seriesMap = new Map<string, Map<string, number>>();
  const seriesKeys: string[] = [];

  for (const item of fetchedData) {
    const key = `${item.company} - ${METRIC_LABELS[item.metric]}`;
    seriesKeys.push(key);
    for (const p of item.data) {
      if (!seriesMap.has(p.date)) seriesMap.set(p.date, new Map());
      seriesMap.get(p.date)!.set(key, p.value);
    }
  }

  let dates = Array.from(seriesMap.keys()).sort();
  if (timeline === '12m') {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    dates = dates.filter((d) => d >= cutoffStr);
  }

  const data = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    const vals = seriesMap.get(date)!;
    for (const key of seriesKeys) {
      row[key] = vals.get(key) ?? 0;
    }
    return row;
  });

  return { data, seriesKeys };
}

const formatXAxis = (tick: string) =>
  new Date(tick).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

export default function CustomChartRenderer({ companies, metrics, chartType, timeline }: CustomChartRendererProps) {
  if (companies.length === 0 || metrics.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
        Select at least one company and one metric to generate a chart.
      </div>
    );
  }

  // Use mock data (live custom charts API not yet implemented)
  const fetchedDataResults = companies.flatMap(company =>
    metrics.map(metric => ({
      company,
      metric,
      data: getMockDataForMetric(metric, company),
      loading: false as const,
      error: null,
    }))
  );

  const anyLoading = fetchedDataResults.some(result => result.loading);
  const anyError = fetchedDataResults.some(result => result.error);

  if (anyLoading) {
    return <Skeleton className="h-80 rounded-xl" />;
  }

  if (anyError) {
    return (
      <div className="h-80 flex items-center justify-center text-destructive text-sm">
        Error loading chart data.
      </div>
    );
  }

  // Filter out items with no data or null data
  const validFetchedData = fetchedDataResults
    .filter(item => item.data !== null && item.data !== undefined && item.data.length > 0)
    .map(item => ({ company: item.company, metric: item.metric, data: item.data! }));


  if (validFetchedData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
        No data available for this selection.
      </div>
    );
  }

  const { data, seriesKeys } = mergeData(validFetchedData, metrics, timeline);

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
        No data available for this selection.
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: 'var(--background)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
    borderRadius: '0.5rem',
    fontSize: '12px',
  };

  const renderSeries = () =>
    seriesKeys.map((key, i) => {
      const color = COLORS[i % COLORS.length];
      switch (chartType) {
        case 'BarChart':
          return <Bar key={key} dataKey={key} fill={color} fillOpacity={0.75} radius={[4, 4, 0, 0]} />;
        case 'AreaChart':
          return (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          );
        case 'ComposedChart':
          return i % 2 === 0 ? (
            <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
          ) : (
            <Bar key={key} dataKey={key} fill={color} fillOpacity={0.4} radius={[4, 4, 0, 0]} />
          );
        default:
          return <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />;
      }
    });

  const commonProps = {
    data,
    margin: { top: 5, right: 10, left: 0, bottom: 5 },
  };

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} stroke="var(--border)" interval="preserveStartEnd" />
      <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} stroke="var(--border)" />
      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--muted-foreground)' }} />
      <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }} />
    </>
  );

  const renderChart = () => {
    switch (chartType) {
      case 'BarChart':
        return <BarChart {...commonProps}>{axes}{renderSeries()}</BarChart>;
      case 'AreaChart':
        return <AreaChart {...commonProps}>{axes}{renderSeries()}</AreaChart>;
      case 'ComposedChart':
        return <ComposedChart {...commonProps}>{axes}{renderSeries()}</ComposedChart>;
      default:
        return <LineChart {...commonProps}>{axes}{renderSeries()}</LineChart>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
}
