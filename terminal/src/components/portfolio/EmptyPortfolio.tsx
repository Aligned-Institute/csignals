import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

export function EmptyPortfolio() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Your portfolio is empty</h2>
      <p className="text-muted-foreground mb-6">
        Visit the Leaderboard to discover and track AI models.
      </p>
      <Button asChild>
        <Link href="/leaderboard">Browse Leaderboard</Link>
      </Button>
    </div>
  );
}
