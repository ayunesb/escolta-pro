import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  text?: string;
  media_url?: string;
  created_at: string;
  // Joined data
  sender_profile?: {
    first_name?: string;
    last_name?: string;
  };
}

export const useRealtimeMessaging = (bookingId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId || !user) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!sender_id (
            first_name,
            last_name
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        async (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          
          // Fetch sender profile for the new message
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', newMessage.sender_id)
            .single();

          const messageWithProfile = {
            ...newMessage,
            sender_profile: senderProfile,
          };

          setMessages(prev => [...prev, messageWithProfile]);

          // Show notification if message is from someone else
          if (newMessage.sender_id !== user.id) {
            const senderName = senderProfile?.first_name 
              ? `${senderProfile.first_name} ${senderProfile.last_name || ''}`
              : 'Someone';
            
            toast('New Message', {
              description: `${senderName}: ${newMessage.text || 'Sent a media file'}`,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.hash = `/booking/${bookingId}`;
                }
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, user]);

  const sendMessage = async (text?: string, mediaUrl?: string) => {
    if (!bookingId || !user || (!text && !mediaUrl)) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: user.id,
        text,
        media_url: mediaUrl,
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }

    return true;
  };

  return {
    messages,
    loading,
    sendMessage,
  };
};