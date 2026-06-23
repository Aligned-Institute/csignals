'use client';

import type { CategoryWithMapping } from '@/components/ecosystem/ecosystemData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface EcosystemMindmapProps {
  category: CategoryWithMapping | null;
  serviceId: string | 'custom' | null;
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  customServiceName: string;
  onCustomServiceNameChange: (name: string) => void;
}

export default function EcosystemMindmap({
  category,
  serviceId,
  selectedFeatures,
  onFeaturesChange,
  customServiceName,
  onCustomServiceNameChange,
}: EcosystemMindmapProps) {
  if (!category || !serviceId) {
    return (
      <div className="flex items-center justify-center h-full rounded-xl border border-border bg-card text-muted-foreground text-sm">
        Select a category and service from the left to explore its capabilities.
      </div>
    );
  }

  const isCustom = serviceId === 'custom';
  const service = !isCustom
    ? category.knownServices.find((s) => s.id === serviceId)
    : null;

  const checkedCount = selectedFeatures.length;
  const totalCount = category.features.length;

  const toggleFeature = (id: string) => {
    if (!isCustom) return; // read-only for known services
    onFeaturesChange(
      selectedFeatures.includes(id)
        ? selectedFeatures.filter((f) => f !== id)
        : [...selectedFeatures, id],
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 overflow-y-auto h-full space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">{category.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          {isCustom ? (
            <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground">
              Custom Configuration
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
              {service?.name} <span className="ml-1 text-primary/60">{service?.company}</span>
            </span>
          )}
        </div>
        {category.description && (
          <p className="text-muted-foreground text-sm mt-2">{category.description}</p>
        )}
      </div>

      {/* Custom service name input */}
      {isCustom && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="custom-service-name">
            Service Name (optional)
          </label>
          <Input
            id="custom-service-name"
            placeholder="Enter your service name..."
            value={customServiceName}
            onChange={(e) => onCustomServiceNameChange(e.target.value)}
          />
        </div>
      )}

      {/* Features */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">
          Capabilities ({checkedCount} of {totalCount})
        </h3>
        {category.features.map((feature) => {
          const isChecked = selectedFeatures.includes(feature.id);

          return (
            <label
              key={feature.id}
              className={cn(
                'flex items-center justify-between rounded-lg border px-3 py-2 transition-colors',
                isCustom ? 'cursor-pointer' : 'cursor-default',
                isChecked
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-card/50',
                isCustom && !isChecked && 'hover:bg-accent/30',
                !isCustom && !isChecked && 'opacity-40',
              )}
            >
              <span className="text-sm">{feature.name}</span>
              <Checkbox
                checked={isChecked}
                disabled={!isCustom}
                onCheckedChange={() => toggleFeature(feature.id)}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
