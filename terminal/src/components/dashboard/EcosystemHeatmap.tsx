'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = { up: '#00ff9d', down: '#ff0055', neutral: '#333333' } as const;
type Sentiment = keyof typeof COLORS;

const INNER_DATA = [
  { name: 'AI & ML',     value: 1, sentiment: 'up'      as Sentiment, change: '+3.2%' },
  { name: 'Gen AI',      value: 1, sentiment: 'up'      as Sentiment, change: '+7.1%' },
  { name: 'AI Agents',   value: 1, sentiment: 'down'    as Sentiment, change: '-2.4%' },
  { name: 'Agentic AI',  value: 1, sentiment: 'neutral' as Sentiment, change: '0.0%'  },
];

const OUTER_DATA = [
  { name: 'Anthropic',       value: 1, sentiment: 'up'      as Sentiment, change: '+4.5%'  },
  { name: 'OpenAI',          value: 1, sentiment: 'up'      as Sentiment, change: '+2.1%'  },
  { name: 'Google',          value: 1, sentiment: 'up'      as Sentiment, change: '+1.8%'  },
  { name: 'Meta',            value: 1, sentiment: 'neutral' as Sentiment, change: '+0.3%'  },
  { name: 'xAI',             value: 1, sentiment: 'down'    as Sentiment, change: '-1.2%'  },
  { name: 'DeepSeek',        value: 1, sentiment: 'up'      as Sentiment, change: '+12.3%' },
  { name: 'Qwen',            value: 1, sentiment: 'neutral' as Sentiment, change: '+0.1%'  },
  { name: 'Mistral',         value: 1, sentiment: 'up'      as Sentiment, change: '+3.7%'  },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const label = d.sentiment === 'up' ? '↑ Market Up' : d.sentiment === 'down' ? '↓ Market Down' : '— Neutral';
  return (
    <div className="rounded-lg border border-border p-2 text-xs" style={{ backgroundColor: '#111827' }}>
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">{label} · {d.change}</p>
    </div>
  );
};

export default function EcosystemHeatmap() {
  return (
    <div className="w-full max-w-xl">
      <div className="text-center mb-2">
        <h2 className="text-base font-semibold">AI Ecosystem Market Heatmap</h2>
        <p className="text-xs text-muted-foreground">Real-time sentiment — inner: categories · outer: companies</p>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={380}>
          <PieChart>
            <Pie
              data={INNER_DATA}
              dataKey="value"
              cx="50%" cy="50%"
              innerRadius={75} outerRadius={135}
              paddingAngle={3}
              label={({ name, cx, cy, midAngle, innerRadius, outerRadius }) => {
                if (midAngle === undefined || innerRadius === undefined || outerRadius === undefined) return null;
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{name}</text>;
              }}
              labelLine={false}
            >
              {INNER_DATA.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.sentiment]} fillOpacity={0.75} />
              ))}
            </Pie>
            <Pie
              data={OUTER_DATA}
              dataKey="value"
              cx="50%" cy="50%"
              innerRadius={142} outerRadius={178}
              paddingAngle={2}
              label={({ name, cx, cy, midAngle, outerRadius }) => {
                if (midAngle === undefined || outerRadius === undefined) return null;
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 16;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return <text x={x} y={y} fill="var(--muted-foreground)" textAnchor="middle" dominantBaseline="central" fontSize={9}>{name}</text>;
              }}
              labelLine={false}
            >
              {OUTER_DATA.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.sentiment]} fillOpacity={0.55} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground">AI</p>
            <p className="text-[10px] text-muted-foreground">Ecosystem</p>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#00ff9d' }} />Up</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#ff0055' }} />Down</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#333' }} />No Data</span>
      </div>
    </div>
  );
}
