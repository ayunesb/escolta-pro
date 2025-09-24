import { useEffect, useState, useRef } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';

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
  const supabase = useSupabase();

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
    const res = await sendMessage(supabase, bookingId, body);
    if (res) setMessages((prev) => [...prev, res]);
    return res;
  };

  const updateMessage = async (id: string, newBody: string) => {
    // optimistic update
    const prev = messages;
    setMessages((m) => m.map((it) => (it.id === id ? { ...it, body: newBody } : it)));
    const { error } = await supabase.from('messages').update({ body: newBody }).eq('id', id);
    if (error) {
      // revert
      setMessages(prev);
      throw error;
    }
    return true;
  };

  return { messages, send, updateMessage };
}

export async function sendMessage(client: any, bookingId: string, body: string) {
  const user = await client.auth.getUser();
  const sender_id = user.data?.user?.id ?? null;
  const res = await client.from('messages').insert({ booking_id: bookingId, sender_id, body }).select().single();
  return res.data as Message | null;
}
