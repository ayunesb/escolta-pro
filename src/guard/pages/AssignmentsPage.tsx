import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return;
      
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
        
        if (error) {
          console.error('Error fetching assignments:', error);
        } else {
          setAssignments(data || []);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'offered':
        return 'bg-warning text-black';
      case 'accepted':
        return 'bg-success text-white';
      case 'in_progress':
        return 'bg-accent text-white';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
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
              <Card key={assignment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-mobile-base">
                      Assignment #{assignment.id.slice(-8)}
                    </CardTitle>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status.replace('_', ' ').toUpperCase()}
                    </Badge>
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

                  {/* Status-specific actions */}
                  {assignment.status === 'offered' && (
                    <div className="pt-3 border-t">
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                        >
                          Decline
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-accent hover:bg-accent/90"
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  )}

                  {assignment.status === 'accepted' && (
                    <div className="pt-3 border-t">
                      <Button 
                        size="sm" 
                        className="w-full bg-accent hover:bg-accent/90"
                      >
                        Start Assignment
                      </Button>
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