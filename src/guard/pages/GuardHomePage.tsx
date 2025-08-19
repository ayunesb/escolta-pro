import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Calendar, MapPin, User, Settings, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';

interface Assignment {
  id: string;
  booking_id: string;
  status: string;
  check_in_ts?: string;
  check_out_ts?: string;
  on_site_ts?: string;
  bookings?: {
    pickup_address?: string;
    start_ts?: string;
    end_ts?: string;
    client_id: string;
  };
}

interface GuardHomePageProps {
  navigate: (path: string) => void;
}

const GuardHomePage = ({ navigate }: GuardHomePageProps) => {
  const { user, hasRole } = useAuth();
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
          .order('created_at', { ascending: false })
          .limit(5);
        
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
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-mobile-xl font-semibold text-foreground">
              Welcome Back
            </h1>
            <p className="text-mobile-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <button
            onClick={() => navigate('/account')}
            className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
            <CardContent 
              className="p-4 text-center"
              onClick={() => navigate('/assignments')}
            >
              <Calendar className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="text-mobile-sm font-medium text-foreground">
                Assignments
              </h3>
            </CardContent>
          </Card>

          {hasRole('freelancer') && (
            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent 
                className="p-4 text-center"
                onClick={() => navigate('/apply')}
              >
                <User className="h-8 w-8 text-accent mx-auto mb-2" />
                <h3 className="text-mobile-sm font-medium text-foreground">
                  Apply
                </h3>
              </CardContent>
            </Card>
          )}

          {hasRole('company_admin') && (
            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent 
                className="p-4 text-center"
                onClick={() => navigate('/company')}
              >
                <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                <h3 className="text-mobile-sm font-medium text-foreground">
                  Company
                </h3>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Assignments */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-mobile-lg font-semibold text-foreground">
              Recent Assignments
            </h2>
            {assignments.length > 0 && (
              <button
                onClick={() => navigate('/assignments')}
                className="text-accent hover:underline text-mobile-sm"
              >
                View All
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-mobile-base font-medium text-foreground mb-2">
                  No assignments yet
                </h3>
                <p className="text-mobile-sm text-muted-foreground">
                  Your assignments will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        #{assignment.id.slice(-8)}
                      </span>
                    </div>
                    
                    {assignment.bookings?.pickup_address && (
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-mobile-sm text-foreground">
                          {assignment.bookings.pickup_address}
                        </span>
                      </div>
                    )}
                    
                    {assignment.bookings?.start_ts && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <GuardBottomNav currentPath="/home" navigate={navigate} />
    </div>
  );
};

export default GuardHomePage;