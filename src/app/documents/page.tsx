import { DocumentsView } from '@/components/documents-view';
import { Nav } from '@/components/nav';

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <DocumentsView />
      </main>
    </div>
  );
}
