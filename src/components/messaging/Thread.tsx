import React from 'react';
import { useChat } from '../../hooks/use-chat';
import Composer from './Composer';

type Props = {
  bookingId: string;
};

export default function Thread({ bookingId }: Props) {
  const { messages, send } = useChat(bookingId);

  return (
    <div className="flex flex-col h-full border rounded">
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="p-2 bg-gray-100 rounded">
            <div className="text-sm text-gray-600">{m.sender_id ?? 'anónimo'}</div>
            <div className="mt-1">{m.body}</div>
            <div className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <Composer onSend={async (b) => await send(b)} />
    </div>
  );
}
