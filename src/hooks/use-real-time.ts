import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Booking = {
  id: string;
  client_id: string;
  created_at: string;
  [key: string]: unknown;
}

export function useRealTimeBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        setBookings(data);
      }
      setLoading(false);
    };

    fetchBookings();

    // Real-time subscription
    const channel = supabase
      .channel('bookings_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `client_id=eq.${user.id}`
        },
        (payload: unknown) => {
          const p = payload as Record<string, unknown> | undefined;
          const newRecord = p?.['new'] as Booking | undefined;
          const oldRecord = p?.['old'] as Booking | undefined;
          if (p?.eventType === 'INSERT' && newRecord) {
            setBookings(prev => [newRecord, ...prev]);
          } else if (p?.eventType === 'UPDATE' && newRecord) {
            setBookings(prev => 
              prev.map(booking => 
                booking.id === newRecord.id ? newRecord : booking
              )
            );
          } else if (p?.eventType === 'DELETE' && oldRecord) {
            setBookings(prev => 
              prev.filter(booking => booking.id !== oldRecord.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { bookings, loading, refetch: async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        setBookings(data);
      }
    } finally {
      setLoading(false);
    }
  } };
}

export function useRealTimeAssignments() {
  const { user } = useAuth();
  type Assignment = { id: string } & Record<string, unknown>
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchAssignments = async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          bookings (
            pickup_address,
            start_ts,
            end_ts,
            client_id
          )
        `)
        .eq('guard_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        setAssignments(data);
      }
      setLoading(false);
    };

    fetchAssignments();

    // Real-time subscription
    const channel = supabase
      .channel('assignments_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `guard_id=eq.${user.id}`
        },
        (payload: unknown) => {
          const p = payload as Record<string, unknown> | undefined;
          const newRecord = p?.['new'] as Assignment | undefined;
          const oldRecord = p?.['old'] as Assignment | undefined;
          if (p?.eventType === 'INSERT' && newRecord) {
            setAssignments(prev => [newRecord, ...prev]);
          } else if (p?.eventType === 'UPDATE' && newRecord) {
            setAssignments(prev => 
              prev.map(assignment => 
                assignment.id === newRecord.id ? newRecord : assignment
              )
            );
          } else if (p?.eventType === 'DELETE' && oldRecord) {
            setAssignments(prev => 
              prev.filter(assignment => assignment.id !== oldRecord.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { assignments, loading, refetch: async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          bookings (
            pickup_address,
            start_ts,
            end_ts,
            client_id
          )
        `)
        .eq('guard_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        setAssignments(data);
      }
    } finally {
      setLoading(false);
    }
  } };
}

export function useRealTimeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (!user) return;

    // Listen for booking status changes that affect the user
    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `client_id=eq.${user.id}`
        },
        (payload: unknown) => {
          const p = payload as Record<string, unknown> | undefined;
          const oldStatus = (p?.old as Record<string, unknown> | undefined)?.['status'] as string | undefined;
          const newStatus = (p?.new as Record<string, unknown> | undefined)?.['status'] as string | undefined;
          
          if (oldStatus !== newStatus) {
            const notification = {
              id: Date.now(),
              type: 'booking_status_change',
              title: 'Booking Update',
              message: `Your booking status changed to ${newStatus}`,
              timestamp: new Date().toISOString(),
              data: p?.new as Record<string, unknown> | undefined
            };
            
            setNotifications(prev => [notification, ...prev].slice(0, 10));
            
            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  return { 
    notifications, 
    requestNotificationPermission,
    clearNotifications: () => setNotifications([])
  };
}