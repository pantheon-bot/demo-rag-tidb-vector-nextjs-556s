'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Plus } from 'lucide-react';

export function ChatInterface() {
  // Use persistent session ID from localStorage
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('chatSessionId');
      if (!id) {
        id = `session-${Date.now()}`;
        localStorage.setItem('chatSessionId', id);
      }
      return id;
    }
    return `session-${Date.now()}`;
  });

  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { sessionId },
    }),
  });

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/chat?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [sessionId, setMessages]);

  const isLoading = status === 'submitted';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewChat = () => {
    // Generate new session ID
    const newSessionId = `session-${Date.now()}`;
    localStorage.setItem('chatSessionId', newSessionId);
    // Reload the page to start fresh
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">RAG Chat Demo</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewChat}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoadingHistory && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading chat history...</p>
            </div>
          )}

          {!isLoadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2">Welcome to RAG Chat Demo</h3>
              <p className="text-sm max-w-md">
                Ask me anything about TiDB, Vector Search, or RAG systems. I&apos;ll use the knowledge base to provide accurate answers.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => {
              // Extract text content from message parts
              const textContent = message.parts
                .filter(part => part.type === 'text')
                .map(part => 'text' in part ? part.text : '')
                .join('');

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-70">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{textContent}</div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                  <div className="text-xs font-semibold mb-1 opacity-70">Assistant</div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20">
                  <div className="text-xs font-semibold mb-1">Error</div>
                  <div className="text-sm">{error.message}</div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage({ text: input });
                setInput('');
              }
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about TiDB or vector search..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
