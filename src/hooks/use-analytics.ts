import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, startOfDay, endOfDay, format, parseISO } from 'date-fns';

export interface BookingAnalytics {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  completionRate: number;
  bookingsByStatus: Record<string, number>;
  bookingsByDay: Array<{ date: string; count: number; revenue: number }>;
  topGuards: Array<{ id: string; name: string; bookings: number; rating: number }>;
  revenueByService: Record<string, number>;
}

export interface GuardAnalytics {
  totalAssignments: number;
  completedAssignments: number;
  averageRating: number;
  totalEarnings: number;
  assignmentsByMonth: Array<{ month: string; count: number; earnings: number }>;
  performanceMetrics: {
    onTimeRate: number;
    completionRate: number;
    clientSatisfaction: number;
  };
}

export interface CompanyAnalytics {
  activeGuards: number;
  totalBookings: number;
  monthlyRevenue: number;
  guardUtilization: number;
  clientRetention: number;
  marketShare: Record<string, number>;
}

export const useBookingAnalytics = (dateRange: { start: Date; end: Date }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<BookingAnalytics>({
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    completionRate: 0,
    bookingsByStatus: {},
    bookingsByDay: [],
    topGuards: [],
    revenueByService: {},
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch bookings within date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          payments (
            amount_captured,
            amount_preauth,
            status,
            created_at
          )
        `)
        .eq('client_id', user.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (bookingsError) throw bookingsError;

      // Calculate metrics
      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => {
        const payment = b.payments?.find(p => p.status === 'succeeded');
        return sum + (payment?.amount_captured || 0);
      }, 0) || 0;

      // Bookings by status
      const bookingsByStatus = bookings?.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Bookings by day
      const bookingsByDay = [];
      const dayMap = new Map<string, { count: number; revenue: number }>();
      
      bookings?.forEach(booking => {
        const date = format(parseISO(booking.created_at), 'yyyy-MM-dd');
        const current = dayMap.get(date) || { count: 0, revenue: 0 };
        const payment = booking.payments?.find(p => p.status === 'succeeded');
        dayMap.set(date, {
          count: current.count + 1,
          revenue: current.revenue + (payment?.amount_captured || 0)
        });
      });

      dayMap.forEach((value, date) => {
        bookingsByDay.push({ date, count: value.count, revenue: value.revenue });
      });

      // Fetch assignments for top guards
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          guard_id,
          guards (
            id,
            rating
          )
        `)
        .in('booking_id', bookings?.map(b => b.id) || []);

      // Fetch guard profiles separately to avoid type issues
      const guardIds = [...new Set(assignments?.map(a => a.guards?.id).filter(Boolean))] || [];
      const { data: guardProfiles } = await supabase
        .from('guards')
        .select(`
          id,
          user_id,
          rating
        `)
        .in('id', guardIds);

      const profileIds = guardProfiles?.map(g => g.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', profileIds);

      // Top guards
      const guardStats = new Map<string, { name: string; bookings: number; rating: number }>();
      assignments?.forEach(assignment => {
        const guard = assignment.guards;
        if (guard) {
          const guardProfile = guardProfiles?.find(gp => gp.id === guard.id);
          const profile = profiles?.find(p => p.id === guardProfile?.user_id);
          const current = guardStats.get(guard.id) || { 
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown Guard', 
            bookings: 0, 
            rating: guard.rating || 0 
          };
          guardStats.set(guard.id, {
            ...current,
            bookings: current.bookings + 1
          });
        }
      });

      const topGuards = Array.from(guardStats.entries())
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Revenue by service type
      const revenueByService = bookings?.reduce((acc, booking) => {
        const serviceType = booking.armed_required ? 'Armed Security' : 'Standard Security';
        const payment = booking.payments?.find(p => p.status === 'succeeded');
        acc[serviceType] = (acc[serviceType] || 0) + (payment?.amount_captured || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      setAnalytics({
        totalBookings,
        totalRevenue: totalRevenue / 100, // Convert from cents
        averageBookingValue: totalBookings > 0 ? (totalRevenue / totalBookings / 100) : 0,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        bookingsByStatus,
        bookingsByDay: bookingsByDay.map(d => ({ ...d, revenue: d.revenue / 100 })),
        topGuards,
        revenueByService: Object.fromEntries(
          Object.entries(revenueByService).map(([k, v]) => [k, v / 100])
        ),
      });
    } catch (error) {
      console.error('Error fetching booking analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, dateRange]);

  return { analytics, loading, refetch: fetchAnalytics };
};

export const useGuardAnalytics = (guardId?: string) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<GuardAnalytics>({
    totalAssignments: 0,
    completedAssignments: 0,
    averageRating: 0,
    totalEarnings: 0,
    assignmentsByMonth: [],
    performanceMetrics: {
      onTimeRate: 0,
      completionRate: 0,
      clientSatisfaction: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const fetchGuardAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const targetGuardId = guardId || user.id;

      // Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          bookings!inner (
            id,
            total_mxn_cents,
            start_ts,
            created_at,
            client_id
          )
        `)
        .eq('guard_id', targetGuardId);

      if (assignmentsError) throw assignmentsError;

      // Fetch guard info for rating
      const { data: guard, error: guardError } = await supabase
        .from('guards')
        .select('rating')
        .eq('user_id', targetGuardId)
        .single();

      if (guardError) console.error('Error fetching guard info:', guardError);

      // Calculate metrics
      const totalAssignments = assignments?.length || 0;
      const completedAssignments = assignments?.filter(a => a.status === 'completed').length || 0;
      const totalEarnings = assignments?.reduce((sum, a) => {
        return sum + (a.bookings?.total_mxn_cents || 0);
      }, 0) || 0;

      // Assignments by month
      const monthMap = new Map<string, { count: number; earnings: number }>();
      assignments?.forEach(assignment => {
        const month = format(parseISO(assignment.bookings?.created_at || ''), 'yyyy-MM');
        const current = monthMap.get(month) || { count: 0, earnings: 0 };
        monthMap.set(month, {
          count: current.count + 1,
          earnings: current.earnings + (assignment.bookings?.total_mxn_cents || 0)
        });
      });

      const assignmentsByMonth = Array.from(monthMap.entries())
        .map(([month, data]) => ({ month, count: data.count, earnings: data.earnings / 100 }))
        .sort();

      // Performance metrics
      const onTimeAssignments = assignments?.filter(a => {
        // Simplified: assume on-time if checked in within 15 minutes of start
        if (!a.check_in_ts || !a.bookings?.start_ts) return false;
        const checkIn = parseISO(a.check_in_ts);
        const scheduled = parseISO(a.bookings.start_ts);
        return checkIn <= new Date(scheduled.getTime() + 15 * 60 * 1000);
      }).length || 0;

      setAnalytics({
        totalAssignments,
        completedAssignments,
        averageRating: guard?.rating || 0,
        totalEarnings: totalEarnings / 100,
        assignmentsByMonth,
        performanceMetrics: {
          onTimeRate: totalAssignments > 0 ? (onTimeAssignments / totalAssignments) * 100 : 0,
          completionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
          clientSatisfaction: guard?.rating || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching guard analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardAnalytics();
  }, [user, guardId]);

  return { analytics, loading, refetch: fetchGuardAnalytics };
};

export const useCompanyAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<CompanyAnalytics>({
    activeGuards: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    guardUtilization: 0,
    clientRetention: 0,
    marketShare: {},
  });
  const [loading, setLoading] = useState(true);

  const fetchCompanyAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Fetch company guards
      const { data: guards } = await supabase
        .from('guards')
        .select('id, active')
        .eq('company_id', profile.company_id);

      // Fetch bookings assigned to company
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          payments (amount_captured, status)
        `)
        .eq('assigned_company_id', profile.company_id)
        .gte('created_at', subDays(new Date(), 30).toISOString());

      const activeGuards = guards?.filter(g => g.active).length || 0;
      const totalBookings = bookings?.length || 0;
      const monthlyRevenue = bookings?.reduce((sum, b) => {
        const payment = b.payments?.find(p => p.status === 'succeeded');
        return sum + (payment?.amount_captured || 0);
      }, 0) || 0;

      setAnalytics({
        activeGuards,
        totalBookings,
        monthlyRevenue: monthlyRevenue / 100,
        guardUtilization: 0, // Placeholder calculation
        clientRetention: 0, // Placeholder calculation
        marketShare: {}, // Placeholder calculation
      });
    } catch (error) {
      console.error('Error fetching company analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyAnalytics();
  }, [user]);

  return { analytics, loading, refetch: fetchCompanyAnalytics };
};