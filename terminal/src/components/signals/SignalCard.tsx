import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrafficLight } from "./TrafficLight";

interface SignalCardProps {
  label: string;
  value: number;
  score: number;
  unit?: string;
  format?: "number" | "currency" | "percent";
  description?: string;
}

function formatValue(value: number | undefined | null, format: string, unit?: string): string {
  if (value === undefined || value === null) return "N/A";
  
  try {
    switch (format) {
      case "currency":
        return `$${Number(value).toFixed(2)}`;
      case "percent":
        return `${Number(value).toFixed(1)}%`;
      default:
        return `${Number(value).toFixed(1)}${unit ? ` ${unit}` : ""}`;
    }
  } catch (e) {
    return "N/A";
  }
}

export function SignalCard({
  label,
  value,
  score,
  unit,
  format = "number",
  description,
}: SignalCardProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <Card className="hover-lift min-h-[120px]">
      <CardContent className="relative pt-1">
        <div className="absolute top-0 right-0">
          <TrafficLight score={score ?? 0} size="md" />
        </div>

        {description && (
          <div className="absolute top-2 right-8 z-10">
            <button
              onClick={() => setShowTip((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Learn more"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {showTip && (
              <div 
                className="absolute right-0 bottom-7 w-56 rounded-lg border border-border shadow-lg p-3 text-xs text-muted-foreground z-50"
                style={{ backgroundColor: '#111827' }}
              >
                {description}
                <button
                  onClick={() => setShowTip(false)}
                  className="absolute top-1 right-2 text-muted-foreground hover:text-foreground"
                >×</button>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-mono font-bold text-foreground">
          {formatValue(value, format, unit)}
        </p>
      </CardContent>
    </Card>
  );
}
