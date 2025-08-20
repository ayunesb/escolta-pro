import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GPSLocation {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

interface TrackingData {
  assignment_id: string;
  guard_location?: GPSLocation;
  client_location?: GPSLocation;
  eta_minutes?: number;
  distance_km?: number;
  status: 'offered' | 'accepted' | 'enroute' | 'arrived' | 'in_progress' | 'completed';
}

export const useLiveTracking = (assignmentId: string) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [userLocation, setUserLocation] = useState<GPSLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Get user's current location
  const getCurrentLocation = useCallback((): Promise<GPSLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }, []);

  // Start location sharing
  const startLocationSharing = useCallback(async () => {
    if (!navigator.geolocation || sharing) return;

    try {
      setSharing(true);
      setLocationError(null);

      // Get initial location
      const location = await getCurrentLocation();
      setUserLocation(location);

      // Update assignment with initial location
      await supabase.functions.invoke('assignment_update', {
        body: {
          assignment_id: assignmentId,
          action: 'update_location',
          location
        }
      });

      // Start watching position
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation: GPSLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          };

          setUserLocation(newLocation);

          // Update GPS trail every 30 seconds
          if (!intervalRef.current) {
            intervalRef.current = setInterval(async () => {
              try {
                await supabase.functions.invoke('assignment_update', {
                  body: {
                    assignment_id: assignmentId,
                    action: 'update_location',
                    location: newLocation
                  }
                });
              } catch (error) {
                console.error('Error updating location:', error);
              }
            }, 30000);
          }
        },
        (error) => {
          console.error('Location watching error:', error);
          setLocationError(`Location tracking error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        }
      );

      setWatchId(id);
    } catch (error) {
      console.error('Error starting location sharing:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to start location sharing');
      setSharing(false);
    }
  }, [assignmentId, getCurrentLocation, sharing]);

  // Stop location sharing
  const stopLocationSharing = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    
    setSharing(false);
  }, [watchId]);

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Set up real-time subscription for assignment updates
  useEffect(() => {
    if (!assignmentId) return;

    const channel = supabase
      .channel(`assignment:${assignmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assignments',
          filter: `id=eq.${assignmentId}`
        },
        (payload) => {
          const assignment = payload.new;
          
          // Parse GPS trail for latest locations
          const gpsTrail = assignment.gps_trail as GPSLocation[] || [];
          const latestLocation = gpsTrail[gpsTrail.length - 1];

          if (latestLocation && userLocation) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              latestLocation.lat,
              latestLocation.lng
            );

            // Estimate ETA based on distance and average speed
            const avgSpeedKmh = 30; // Average city speed
            const etaMinutes = Math.round((distance / avgSpeedKmh) * 60);

            setTrackingData({
              assignment_id: assignmentId,
              guard_location: latestLocation,
              client_location: userLocation,
              distance_km: distance,
              eta_minutes: etaMinutes,
              status: assignment.status
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assignmentId, userLocation, calculateDistance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationSharing();
    };
  }, [stopLocationSharing]);

  return {
    trackingData,
    userLocation,
    locationError,
    sharing,
    startLocationSharing,
    stopLocationSharing,
    getCurrentLocation
  };
};