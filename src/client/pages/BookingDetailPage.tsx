import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessagesTab } from '@/components/messaging/MessagesTab';
import { LiveMap } from '@/components/tracking/LiveMap';
import { EmergencyPanel } from '@/components/emergency/EmergencyPanel';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Shield, 
  Car, 
  Clock,
  Phone,
  Video,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { mxn } from '@/utils/money';
import BottomNav from '@/components/mobile/BottomNav';

interface BookingDetailPageProps {
  navigate: (path: string) => void;
  bookingId: string;
}

interface BookingDetail {
  id: string;
  status: string;
  start_ts: string;
  end_ts: string | null;
  city: string | null;
  pickup_address: string | null;
  total_mxn_cents: number | null;
  protectors: number;
  armed_required: boolean;
  vehicle_required: boolean;
  vehicle_type: string | null;
  notes: string | null;
  assigned_user_id: string | null;
  created_at: string;
  // Additional properties from Supabase bookings table
  assigned_company_id: string | null;
  client_id: string;
  currency: string | null;
  dest_lat: number | null;
  dest_lng: number | null;
  dress_code: string | null;
  min_hours: number | null;
  origin_lat: number | null;
  origin_lng: number | null;
  protectees: number | null;
  quote_amount: number | null;
  service_fee_mxn_cents: number | null;
  subtotal_mxn_cents: number | null;
  surge_mult: number | null;
  tier: string | null;
  updated_at: string | null;
  vehicles: number | null;
  assignment?: {
    id: string;
    status: string;
    guard: {
      id: string;
      photo_url: string | null;
      rating: number;
      city: string | null;
      user: {
        first_name: string | null;
        last_name: string | null;
        phone_e164: string | null;
      };
    } | null;
  };
}

