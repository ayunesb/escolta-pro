-- Trigger: Notify client and guard on booking status change
create or replace function notify_booking_status_change()
returns trigger as $$
begin
  -- Example: Insert notification row (customize for your notification system)
  insert into notifications (user_id, message, booking_id, status, created_at)
    values (new.client_id, 'Your booking status changed to ' || new.status, new.id, new.status, now());
  if new.guard_id is not null then
    insert into notifications (user_id, message, booking_id, status, created_at)
      values (new.guard_id, 'A booking you are assigned to changed status to ' || new.status, new.id, new.status, now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists booking_status_notify on bookings;
create trigger booking_status_notify
  after update of status on bookings
  for each row execute procedure notify_booking_status_change();
