import { cn } from "@/lib/utils";

interface TrafficLightProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
} as const;

function getColorClasses(score: number) {
  if (score >= 70) return "bg-success glow-green";
  if (score >= 40) return "bg-warning glow-yellow";
  return "bg-danger glow-red";
}

export function TrafficLight({ score, size = "md" }: TrafficLightProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full",
        sizeClasses[size],
        getColorClasses(score)
      )}
      role="img"
      aria-label={
        score >= 70 ? "Low risk" : score >= 40 ? "Medium risk" : "High risk"
      }
    />
  );
}
