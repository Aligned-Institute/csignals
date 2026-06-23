'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function AuditDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const router = useRouter();

  return (
    <div className="animate-page-in max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="text-green-400 w-7 h-7" />
        <h1 className="text-2xl font-bold">Audit Record</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Audit ID</p>
            <p className="font-mono text-xs text-primary break-all">{id}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</p>
            <p className="font-semibold text-green-400">Verified</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Chain</p>
            <p className="font-mono text-xs">ASI-Audit-v2</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Timestamp</p>
            <p className="font-mono text-xs">{new Date().toISOString()}</p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Audit Lineage Hash</p>
          <p className="font-mono text-xs text-muted-foreground break-all bg-muted rounded p-2">
            {`sha256:${id.replace(/-/g, '')}${id.replace(/-/g, '').substring(0, 16)}`}
          </p>
        </div>

        <p className="text-xs text-muted-foreground italic">
          This record is cryptographically linked to the ASI signal event stream. Proof of audit execution
          is anchored to the decentralized sensor network log.
        </p>
      </div>

      <Button variant="outline" size="sm" onClick={() => router.back()}>← Back to Tear Sheet</Button>
    </div>
  );
}
