import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRealtimeMessaging } from '@/hooks/use-realtime-messaging';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text?: string;
  media_url?: string | null;
  sender_id?: string | null;
  sender_profile?: { first_name?: string; last_name?: string } | null;
  created_at: string;
}

interface MessageThreadProps {
  bookingId: string;
  className?: string;
}

const MessageThread = ({ bookingId, className }: MessageThreadProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useRealtimeMessaging(bookingId) as {
    messages: Message[];
    loading: boolean;
    sendMessage: (text: string) => Promise<boolean>;
  };
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(newMessage.trim());
    
    if (success) {
      setNewMessage('');
    }
    
    setSending(false);
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getSenderName = (message: Message) => {
    if (message.sender_id === user?.id) return 'You';
    
    const profile = message.sender_profile;
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ''}`.trim();
    }
    
    return 'Unknown User';
  };

  const getSenderInitials = (message: Message) => {
    if (message.sender_id === user?.id) return 'Y';
    
    const profile = message.sender_profile;
    if (profile?.first_name) {
      return `${profile.first_name[0]}${profile.last_name?.[0] || ''}`.toUpperCase();
    }
    
    return 'U';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Messages</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea ref={scrollAreaRef} className="h-[400px] px-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation with your security team</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === user?.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {getSenderInitials(message)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {getSenderName(message)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      
                      <div
                        className={`rounded-lg px-3 py-2 max-w-full break-words ${
                          isOwnMessage
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {message.media_url ? (
                          <div className="space-y-2">
                            {message.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img
                                src={message.media_url}
                                alt="Shared image"
                                className="max-w-full h-auto rounded"
                              />
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <Paperclip className="h-4 w-4" />
                                <a
                                  href={message.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:no-underline"
                                >
                                  View Attachment
                                </a>
                              </div>
                            )}
                            {message.text && (
                              <p className="text-sm">{message.text}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm">{message.text}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={sending}
              className="flex-shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="flex-shrink-0"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageThread;