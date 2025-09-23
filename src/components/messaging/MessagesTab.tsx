import { useState, useEffect } from 'react';
import { useChatThread } from '@/hooks/useChatThread';
import { sendChatMessage } from '@/utils/sendChatMessage';
import { getOrCreateBookingThread } from '@/utils/getOrCreateBookingThread';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export function MessagesTab({ bookingId }: { bookingId: string }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { messages } = useChatThread(supabase, threadId ?? '');

  useEffect(() => {
    async function ensureThread() {
      try {
        const id = await getOrCreateBookingThread(supabase, bookingId);
        setThreadId(id);
      } catch (err) {
        // handle error
      }
    }
    ensureThread();
  }, [bookingId]);

  async function handleSend() {
    setSending(true);
    try {
      await sendChatMessage(supabase, threadId!, input);
      setInput('');
    } catch (err) {
      // handle error
    }
    setSending(false);
  }

  if (!threadId) return <div>Loading chat...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-bold mr-2">{msg.type === 'system' ? 'System' : 'User'}</span>
            <span>{msg.body}</span>
            {msg.media_path && <img src={msg.media_path} alt="media" className="max-w-xs mt-1" />}
            <span className="text-xs text-gray-400 ml-2">{new Date(msg.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="flex p-2 border-t">
        <input
          className="flex-1 border rounded px-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <Button onClick={handleSend} disabled={sending || !input.trim()} className="ml-2">Send</Button>
      </div>
    </div>
  );
}
