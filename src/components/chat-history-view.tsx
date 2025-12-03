"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Trash2, Eye, Calendar } from 'lucide-react';

interface SessionSummary {
  session_id: string;
  message_count: number;
  last_message_at: Date;
  first_message_at: Date;
  preview: string;
}

interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: Date;
}

export function ChatHistoryView() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sessions');
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions);
      } else {
        console.error('Failed to fetch sessions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      setIsLoadingMessages(true);
      setSelectedSession(sessionId);
      const response = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await response.json();

      if (response.ok) {
        setSessionMessages(data.messages.map((msg: ChatMessage) => ({
          ...msg,
          created_at: new Date(msg.created_at),
        })));
      } else {
        console.error('Failed to fetch messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleLoadSession = (sessionId: string) => {
    localStorage.setItem('chatSessionId', sessionId);
    router.push('/');
  };

  const handleDeleteSession = async () => {
    // For now, we'll just show an alert. In a real app, you'd implement the delete API
    alert('Delete functionality would be implemented here');
    // After implementing delete API:
    // const sessionId = ...;
    // await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    // fetchSessions();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Chat History</h2>
        <p className="text-sm text-muted-foreground">
          View and manage your previous chat sessions
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading chat history...</p>
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Chat History Yet</CardTitle>
            <CardDescription>
              Start a new conversation to see it appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold mb-3">Sessions ({sessions.length})</h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {sessions.map((session) => (
                  <Card
                    key={session.session_id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedSession === session.session_id ? 'border-primary' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm truncate">
                            {session.preview}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatRelativeTime(session.last_message_at)}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {session.message_count}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => loadSessionMessages(session.session_id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadSession(session.session_id)}
                        >
                          Load Chat
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this chat session and all its messages.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSession()}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">
              {selectedSession ? 'Session Messages' : 'Select a session to view messages'}
            </h3>
            {selectedSession ? (
              <Card className="h-[600px] flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">Loading messages...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessionMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-4 py-2 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="text-xs font-semibold mb-1 opacity-70">
                              {message.role === 'user' ? 'You' : 'Assistant'}
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                            <div className="text-xs opacity-50 mt-1">
                              {formatDate(message.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <CardDescription>
                  Click on a session to view its messages
                </CardDescription>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
