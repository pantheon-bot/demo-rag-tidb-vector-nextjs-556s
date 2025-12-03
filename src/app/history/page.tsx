import { ChatHistoryView } from '@/components/chat-history-view';
import { Nav } from '@/components/nav';

export default function ChatHistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <ChatHistoryView />
      </main>
    </div>
  );
}
