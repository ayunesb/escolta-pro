import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiveTracking } from '@/hooks/use-live-tracking';
import { MapPin, Navigation, Clock, Route, Play, Square, AlertTriangle } from 'lucide-react';
import HapticButton from '@/components/mobile/HapticButton';

interface LiveMapProps {
  assignmentId: string;
  userRole: 'client' | 'guard';
}

export const LiveMap = ({ assignmentId, userRole }: LiveMapProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const {
    trackingData,
    userLocation,
    locationError,
    sharing,
    startLocationSharing,
    stopLocationSharing
  } = useLiveTracking(assignmentId);

  // Initialize map (would integrate with Google Maps, Mapbox, etc.)
  useEffect(() => {
    // Mock map initialization
    if (mapRef.current && !mapLoaded) {
      setMapLoaded(true);
    }
  }, [mapLoaded]);

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const formatETA = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enroute': return 'bg-blue-100 text-blue-800';
      case 'arrived': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Live Tracking</span>
            {trackingData && (
              <Badge className={getStatusColor(trackingData.status)}>
                {trackingData.status.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trackingData?.distance_km && (
              <div className="flex items-center space-x-2">
                <Route className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-semibold">{formatDistance(trackingData.distance_km)}</p>
                </div>
              </div>
            )}
            
            {trackingData?.eta_minutes && (
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">ETA</p>
                  <p className="font-semibold">{formatETA(trackingData.eta_minutes)}</p>
                </div>
              </div>
            )}
            
            {userLocation && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Your Location</p>
                  <p className="font-semibold text-xs">
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={mapRef}
            className="w-full h-64 bg-muted flex items-center justify-center relative overflow-hidden"
          >
            {mapLoaded ? (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Live Map Integration</p>
                  {userRole === 'guard' && trackingData?.client_location && (
                    <div className="mt-4 space-y-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto animate-pulse"></div>
                      <p className="text-xs text-blue-600">Client Location</p>
                    </div>
                  )}
                  {userRole === 'client' && trackingData?.guard_location && (
                    <div className="mt-4 space-y-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full mx-auto animate-pulse"></div>
                      <p className="text-xs text-green-600">Guard Location</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-pulse">
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Navigation className={`h-5 w-5 ${sharing ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-medium">
                  {sharing ? 'Sharing Location' : 'Location Sharing Off'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sharing ? 'Your location is being shared in real-time' : 'Enable location sharing for live tracking'}
                </p>
              </div>
            </div>
            
            <HapticButton
              variant={sharing ? "destructive" : "default"}
              size="sm"
              onClick={sharing ? stopLocationSharing : startLocationSharing}
              hapticPattern="medium"
            >
              {sharing ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </HapticButton>
          </div>
          
          {locationError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">{locationError}</p>
              </div>
            </div>
          )}
          
          {userLocation && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-green-800">Location accurate to {userLocation.accuracy?.toFixed(0)}m</p>
                </div>
                {userLocation.speed && (
                  <p className="text-xs text-green-600">
                    {(userLocation.speed * 3.6).toFixed(1)} km/h
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};