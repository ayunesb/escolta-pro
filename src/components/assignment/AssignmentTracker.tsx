import { useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import HapticButton from '@/components/mobile/HapticButton';
import { useAssignmentTracking } from '@/hooks/use-assignment-tracking';
import { MapPin, Clock, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignmentTrackerProps {
  assignmentId: string;
  bookingDetails?: {
    address: string;
    startTime: string;
    duration: number;
  };
}

export const AssignmentTracker = ({ assignmentId, bookingDetails }: AssignmentTrackerProps) => {
  const { 
    assignment, 
    location, 
    isTracking, 
    updateStatus, 
    startLocationTracking 
  } = useAssignmentTracking(assignmentId);

  const beginTracking = useCallback(() => {
    if (assignment?.status === 'accepted' || assignment?.status === 'in_progress') {
      return startLocationTracking();
    }
    return undefined;
  }, [assignment?.status, startLocationTracking]);

  useEffect(() => {
    const cleanup = beginTracking();
    return cleanup;
  }, [beginTracking]);

  if (!assignment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading assignment...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'offered':
        return { 
          color: 'bg-info text-info-foreground', 
          icon: Clock, 
          label: 'Assignment Offered' 
        };
      case 'accepted':
        return { 
          color: 'bg-warning text-warning-foreground', 
          icon: Navigation, 
          label: 'En Route' 
        };
      case 'in_progress':
        return { 
          color: 'bg-accent text-accent-foreground', 
          icon: Navigation, 
          label: 'In Progress' 
        };
      case 'on_site':
        return { 
          color: 'bg-success text-success-foreground', 
          icon: MapPin, 
          label: 'On Site' 
        };
      case 'completed':
        return { 
          color: 'bg-success text-success-foreground', 
          icon: CheckCircle, 
          label: 'Completed' 
        };
      default:
        return { 
          color: 'bg-muted text-muted-foreground', 
          icon: AlertCircle, 
          label: 'Unknown' 
        };
    }
  };

  const statusConfig = getStatusConfig(assignment.status);
  const StatusIcon = statusConfig.icon;

  const getNextAction = () => {
    switch (assignment.status) {
      case 'offered':
        return { action: () => updateStatus('accepted'), label: 'Accept Assignment' };
      case 'accepted':
        return { action: () => updateStatus('in_progress'), label: 'Start Journey' };
      case 'in_progress':
        return { action: () => updateStatus('on_site'), label: 'Arrived On Site' };
      case 'on_site':
        return { action: () => updateStatus('completed'), label: 'Complete Assignment' };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className="w-5 h-5" />
              Assignment Status
            </CardTitle>
            <Badge className={cn("px-3 py-1", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {bookingDetails && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{bookingDetails.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {new Date(bookingDetails.startTime).toLocaleTimeString()} 
                  ({bookingDetails.duration}h duration)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Tracking */}
      {isTracking && location && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-success" />
              Live Location
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm space-y-1">
              <div>Lat: {location.lat.toFixed(6)}</div>
              <div>Lng: {location.lng.toFixed(6)}</div>
              <Badge variant="outline" className="mt-2">
                GPS Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {nextAction && (
        <HapticButton 
          onClick={nextAction.action}
          className="w-full h-12"
          size="lg"
        >
          {nextAction.label}
        </HapticButton>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {assignment.checkInTs && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>Accepted: {new Date(assignment.checkInTs).toLocaleTimeString()}</span>
              </div>
            )}
            {assignment.inProgressTs && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>Started: {new Date(assignment.inProgressTs).toLocaleTimeString()}</span>
              </div>
            )}
            {assignment.onSiteTs && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span>On Site: {new Date(assignment.onSiteTs).toLocaleTimeString()}</span>
              </div>
            )}
            {assignment.checkOutTs && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>Completed: {new Date(assignment.checkOutTs).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};