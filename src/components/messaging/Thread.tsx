import React, { useState } from 'react';
import { useChat } from '../../hooks/use-chat';
import Composer from './Composer';

type Props = {
  bookingId: string;
};

export default function Thread({ bookingId }: Props) {
  const { messages, send, updateMessage } = useChat(bookingId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // derive currentUserId from latest message sender if available as a lightweight fallback
  React.useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last && typeof last.sender_id === 'string') setCurrentUserId(last.sender_id);
  }, [messages]);

  // helper to update message (optimistic handled by hook)
  async function onSave(id: string) {
    try {
      await updateMessage(id, editedBody);
    } catch (e) {
      console.error('update failed', e);
    } finally {
      setEditingId(null);
    }
  }

  return (
    <div className="flex flex-col h-full border rounded">
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="p-2 bg-gray-100 rounded">
            <div className="text-sm text-gray-600">{m.sender_id ?? 'anónimo'}</div>
            {editingId === m.id ? (
              <div>
                <textarea
                  className="w-full p-2 border rounded"
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                />
                <div className="flex space-x-2 mt-2">
                  <button className="btn btn-sm" onClick={() => onSave(m.id)}>Save</button>
                  <button className="btn btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="mt-1">{m.body}</div>
            )}
            <div className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleString()}</div>
            {/* show Edit if this message is by current user (simple check) */}
            {m.sender_id === currentUserId && messages.length > 0 && messages[messages.length - 1].id === m.id && (
              <div className="mt-1">
                <button
                  className="text-xs text-blue-600"
                  onClick={() => {
                    setEditingId(m.id);
                    setEditedBody(m.body);
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
  <Composer onSend={async (b) => { await send(b); }} />
    </div>
  );
}
