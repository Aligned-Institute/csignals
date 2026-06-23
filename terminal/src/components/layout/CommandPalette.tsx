'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Trophy, Briefcase, Search, BarChart3, Network,
} from 'lucide-react';
import type { ModelSummaryResponse } from '@/types/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const { data: models } = useSWR<ModelSummaryResponse[]>(
    open ? `${API}/api/v1/signal/leaderboard/top?limit=100&sort_by=overall_risk_score&order=desc` : null,
    fetcher,
  );

  function runCommand(callback: () => void) {
    onOpenChange(false);
    callback();
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search models, navigate, or run actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 size-4" />
            Dashboard
            <span className="ml-auto text-xs text-muted-foreground font-mono">D</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/leaderboard'))}>
            <Trophy className="mr-2 size-4" />
            Leaderboard
            <span className="ml-auto text-xs text-muted-foreground font-mono">L</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/portfolio'))}>
            <Briefcase className="mr-2 size-4" />
            Portfolio
            <span className="ml-auto text-xs text-muted-foreground font-mono">P</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/charts'))}>
            <BarChart3 className="mr-2 size-4" />
            Charts
            <span className="ml-auto text-xs text-muted-foreground font-mono">C</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/ecosystem'))}>
            <Network className="mr-2 size-4" />
            AI Ecosystem
            <span className="ml-auto text-xs text-muted-foreground font-mono">E</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {models && models.length > 0 && (
          <>
            <CommandGroup heading="Models">
              {models.map((m) => (
                <CommandItem
                  key={m.model_id}
                  value={`${m.model_name} ${m.developer ?? ''}`}
                  onSelect={() => runCommand(() => router.push(`/models/${m.model_id}`))}
                >
                  <Search className="mr-2 size-4" />
                  <span>{m.model_name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.developer}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => router.push('/leaderboard'))}>
            <BarChart3 className="mr-2 size-4" />
            Compare Models
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
