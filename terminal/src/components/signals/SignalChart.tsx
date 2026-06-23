// terminal/src/components/signals/SignalChart.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SignalResponse } from '@/types/api';

interface SignalChartProps {
  data: SignalResponse[];
}

const chartLines = [
  { key: "overall_risk_score",      color: "var(--chart-1)",       name: "Overall Risk",     isScore: true },
  { key: "economic_health_score",   color: "var(--chart-2)",       name: "Economic Health",  isScore: true },
  { key: "safety_alignment_score",  color: "var(--chart-3)",       name: "Safety Alignment", isScore: true },
  { key: "net_burn",                color: "var(--chart-4)",       name: "Net Burn",         isScore: false },
  { key: "task_success_rate",       color: "var(--chart-5)",       name: "Task Success",     isScore: true },
  { key: "goal_alignment_fidelity", color: "var(--color-success)", name: "Goal Alignment",   isScore: true },
  { key: "behavioral_consistency",  color: "var(--color-warning)", name: "Consistency",      isScore: false },
  { key: "cost_per_outcome",  color: "var(--chart-4)", name: "Cost/Outcome",  isScore: false },
  { key: "alignment_premium", color: "var(--chart-3)", name: "Align Premium", isScore: false },
] as const;

export function SignalChart({ data }: SignalChartProps) {
  // Defensive guard against empty or malformed data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center border border-dashed rounded-lg text-muted-foreground text-sm">
        Awaiting signal event stream data...
      </div>
    );
  }

  const nonScoreDataKeys = chartLines.filter(line => !line.isScore).map(line => line.key);

  return (
    <div className="h-[350px] w-full"> {/* FIXED HEIGHT PARENT */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="audit_date"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            domain={[0, 100]}
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            hide={nonScoreDataKeys.length === 0}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
              fontSize: "13px",
            }}
          />
          <Legend />
          {chartLines.map(({ key, color, name, isScore }) => (
            <Area
              key={key}
              type="linear"
              dataKey={key}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
              name={name}
              yAxisId={isScore ? "right" : "left"}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
