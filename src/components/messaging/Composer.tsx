import * as React from 'react';
import { useState } from 'react';

type Props = {
  onSend: (body: string) => Promise<void>;
};

export default function Composer({ onSend }: Props) {
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    await onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex gap-2 p-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe un mensaje..."
        className="flex-1 px-3 py-2 border rounded"
      />
      <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded">
        Enviar
      </button>
    </div>
  );
}
