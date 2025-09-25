import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  bookingId: string;
  guardId: string;
  status: 'offered' | 'accepted' | 'in_progress' | 'on_site' | 'completed';
  checkInTs?: string;
  checkOutTs?: string;
  onSiteTs?: string;
  inProgressTs?: string;
  gpsTrail: Array<{ lat: number; lng: number; timestamp: string }>;
}

export const useAssignmentTracking = (assignmentId?: string) => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!assignmentId) return;

    // Subscribe to assignment updates
    const subscription = supabase
      .channel(`assignment:${assignmentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assignments',
        filter: `id=eq.${assignmentId}`
      }, (payload: unknown) => {
        const payloadObj = payload as Record<string, unknown>;
        const newData = (payloadObj && payloadObj['new']) as Record<string, unknown> | undefined;

        const gpsTrail: Array<{ lat: number; lng: number; timestamp: string }> =
          Array.isArray(newData?.['gps_trail'])
            ? (newData!['gps_trail'] as unknown[]).filter(
                (item): item is { lat: number; lng: number; timestamp: string } => {
                  if (item === null || typeof item !== 'object') return false;
                  const it = item as Record<string, unknown>;
                  return (
                    'lat' in it &&
                    'lng' in it &&
                    typeof it['lat'] === 'number' &&
                    typeof it['lng'] === 'number' &&
                    typeof it['timestamp'] === 'string'
                  );
                }
              )
            : [];

        setAssignment({
          id: String((newData && newData['id']) ?? ''),
          bookingId: String((newData && newData['booking_id']) ?? ''),
          guardId: String((newData && newData['guard_id']) ?? ''),
          status: String((newData && newData['status']) ?? 'offered') as Assignment['status'],
          checkInTs: (newData && typeof newData['check_in_ts'] === 'string') ? (newData['check_in_ts'] as string) : undefined,
          checkOutTs: (newData && typeof newData['check_out_ts'] === 'string') ? (newData['check_out_ts'] as string) : undefined,
          onSiteTs: (newData && typeof newData['on_site_ts'] === 'string') ? (newData['on_site_ts'] as string) : undefined,
          inProgressTs: (newData && typeof newData['in_progress_ts'] === 'string') ? (newData['in_progress_ts'] as string) : undefined,
          gpsTrail,
        });
      })
      .subscribe();

    // Load initial assignment
    loadAssignment();

    return () => {
      subscription.unsubscribe();
    };
  }, [assignmentId]);

  const loadAssignment = async () => {
    if (!assignmentId) return;

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load assignment",
        variant: "destructive"
      });
      return;
    }

    const d = data as Record<string, unknown> | null;
    if (!d) return;

    const gpsTrail: Array<{ lat: number; lng: number; timestamp: string }> =
      Array.isArray(d['gps_trail'])
        ? (d['gps_trail'] as unknown[]).filter((item): item is { lat: number; lng: number; timestamp: string } => {
            if (item === null || typeof item !== 'object') return false;
            const it = item as Record<string, unknown>;
            return (
              'lat' in it && 'lng' in it && 'timestamp' in it &&
              typeof it['lat'] === 'number' &&
              typeof it['lng'] === 'number' &&
              typeof it['timestamp'] === 'string'
            );
          })
        : [];

    setAssignment({
      id: String(d['id'] ?? ''),
      bookingId: String(d['booking_id'] ?? ''),
      guardId: String(d['guard_id'] ?? ''),
      status: (typeof d['status'] === 'string' ? (d['status'] as Assignment['status']) : 'offered'),
      checkInTs: typeof d['check_in_ts'] === 'string' ? (d['check_in_ts'] as string) : undefined,
      checkOutTs: typeof d['check_out_ts'] === 'string' ? (d['check_out_ts'] as string) : undefined,
      onSiteTs: typeof d['on_site_ts'] === 'string' ? (d['on_site_ts'] as string) : undefined,
      inProgressTs: typeof d['in_progress_ts'] === 'string' ? (d['in_progress_ts'] as string) : undefined,
      gpsTrail,
    });
  };

  const updateStatus = async (status: Assignment['status']) => {
    if (!assignmentId) return;

    try {
      // Use the edge function for status updates to ensure proper business logic
      const { data, error } = await supabase.functions.invoke('assignment_update', {
        body: {
          assignmentId,
          status,
          location: location ? { lat: location.lat, lng: location.lng } : undefined
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: "Failed to update assignment status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Status Updated",
        description: data.message || `Assignment status updated to ${status}`,
      });

    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive"
      });
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Available",
        description: "Location tracking is not supported",
        variant: "destructive"
      });
      return;
    }

    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setLocation(newLocation);
        updateGpsTrail(newLocation);
      },
      (error) => {
        toast({
          title: "GPS Error",
          description: "Failed to get location",
          variant: "destructive"
        });
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  };

  const updateGpsTrail = async (newLocation: { lat: number; lng: number }) => {
    if (!assignmentId || !assignment) return;

    const newTrailPoint = {
      ...newLocation,
      timestamp: new Date().toISOString()
    };

    const updatedTrail = [...(assignment.gpsTrail || []), newTrailPoint];

    const { error } = await supabase
      .from('assignments')
      .update({ gps_trail: updatedTrail })
      .eq('id', assignmentId);

    if (error) {
      console.error('Failed to update GPS trail:', error);
    }
  };

  return {
    assignment,
    location,
    isTracking,
    updateStatus,
    startLocationTracking,
    loadAssignment
  };
};