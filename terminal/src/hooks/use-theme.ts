'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'asi-theme';

export function useTheme() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light') {
      setLight(true);
    }
  }, []);

  useEffect(() => {
    const isDark = !light;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [light]);

  const toggle = useCallback(() => setLight(prev => !prev), []);

  return { light, toggle };
}
