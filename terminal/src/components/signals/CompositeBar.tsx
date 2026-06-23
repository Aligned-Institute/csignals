import { cn } from "@/lib/utils";

interface CompositeBarProps {
  label: string;
  value: number;
  max?: number;
}

function getBarColor(value: number): string {
  if (value >= 70) return "bg-success";
  if (value >= 40) return "bg-warning";
  return "bg-danger";
}

export function CompositeBar({ label, value, max = 100 }: CompositeBarProps) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium text-foreground">
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", getBarColor(value))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
