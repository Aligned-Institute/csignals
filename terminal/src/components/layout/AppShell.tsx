'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { useTheme } from '@/hooks/use-theme';
import { Sun, Moon } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const { light, toggle } = useTheme();

  useHotkeys([
    { key: 'k', meta: true, handler: () => setCmdkOpen(prev => !prev) },
    { key: 'd', handler: () => router.push('/dashboard'), enabled: !cmdkOpen },
    { key: 'l', handler: () => router.push('/leaderboard'), enabled: !cmdkOpen },
    { key: 'p', handler: () => router.push('/portfolio'), enabled: !cmdkOpen },
    { key: 'c', handler: () => router.push('/charts'), enabled: !cmdkOpen },
    { key: 'e', handler: () => router.push('/ecosystem'), enabled: !cmdkOpen },
    { key: 's', handler: () => router.push('/sage'), enabled: !cmdkOpen },
    { key: '/', handler: () => setCmdkOpen(true), enabled: !cmdkOpen },
    { key: 'Escape', handler: () => setCmdkOpen(false), enabled: cmdkOpen },
  ]);

  return (
    <>
      <Sidebar onOpenSearch={() => setCmdkOpen(true)} />
      <CommandPalette open={cmdkOpen} onOpenChange={setCmdkOpen} />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 pt-20 md:p-8 md:pt-24 relative">
        {children}
      </main>
    </>
  );
}
