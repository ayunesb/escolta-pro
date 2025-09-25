import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AssignmentTracker } from '@/components/assignment/AssignmentTracker';
import { supabase } from '@/integrations/supabase/client';
import HapticButton from '@/components/mobile/HapticButton';

interface AssignmentDetailPageProps {
  navigate: (path: string) => void;
  assignmentId: string;
}

interface BookingDetails {
  address: string;
  startTime: string;
  duration: number;
}

interface BookingSubrecord {
  pickup_address?: string;
  start_ts: string;
  end_ts: string;
  [key: string]: unknown;
}

function isBookingSubrecord(value: unknown): value is BookingSubrecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.start_ts === 'string' && typeof v.end_ts === 'string';
}

const AssignmentDetailPage = ({ navigate, assignmentId }: AssignmentDetailPageProps) => {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data: assignment, error } = await supabase
          .from('assignments')
          .select(`
            booking_id,
            bookings (
              pickup_address,
              start_ts,
              end_ts
            )
          `)
          .eq('id', assignmentId)
          .single();

        if (error) {
          console.error('Error fetching assignment details:', error);
          return;
        }

        if (assignment?.bookings && isBookingSubrecord(assignment.bookings)) {
          const booking = assignment.bookings;
          const startTime = new Date(booking.start_ts);
          const endTime = new Date(booking.end_ts);
          const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));

          setBookingDetails({
            address: booking.pickup_address || 'Address not available',
            startTime: booking.start_ts,
            duration: duration || 4
          });
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchBookingDetails();
    }
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="safe-top px-mobile py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <HapticButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/assignments')}
              hapticPattern="light"
              className="touch-target flex items-center justify-center p-2 -ml-2"
            >
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </HapticButton>
            <h2 className="text-mobile-lg font-semibold text-foreground">
              Assignment Details
            </h2>
            <div className="w-10" />
          </div>

          {/* Loading State */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <HapticButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/assignments')}
            hapticPattern="light"
            className="touch-target flex items-center justify-center p-2 -ml-2"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </HapticButton>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Assignment Details
          </h2>
          <div className="w-10" />
        </div>

        {/* Assignment Tracker */}
        <AssignmentTracker 
          assignmentId={assignmentId}
          bookingDetails={bookingDetails}
        />
      </div>
    </div>
  );
};

export default AssignmentDetailPage;