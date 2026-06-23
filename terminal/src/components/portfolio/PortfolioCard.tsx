'use client';

import Link from 'next/link';
import type { PortfolioItemResponse } from '@/types/api';
import { TrafficLight } from '@/components/signals/TrafficLight';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  item: PortfolioItemResponse;
  onRemove: (modelId: string) => void;
}

export function PortfolioCard({ item, onRemove }: Props) {
  // Gracefully handle 'undefined' or initializing items
  if (!item.model_id || item.model_id === 'undefined' || item.model_name === 'Initializing...') {
    return null; // Don't show the initializing cards in the portfolio feed
  }

  return (
    <Card className="hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{item.model_name}</CardTitle>
          <TrafficLight score={item.overall_risk_score ?? 0} size="md" />
        </div>
        <p className="text-sm text-muted-foreground">{item.developer ?? 'Unknown'}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-6 text-sm">
          <span>Econ: <span className="font-mono font-semibold">{(item.economic_health_score ?? 0).toFixed(1)}</span></span>
          <span>Safety: <span className="font-mono font-semibold">{(item.safety_alignment_score ?? 0).toFixed(1)}</span></span>
          <span>Risk: <span className="font-mono font-semibold">{(item.overall_risk_score ?? 0).toFixed(1)}</span></span>
        </div>
        {item.monthly_price_usd && (
          <p className="text-xs text-muted-foreground">${item.monthly_price_usd.toFixed(2)}/mo</p>
        )}
        {item.user_notes && (
          <p className="text-sm text-muted-foreground italic">&ldquo;{item.user_notes}&rdquo;</p>
        )}
        {item.added_at && (
          <p className="text-xs text-muted-foreground">Added {item.added_at}</p>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/models/${item.model_id}`}>View Detail</Link>
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => onRemove(item.model_id)}>
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
