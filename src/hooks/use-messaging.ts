import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  text: string;
  media_url?: string;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
}

interface MessageDraft {
  text: string;
  media?: File;
}

export const useMessaging = (bookingId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles(first_name, last_name, photo_url)
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId, toast]);

  // Set up real-time subscription
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        async (payload) => {
          // Fetch the new message with profile data
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender_profile:profiles(first_name, last_name, photo_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data]);
            
            // Show notification if message is from someone else
            if (data.sender_id !== user?.id) {
              const senderName = data.sender_profile?.first_name || 'Someone';
              toast({
                title: `New message from ${senderName}`,
                description: data.text.length > 50 ? `${data.text.substring(0, 50)}...` : data.text,
              });
            }
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const typingUsers = Object.values(presenceState)
          .flat()
          .filter((presence: any) => presence.typing && presence.user_id !== user?.id)
          .map((presence: any) => presence.user_id);
        
        setTyping(typingUsers);
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, user?.id, fetchMessages, toast]);

  // Send a message
  const sendMessage = async (draft: MessageDraft) => {
    if (!user || !draft.text.trim()) return;

    setSending(true);
    
    try {
      let mediaUrl: string | undefined;

      // Upload media if present
      if (draft.media) {
        const fileExt = draft.media.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `messages/${bookingId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('incidents')
          .upload(filePath, draft.media);

        if (uploadError) throw uploadError;

        // Use signed URL for private access
        const { data: signedUrlData, error: signedUrlError } = await supabase.functions.invoke('document_signed_url', {
          body: { document_path: filePath, expires_in: 300 }
        });
        if (signedUrlError || !signedUrlData?.signed_url) throw signedUrlError || new Error('Failed to generate signed URL');
        mediaUrl = signedUrlData.signed_url;
      }

      // Insert message
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: user.id,
          text: draft.text,
          media_url: mediaUrl
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Update typing status
  const updateTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!user) return;

    const channel = supabase.channel(`messages:${bookingId}`);
    
    await channel.track({
      user_id: user.id,
      typing: isTyping,
      online_at: new Date().toISOString()
    });
  }, [bookingId, user]);

  return {
    messages,
    loading,
    sending,
    connected,
    typing,
    sendMessage,
    updateTypingStatus,
    refetch: fetchMessages
  };
};