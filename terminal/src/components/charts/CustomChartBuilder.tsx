'use client';

import { useState } from 'react';
import { COMPANIES, type CompanyName } from '@/types/chart_data';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import CustomChartRenderer, { type MetricKey, type ChartType } from '@/components/charts/CustomChartRenderer';
import { toast } from 'sonner';

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'stockPrice', label: 'Stock Price' },
  { key: 'aiInvestment', label: 'AI Investment' },
  { key: 'aiRevenue', label: 'AI Revenue' },
  { key: 'aiPartnerships', label: 'Partnerships' },
];

const CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: 'LineChart', label: 'Line' },
  { key: 'BarChart', label: 'Bar' },
  { key: 'AreaChart', label: 'Area' },
  { key: 'ComposedChart', label: 'Composed' },
];

export default function CustomChartBuilder() {
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyName[]>([COMPANIES[0].name]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['aiRevenue']);
  const [chartType, setChartType] = useState<ChartType>('LineChart');
  const [timeline, setTimeline] = useState<'12m' | '5y'>('12m');
  const [generated, setGenerated] = useState(false);

  const toggleCompany = (name: CompanyName) => {
    setSelectedCompanies((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
    setGenerated(false);
  };

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    );
    setGenerated(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <h3 className="text-sm font-semibold">Custom Chart Sandbox</h3>

      {/* Companies */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Companies</p>
        <div className="flex flex-wrap gap-3">
          {COMPANIES.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Checkbox
                checked={selectedCompanies.includes(c.name)}
                onCheckedChange={() => toggleCompany(c.name)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Metrics</p>
        <div className="flex flex-wrap gap-3">
          {METRICS.map((m) => (
            <label key={m.key} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Checkbox
                checked={selectedMetrics.includes(m.key)}
                onCheckedChange={() => toggleMetric(m.key)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      {/* Chart Type + Timeline */}
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Chart Type</p>
          <div className="flex gap-1">
            {CHART_TYPES.map((ct) => (
              <Button
                key={ct.key}
                size="sm"
                variant={chartType === ct.key ? 'default' : 'outline'}
                className="h-7 text-xs px-2.5"
                onClick={() => { setChartType(ct.key); setGenerated(false); }}
              >
                {ct.label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Timeline</p>
          <div className="flex gap-1">
            {(['12m', '5y'] as const).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={timeline === t ? 'default' : 'outline'}
                className="h-7 text-xs px-2.5"
                onClick={() => { setTimeline(t); setGenerated(false); }}
              >
                {t === '12m' ? '12M' : '5Y'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setGenerated(true)}>
          Generate Chart
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.success('Chart saved to portfolio (coming soon)')}
        >
          Save to Portfolio
        </Button>
      </div>

      {/* Rendered Chart */}
      {generated && (
        <div className="h-80 mt-2">
          <CustomChartRenderer
            companies={selectedCompanies}
            metrics={selectedMetrics}
            chartType={chartType}
            timeline={timeline}
          />
        </div>
      )}
    </div>
  );
}
