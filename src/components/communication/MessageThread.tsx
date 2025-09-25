import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Phone, Video, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/contexts/AuthContext';
import HapticButton from '@/components/mobile/HapticButton';

interface MessageThreadProps {
  bookingId: string;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
  onEmergencyAlert?: () => void;
}

export const MessageThread = ({ 
  bookingId, 
  onVideoCall, 
  onVoiceCall, 
  onEmergencyAlert 
}: MessageThreadProps) => {
  const [messageText, setMessageText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { user } = useAuth();
  const {
    messages,
    loading,
    sending,
    connected,
    typing,
    sendMessage,
    updateTypingStatus
  } = useMessaging(bookingId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle typing indicators
  const handleTyping = (text: string) => {
    setMessageText(text);
    
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedMedia) return;

    await sendMessage({
      text: messageText,
      media: selectedMedia || undefined
    });

    setMessageText('');
    setSelectedMedia(null);
    setIsTyping(false);
    updateTypingStatus(false);
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(messageDate, 'HH:mm');
    } else if (diffInHours < 7 * 24) {
      return format(messageDate, 'EEE HH:mm');
    } else {
      return format(messageDate, 'MMM d, HH:mm');
    }
  };

  if (loading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>Messages</span>
            {connected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Connecting...</Badge>
            )}
          </CardTitle>
          
          <div className="flex space-x-2">
            {onVoiceCall && (
              <HapticButton
                variant="outline"
                size="sm"
                onClick={onVoiceCall}
                hapticPattern="light"
              >
                <Phone className="h-4 w-4" />
              </HapticButton>
            )}
            
            {onVideoCall && (
              <HapticButton
                variant="outline"
                size="sm"
                onClick={onVideoCall}
                hapticPattern="light"
              >
                <Video className="h-4 w-4" />
              </HapticButton>
            )}
            
            {onEmergencyAlert && (
              <HapticButton
                variant="destructive"
                size="sm"
                onClick={onEmergencyAlert}
                hapticPattern="heavy"
              >
                <AlertTriangle className="h-4 w-4" />
              </HapticButton>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-2">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              const senderName = message.sender_profile 
                ? `${message.sender_profile.first_name || ''} ${message.sender_profile.last_name || ''}`.trim()
                : 'Unknown';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                    {!isOwnMessage && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {senderName[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`space-y-1 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
                      {!isOwnMessage && (
                        <div className="text-xs text-muted-foreground px-1">
                          {senderName}
                        </div>
                      )}
                      
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {message.media_url && (
                          <div className="mb-2">
                            <img
                              src={message.media_url}
                              alt="Attached media"
                              className="max-w-full h-auto rounded"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        )}
                        
                        {message.text && (
                          <p className="text-sm whitespace-pre-wrap">
                            {message.text}
                          </p>
                        )}
                        
                        <div className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {formatMessageTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicators */}
            {typing.length > 0 && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">...</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Message Input */}
        <div className="p-4 border-t">
          {selectedMedia && (
              <div className="mb-2 p-2 bg-muted rounded flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{selectedMedia.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMedia(null)}
              >
                ×
              </Button>
            </div>
          )}
          
          <div className="flex space-x-2">
            <div className="flex-1 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Input
                value={messageText}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
            </div>
            
            <HapticButton
              onClick={handleSendMessage}
              disabled={(!messageText.trim() && !selectedMedia) || sending}
              hapticPattern="light"
            >
              <Send className="h-4 w-4" />
            </HapticButton>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};