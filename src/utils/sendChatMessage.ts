// src/utils/sendChatMessage.ts
export async function sendChatMessage(supabase, threadId, body) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');
  const { error } = await supabase.from('chat_messages').insert({
    thread_id: threadId,
    sender_id: user.id,
    type: 'text',
    body
  });
  if (error) throw error;
}
