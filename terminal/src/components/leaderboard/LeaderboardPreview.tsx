'use client';

import { useRouter } from 'next/navigation';
import type { ModelSummaryResponse } from '@/types/api';
import { TrafficLight } from '@/components/signals/TrafficLight';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export function LeaderboardPreview({ data }: { data: ModelSummaryResponse[] }) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Developer</TableHead>
          <TableHead className="text-right">Risk</TableHead>
          <TableHead className="text-right">Econ</TableHead>
          <TableHead className="text-right">Safety</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((m, i) => (
          <TableRow
            key={m.model_id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/models/${m.model_id}`)}
          >
            <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
            <TableCell className="font-semibold">{m.model_name}</TableCell>
            <TableCell className="text-muted-foreground">{m.developer ?? '—'}</TableCell>
            <TableCell className="text-right">
              <span className="inline-flex items-center gap-2">
                <span className="font-mono">{m.overall_risk_score.toFixed(1)}</span>
                <TrafficLight score={m.overall_risk_score} size="sm" />
              </span>
            </TableCell>
            <TableCell className="text-right font-mono">{m.economic_health_score.toFixed(1)}</TableCell>
            <TableCell className="text-right font-mono">{m.safety_alignment_score.toFixed(1)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
