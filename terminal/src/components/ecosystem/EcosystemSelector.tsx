'use client';

import { ECOSYSTEM_CATEGORIES } from '@/components/ecosystem/ecosystemData';
import type { CategoryWithMapping } from '@/components/ecosystem/ecosystemData';
import { cn } from '@/lib/utils';
import { ChevronRight, PlusCircle } from 'lucide-react';

interface EcosystemSelectorProps {
  expandedCategoryId: string | null;
  onExpandCategory: (id: string | null) => void;
  selectedCategoryId: string | null;
  selectedServiceId: string | 'custom' | null;
  onSelectService: (categoryId: string, serviceId: string | 'custom') => void;
}

export default function EcosystemSelector({
  expandedCategoryId,
  onExpandCategory,
  selectedCategoryId,
  selectedServiceId,
  onSelectService,
}: EcosystemSelectorProps) {

  const handleToggleCategory = (id: string) => {
    onExpandCategory(expandedCategoryId === id ? null : id);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 overflow-y-auto h-full">
      <h2 className="text-lg font-bold mb-4">AI Ecosystem Map</h2>
      <div className="space-y-1">
        {ECOSYSTEM_CATEGORIES.map((cat: CategoryWithMapping) => {
          const isExpanded = expandedCategoryId === cat.id;

          return (
            <div key={cat.id}>
              {/* Category header */}
              <button
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                  isExpanded
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-200',
                    isExpanded && 'rotate-90',
                  )}
                />
                <span className="flex-1">{cat.name}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {cat.knownServices.length}
                </span>
              </button>

              {/* Expandable service list */}
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-out',
                  isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  <div className="pl-5 pr-1 py-1 space-y-0.5">
                    {cat.knownServices.map((svc) => {
                      const isSelected =
                        selectedCategoryId === cat.id && selectedServiceId === svc.id;

                      return (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => onSelectService(cat.id, svc.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                            isSelected
                              ? 'bg-primary/20 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                              isSelected ? 'bg-primary' : 'bg-muted-foreground/40',
                            )}
                          />
                          {svc.name}
                        </button>
                      );
                    })}

                    {/* Custom option */}
                    <button
                      type="button"
                      onClick={() => onSelectService(cat.id, 'custom')}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                        selectedCategoryId === cat.id && selectedServiceId === 'custom'
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                      )}
                    >
                      <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                      Custom
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
