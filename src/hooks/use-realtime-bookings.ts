import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Booking {
  id: string;
  client_id: string;
  status: string;
  pickup_address?: string;
  start_ts?: string;
  end_ts?: string;
  total_mxn_cents?: number;
  assigned_user_id?: string;
  assigned_company_id?: string;
  created_at: string;
  updated_at: string;
}

export const useRealtimeBookings = () => {
  const { user, hasRole } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial bookings based on user role
    const fetchBookings = async () => {
      let query = supabase.from('bookings').select('*');

      if (hasRole('client')) {
        query = query.eq('client_id', user.id);
      } else if (hasRole('freelancer')) {
        // Get bookings assigned to this guard
        query = query.eq('assigned_user_id', user.id);
      } else if (hasRole('company_admin')) {
        // Get bookings assigned to user's company
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.company_id) {
          query = query.eq('assigned_company_id', profile.company_id);
        }
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
      setActiveBookings((data || []).filter(b => 
        ['matching', 'assigned', 'in_progress'].includes(b.status)
      ));
    };

    fetchBookings();

    // Set up real-time subscription for booking updates
    const getRealtimeFilter = () => {
      if (hasRole('client')) {
        return `client_id=eq.${user.id}`;
      } else if (hasRole('freelancer')) {
        return `assigned_user_id=eq.${user.id}`;
      } else if (hasRole('super_admin')) {
        return undefined; // No filter for super admin
      }
      // For company admin, we'll need to filter by company_id but that requires a join
      return undefined;
    };

    const filter = getRealtimeFilter();
    let channelBuilder = supabase
      .channel('bookings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          ...(filter && { filter }),
        },
        (payload: unknown) => {
          console.warn('Booking updated:', payload);
          if (!payload || typeof payload !== 'object' || !('new' in payload)) return;
          const updatedBooking = (payload as Record<string, unknown>).new as Booking;
          
          setBookings(prev => 
            prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)
          );
          
          // Update active bookings
          setActiveBookings(prev => {
            const filtered = prev.filter(b => b.id !== updatedBooking.id);
            if (['matching', 'assigned', 'in_progress'].includes(updatedBooking.status)) {
              return [updatedBooking, ...filtered];
            }
            return filtered;
          });

          // Show status update notification
          const statusMessages = {
            assigned: 'A guard has been assigned to your booking!',
            in_progress: 'Your security service is now in progress',
            completed: 'Your security service has been completed',
            cancelled: 'Your booking has been cancelled',
          };

          const message = statusMessages[updatedBooking.status as keyof typeof statusMessages];
          if (message) {
            toast('Booking Update', {
              description: message,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.hash = `/booking/${updatedBooking.id}`;
                }
              }
            });
          }
        }
      );

    // Also listen for new bookings (for guards/companies to see new opportunities)
    if (hasRole('freelancer') || hasRole('company_admin') || hasRole('super_admin')) {
      channelBuilder = channelBuilder.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: 'status=eq.matching',
        },
        (payload: unknown) => {
          console.warn('New booking opportunity:', payload);
          if (!payload || typeof payload !== 'object' || !('new' in payload)) return;
          const newBooking = (payload as Record<string, unknown>).new as Booking;
          
          setBookings(prev => [newBooking, ...prev]);
          setActiveBookings(prev => [newBooking, ...prev]);

          if (hasRole('freelancer')) {
            toast('New Job Opportunity', {
              description: `New security job available: ${newBooking.pickup_address}`,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.hash = `/booking/${newBooking.id}`;
                }
              }
            });
          }
        }
      );
    }

    const channel = channelBuilder.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, hasRole]);

  return {
    bookings,
    activeBookings,
  };
};