export const BookingDetailPage = ({ navigate, bookingId }: BookingDetailPageProps) => {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const { toast } = useToast();

  useEffect(() => {
    fetchBookingDetails();
    
    // Set up real-time subscription for booking updates
    const channel = supabase
      .channel(`booking:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload: any) => {
          const updatedBooking = payload.new as Partial<BookingDetail> | undefined;

          setBooking(prev => prev ? { ...prev, ...(updatedBooking || {}) } : null);
          
          // Show toast for status changes
          if (booking && updatedBooking.status !== booking.status) {
            const statusMessages = {
              assigned: 'A guard has been assigned to your booking!',
              in_progress: 'Your security service is now in progress',
              completed: 'Your security service has been completed',
              cancelled: 'Your booking has been cancelled',
            };
            
            const message = statusMessages[String(updatedBooking?.status) as keyof typeof statusMessages];
            if (message) {
              toast({
                title: 'Booking Update',
                description: message,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, booking?.status]);

  const fetchBookingDetails = async () => {
    try {
      // First get the booking with assignments
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          assignments(
            id,
            status,
            guard_id
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

  let bookingWithGuard: BookingDetail | null = bookingData as BookingDetail | null;

      // If there's an assignment, get guard details separately
      if (bookingData.assignments && bookingData.assignments.length > 0) {
        const assignment = bookingData.assignments[0];
        
        // Get guard details
        const { data: guardData, error: guardError } = await supabase
          .from('guards')
          .select(`
            id,
            photo_url,
            rating,
            city,
            user_id
          `)
          .eq('id', assignment.guard_id)
          .single();

          if (!guardError && guardData) {
          // Get user profile for the guard
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone_e164')
            .eq('id', guardData.user_id)
            .single();

          // Construct the proper data structure directly
          // Build booking object without the original `assignments` array
          // Copy bookingData excluding `assignments`
          const bookingRest = JSON.parse(JSON.stringify(bookingData));
          delete bookingRest.assignments;
          bookingWithGuard = {
            ...bookingRest,
            assignment: {
              id: assignment.id,
              status: assignment.status,
              guard: {
                id: guardData.id,
                photo_url: guardData.photo_url,
                rating: guardData.rating,
                city: guardData.city,
                user: profileData || {
                  first_name: null,
                  last_name: null,
                  phone_e164: null
                }
              }
            }
          } as BookingDetail;
          } else {
          // No guard data, just include assignment without guard
            const bookingRest = JSON.parse(JSON.stringify(bookingData));
            delete bookingRest.assignments;
            bookingWithGuard = {
              ...bookingRest,
              assignment: {
                id: assignment.id,
                status: assignment.status,
                guard: null
              }
            } as BookingDetail;
        }
      } else {
        // No assignment
        const bookingRest = JSON.parse(JSON.stringify(bookingData));
        delete bookingRest.assignments;
        bookingWithGuard = {
          ...bookingRest,
          assignment: undefined
        } as BookingDetail;
      }
      setBooking(bookingWithGuard);
    } catch (error) {
      toast({
        title: 'Error fetching booking details',
        description: String(error),
        variant: 'destructive'
      });
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      });
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matching': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'emergency': return 'bg-red-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVideoCall = () => {
    // This would integrate with a video calling service
    toast({
      title: "Video Call",
      description: "Video calling feature coming soon",
    });
  };

  const handleVoiceCall = () => {
    if (booking?.assignment?.guard?.user.phone_e164) {
      window.location.href = `tel:${booking.assignment.guard.user.phone_e164}`;
    } else {
      toast({
        title: "Phone Number Not Available",
        description: "Guard's phone number is not available",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
        <BottomNav currentPath="/bookings" navigate={navigate} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium mb-2">Booking Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The booking you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => navigate('/bookings')}>
                Back to Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav currentPath="/bookings" navigate={navigate} />
      </div>
    );
  }

  const guardName = booking.assignment?.guard?.user
    ? `${booking.assignment.guard.user.first_name || ''} ${booking.assignment.guard.user.last_name || ''}`.trim()
    : 'Guard';

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/bookings')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">#{booking.id.slice(0, 8)}</p>
          </div>
          
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages">
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Booking Information */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {format(new Date(booking.start_ts), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.start_ts), 'h:mm a')}
                        {booking.end_ts && ` - ${format(new Date(booking.end_ts), 'h:mm a')}`}
                      </p>
                    </div>
                  </div>

                  {booking.pickup_address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{booking.city}</p>
                        <p className="text-sm text-muted-foreground">{booking.pickup_address}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Team Size</p>
                      <p className="font-medium">{booking.protectors} protector{booking.protectors > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {booking.total_mxn_cents && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="font-medium text-primary">{mxn(booking.total_mxn_cents)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {booking.armed_required && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Armed Protection
                    </Badge>
                  )}
                  {booking.vehicle_required && (
                    <Badge variant="outline">
                      <Car className="h-3 w-3 mr-1" />
                      {booking.vehicle_type || 'Vehicle Required'}
                    </Badge>
                  )}
                </div>

                {booking.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
                    <p className="text-sm bg-muted p-3 rounded">{booking.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Guard */}
            {booking.assignment?.guard && (
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Guard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      {booking.assignment.guard.photo_url ? (
                        <img
                          src={booking.assignment.guard.photo_url}
                          alt="Guard"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Shield className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{guardName}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>★ {booking.assignment.guard.rating.toFixed(1)}</span>
                        {booking.assignment.guard.city && (
                          <>
                            <span>•</span>
                            <span>{booking.assignment.guard.city}</span>
                          </>
                        )}
                      </div>
                      <Badge className={getStatusColor(booking.assignment.status)}>
                        {booking.assignment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleVoiceCall}>
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleVideoCall}>
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>


          <TabsContent value="tracking">
            {booking.assignment?.id ? (
              <LiveMap
                assignmentId={booking.assignment.id}
                userRole="client"
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Tracking Not Available</h3>
                  <p className="text-muted-foreground text-center">
                    Live tracking will be available once a guard is assigned to your booking.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencyPanel
              bookingId={booking.id}
              assignmentId={booking.assignment?.id}
            />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesTab bookingId={bookingId} />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav currentPath="/bookings" navigate={navigate} />
    </div>
  );
};