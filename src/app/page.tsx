import { ChatInterface } from '@/components/chat-interface';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">TiDB RAG Chat Demo</h1>
          <p className="text-sm text-muted-foreground">
            Powered by TiDB Vector Search, AI SDK, and Next.js
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ChatInterface />
      </main>
    </div>
  );
}
