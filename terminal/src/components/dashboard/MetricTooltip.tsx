'use client';

import { useState } from 'react';

interface MetricTooltipProps {
  label: string;
  tip: string;
  children: React.ReactNode;
}

export function MetricTooltip({ label, tip, children }: MetricTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <div className="absolute top-1 right-2">
        <span
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-muted-foreground border border-border cursor-help"
          aria-label={`${label}: ${tip}`}
        >
          ?
        </span>
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-popover border border-border shadow-lg text-xs text-popover-foreground max-w-[200px] text-center whitespace-normal">
          <span className="font-semibold text-primary">{label}</span>
          <br />
          {tip}
        </div>
      )}
    </div>
  );
}
