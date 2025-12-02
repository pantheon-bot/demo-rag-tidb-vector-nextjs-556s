import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Nav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">TiDB RAG Chat Demo</h1>
            <p className="text-sm text-muted-foreground">
              Powered by TiDB Vector Search, AI SDK, and Next.js
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/">Chat</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/documents">Documents</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
