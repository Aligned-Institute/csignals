'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';

interface Props {
  modelId: string;
}

export function AddToPortfolioButton({ modelId }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'added' | 'error'>('idle');
  const { mutate } = useSWRConfig();

  async function handleAdd() {
    setStatus('loading');
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId }),
      });

      if (res.ok) {
        setStatus('added');
        mutate('/api/portfolio');
        toast.success('Added to portfolio');
      } else {
        const data = await res.json();
        if (data.detail?.includes('already')) {
          setStatus('added');
          toast.info('Already in portfolio');
        } else {
          setStatus('error');
          toast.error('Failed to add to portfolio');
        }
      }
    } catch {
      setStatus('error');
      toast.error('Failed to add to portfolio');
    }
  }

  if (status === 'added') {
    return (
      <Button variant="outline" size="sm" disabled>
        <Check className="w-4 h-4 mr-1 animate-check-pop" /> In Portfolio
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAdd}
      disabled={status === 'loading'}
    >
      <Plus className="w-4 h-4 mr-1" />
      {status === 'loading' ? 'Adding...' : status === 'error' ? 'Retry' : 'Add to Portfolio'}
    </Button>
  );
}
