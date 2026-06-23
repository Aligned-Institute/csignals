'use client';

import { useEffect, useCallback } from 'react';

interface HotkeyConfig {
  key: string;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  enabled?: boolean;
}

export function useHotkeys(hotkeys: HotkeyConfig[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isEditable =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    for (const hk of hotkeys) {
      if (hk.enabled === false) continue;

      const metaMatch = hk.meta ? (e.metaKey || e.ctrlKey) : true;
      const keyMatch = e.key.toLowerCase() === hk.key.toLowerCase();

      if (!hk.meta && isEditable) continue;

      if (metaMatch && keyMatch) {
        e.preventDefault();
        hk.handler(e);
        return;
      }
    }
  }, [hotkeys]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
