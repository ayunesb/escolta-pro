import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeAssignments } from '@/hooks/use-real-time';
import HapticButton from '@/components/mobile/HapticButton';

interface Assignment {
  id: string;
  booking_id: string;
  status: string;
  check_in_ts?: string;
  check_out_ts?: string;
  on_site_ts?: string;
  in_progress_ts?: string;
  bookings?: {
    pickup_address?: string;
    start_ts?: string;
    end_ts?: string;
    client_id: string;
  };
}

interface AssignmentsPageProps {
  navigate: (path: string) => void;
}

const AssignmentsPage = ({ navigate }: AssignmentsPageProps) => {
  const { user } = useAuth();
  
  // Use real-time assignments hook instead of local state
  const { assignments, loading } = useRealTimeAssignments();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'offered':
        return 'bg-warning text-warning-foreground';
      case 'accepted':
        return 'bg-success text-success-foreground';
      case 'in_progress':
        return 'bg-accent text-accent-foreground';
      case 'on_site':
        return 'bg-info text-info-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleAssignmentClick = (assignmentId: string) => {
    navigate(`/assignment/${assignmentId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/home')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Assignments
          </h2>
          <div className="w-6" />
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-mobile-base font-medium text-foreground mb-2">
              No assignments yet
            </h3>
            <p className="text-mobile-sm text-muted-foreground">
              Your assignments will appear here when available
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card 
                key={assignment.id} 
                className="cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => handleAssignmentClick(assignment.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-mobile-base">
                      Assignment #{assignment.id.slice(-8)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignment.bookings?.pickup_address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-mobile-sm text-foreground">
                        {assignment.bookings.pickup_address}
                      </span>
                    </div>
                  )}
                  
                  {assignment.bookings?.start_ts && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-mobile-sm text-foreground">
                        {new Date(assignment.bookings.start_ts).toLocaleDateString()} at{' '}
                        {new Date(assignment.bookings.start_ts).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  )}

                  {assignment.bookings?.end_ts && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-mobile-sm text-foreground">
                        Duration: {Math.round(
                          (new Date(assignment.bookings.end_ts).getTime() - 
                           new Date(assignment.bookings.start_ts!).getTime()) / (1000 * 60 * 60)
                        )}h
                      </span>
                    </div>
                  )}

                  {/* Quick Status Indicator */}
                  {(assignment.status === 'offered' || assignment.status === 'accepted') && (
                    <div className="pt-3 border-t">
                      <div className="text-center">
                        <span className="text-mobile-sm text-muted-foreground">
                          {assignment.status === 'offered' ? 'Tap to respond' : 'Tap to manage'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsPage;