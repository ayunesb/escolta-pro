import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/storage';

type Message = {
  id: string;
  booking_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
};

export function useChat(bookingId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const subRef = useRef<any>(null);

  useEffect(() => {
    if (!bookingId) return;

    let mounted = true;

    supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!mounted) return;
        setMessages((data as Message[]) ?? []);
      });

    subRef.current = supabase
      .channel(`public:messages:booking:${bookingId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      mounted = false;
      try {
        if (subRef.current) supabase.removeChannel(subRef.current);
      } catch (e) {}
    };
  }, [bookingId]);

  const send = async (body: string) => {
    if (!bookingId || !body) return null;
    const user = await supabase.auth.getUser();
    const sender_id = user.data?.user?.id ?? null;
    const res = await supabase.from('messages').insert({ booking_id: bookingId, sender_id, body }).select().single();
    return (res.data as Message) ?? null;
  };

  return { messages, send };
}
