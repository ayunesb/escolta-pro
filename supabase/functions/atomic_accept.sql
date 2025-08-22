-- Atomic Accept SQL for Guard App
-- Only accept if status is 'matching'
UPDATE bookings
SET status = 'assigned', assigned_user_id = $1, updated_at = NOW()
WHERE id = $2 AND status = 'matching';
