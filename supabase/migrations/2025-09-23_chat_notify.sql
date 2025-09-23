-- Trigger to notify participants on new chat message
create or replace function public.notify_chat_message()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.notifications(user_id, booking_id, type, title, message, action_url, metadata)
  select cp.user_id, b.id, 'message', 'Nuevo mensaje', left(new.body, 80),
         '/booking/'||b.id::text||'?t='||new.thread_id::text,
         jsonb_build_object('thread_id', new.thread_id, 'message_id', new.id)
  from public.chat_participants cp
  join public.chat_threads ct on ct.id = new.thread_id
  join public.bookings b on b.id = ct.booking_id
  where cp.thread_id = new.thread_id
    and cp.user_id <> new.sender_id;
  return new;
end;
$$;

drop trigger if exists trg_notify_chat_message on public.chat_messages;
create trigger trg_notify_chat_message
after insert on public.chat_messages
for each row execute function public.notify_chat_message();
