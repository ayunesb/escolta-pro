-- Enable realtime for bookings and messages tables
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.assignments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;

-- Create notifications table for push notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'booking_update', 'message', 'assignment_change', 'payment_success'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Add realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to send notifications
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_booking_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, booking_id, type, title, message, action_url, metadata
  ) VALUES (
    p_user_id, p_booking_id, p_type, p_title, p_message, p_action_url, p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;