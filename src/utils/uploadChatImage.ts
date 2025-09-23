// src/utils/uploadChatImage.ts
export async function uploadChatImage(supabase, threadId, file) {
  const key = `${threadId}/${crypto.randomUUID()}-${file.name}`;
  const up = await supabase.storage.from('chat-media').upload(key, file, { upsert: false });
  if (up.error) throw up.error;

  // store message
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('chat_messages').insert({
    thread_id: threadId,
    sender_id: user.id,
    type: 'image',
    media_path: key
  });

  // view url (signed)
  const { data: signed } = await supabase.functions.invoke('chat_sign_url', { body: { path: key } });
  return signed?.signedUrl;
}
