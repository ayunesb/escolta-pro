-- Create trigger to automatically send notifications when booking status changes
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Send notification to client
    IF NEW.client_id IS NOT NULL THEN
      -- Determine notification details based on new status
      CASE NEW.status
        WHEN 'assigned' THEN
          PERFORM public.send_notification(
            NEW.client_id,
            NEW.id,
            'booking_update',
            'Guard Assigned!',
            'A security guard has been assigned to your booking and will arrive shortly.',
            '/booking/' || NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
          );
        WHEN 'in_progress' THEN
          PERFORM public.send_notification(
            NEW.client_id,
            NEW.id,
            'booking_update',
            'Service Started',
            'Your security service is now active and in progress.',
            '/booking/' || NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
          );
        WHEN 'completed' THEN
          PERFORM public.send_notification(
            NEW.client_id,
            NEW.id,
            'booking_update',
            'Service Completed',
            'Your security service has been completed successfully. Thank you for choosing Blindado!',
            '/booking/' || NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
          );
        WHEN 'cancelled' THEN
          PERFORM public.send_notification(
            NEW.client_id,
            NEW.id,
            'booking_update',
            'Booking Cancelled',
            'Your booking has been cancelled. If you have any questions, please contact support.',
            '/booking/' || NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
          );
        ELSE
          -- For other status changes, send a generic notification
          PERFORM public.send_notification(
            NEW.client_id,
            NEW.id,
            'booking_update',
            'Booking Updated',
            'Your booking status has been updated to: ' || NEW.status,
            '/booking/' || NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
          );
      END CASE;
    END IF;

    -- Send notification to assigned guard if exists
    IF NEW.assigned_user_id IS NOT NULL THEN
      CASE NEW.status
        WHEN 'assigned' THEN
          PERFORM public.send_notification(
            NEW.assigned_user_id,
            NEW.id,
            'assignment_change',
            'New Assignment',
            'You have been assigned to a new security job at ' || COALESCE(NEW.pickup_address, 'the specified location'),
            '/booking/' || NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
          );
        WHEN 'in_progress' THEN
          PERFORM public.send_notification(
            NEW.assigned_user_id,
            NEW.id,
            'assignment_change',
            'Job Started',
            'Your security assignment is now active. Stay alert and professional.',
            '/booking/' || NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
          );
        WHEN 'completed' THEN
          PERFORM public.send_notification(
            NEW.assigned_user_id,
            NEW.id,
            'assignment_change',
            'Job Completed',
            'Your security assignment has been completed. Great work!',
            '/booking/' || NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
          );
        WHEN 'cancelled' THEN
          PERFORM public.send_notification(
            NEW.assigned_user_id,
            NEW.id,
            'assignment_change',
            'Assignment Cancelled',
            'Your security assignment has been cancelled.',
            '/booking/' || NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
          );
      END CASE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS booking_status_change_trigger ON public.bookings;
CREATE TRIGGER booking_status_change_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_status_change();