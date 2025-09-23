// src/hooks/useChatThread.ts
import { useEffect, useState } from 'react';

export function useChatThread(supabase, threadId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    let aborted = false;
    async function load() {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (!error && !aborted) setMessages(data ?? []);
    }
    load();

    const chan = supabase
      .channel(`chat:${threadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages((prev) => {
            if (payload.eventType === 'INSERT') return [...prev, payload.new];
            if (payload.eventType === 'UPDATE')
              return prev.map((m) => (m.id === payload.new.id ? payload.new : m));
            if (payload.eventType === 'DELETE')
              return prev.filter((m) => m.id !== payload.old.id);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      aborted = true;
      supabase.removeChannel(chan);
    };
  }, [supabase, threadId]);

  return { messages };
}
