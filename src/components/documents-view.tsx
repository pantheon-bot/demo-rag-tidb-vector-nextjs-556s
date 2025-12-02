"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Document {
  id: number;
  content: string;
  metadata: Record<string, unknown> | null;
  embedding: string;
  created_at: Date;
}

export function DocumentsView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/documents');
      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents);
      } else {
        console.error('Failed to fetch documents:', data.error);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newContent.trim()) {
      return;
    }

    try {
      setIsAdding(true);
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent,
          metadata: newTitle ? { title: newTitle } : {},
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDocuments((prev) => [data.document, ...prev]);
        setNewContent('');
        setNewTitle('');
        setDialogOpen(false);
      } else {
        console.error('Failed to add document:', data.error);
        alert(`Failed to add document: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding document:', error);
      alert('Error adding document. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Total Documents: {documents.length}</h2>
          <p className="text-sm text-muted-foreground">
            Add new documents to enhance the RAG knowledge base
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Document</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
              <DialogDescription>
                Add content to your knowledge base. The system will automatically generate embeddings for vector search.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title (optional)
                </label>
                <Input
                  id="title"
                  placeholder="Enter a title for this document"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  Content
                </label>
                <Textarea
                  id="content"
                  placeholder="Enter the document content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={10}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddDocument}
                disabled={!newContent.trim() || isAdding}
              >
                {isAdding ? 'Adding...' : 'Add Document'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Documents Yet</CardTitle>
            <CardDescription>
              Get started by adding your first document to the knowledge base.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4 pr-4">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {(doc.metadata?.title as string) || `Document #${doc.id}`}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Added on {formatDate(doc.created_at)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">ID: {doc.id}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{doc.content}</p>
                    {doc.metadata && Object.keys(doc.metadata).length > 1 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Additional metadata: {JSON.stringify(doc.metadata, null, 2)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
