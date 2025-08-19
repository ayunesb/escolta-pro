import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Clock, User, Shield, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuotePageProps {
  navigate: (path: string) => void;
}

interface BookingData {
  location: string;
  date: string;
  startTime: string;
  duration: number;
  protectorId?: string;
  armedRequired?: boolean;
  withVehicle?: boolean;
  vehicleType?: string;
  armoredLevel?: string;
}

const QuotePage = ({ navigate }: QuotePageProps) => {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [baseRate] = useState(150); // MXN per hour base rate

  useEffect(() => {
    const data = sessionStorage.getItem('bookingData');
    if (!data) {
      navigate('/book');
      return;
    }
    
    try {
      setBookingData(JSON.parse(data));
    } catch (error) {
      console.error('Error parsing booking data:', error);
      navigate('/book');
    }
  }, [navigate]);

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Calculate pricing based on options
  const baseAmount = baseRate * bookingData.duration;
  const armedSurcharge = bookingData.armedRequired ? Math.round(baseAmount * 0.3) : 0;
  const vehicleSurcharge = bookingData.withVehicle ? calculateVehicleSurcharge(bookingData.vehicleType, bookingData.armoredLevel, bookingData.duration) : 0;
  const subtotal = baseAmount + armedSurcharge + vehicleSurcharge;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  function calculateVehicleSurcharge(vehicleType?: string, armoredLevel?: string, duration?: number) {
    if (!vehicleType || !duration) return 0;
    
    let baseVehicleRate = 50; // Base vehicle rate per hour
    
    // Vehicle type multipliers
    switch (vehicleType) {
      case 'SUV': baseVehicleRate *= 1.5; break;
      case 'Van': baseVehicleRate *= 2; break;
      case 'Bike': baseVehicleRate *= 0.7; break;
      default: break; // Sedan stays at base rate
    }
    
    // Armored level multipliers
    switch (armoredLevel) {
      case 'NIJ II': baseVehicleRate *= 2; break;
      case 'NIJ IIIA': baseVehicleRate *= 2.5; break;
      case 'NIJ III': baseVehicleRate *= 3; break;
      case 'NIJ IV': baseVehicleRate *= 4; break;
      default: break; // None stays at base rate
    }
    
    return Math.round(baseVehicleRate * duration);
  }

  const handleConfirm = async () => {
    const isStubMode = new URLSearchParams(window.location.search).get('stub') === '1' || 
                       import.meta.env.VITE_STUB_API === 'true';
    
    setLoading(true);
    
    try {
      if (isStubMode) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("Request submitted. We'll contact you shortly.");
      } else {
        // Call actual Edge Function
        const { error } = await supabase.functions.invoke('bookings', {
          body: {
            location: bookingData.location,
            start: `${bookingData.date}T${bookingData.startTime}:00`,
            end: new Date(new Date(`${bookingData.date}T${bookingData.startTime}:00`).getTime() + bookingData.duration * 60 * 60 * 1000).toISOString(),
            duration_hours: bookingData.duration,
            pid: bookingData.protectorId
          }
        });

        if (error) {
          toast.error('Failed to submit request. Please try again.');
          return;
        }
        
        toast.success("Request submitted. We'll contact you shortly.");
      }
      
      // Clear booking data and navigate to bookings
      sessionStorage.removeItem('bookingData');
      navigate('/bookings');
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/book')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Quote
          </h2>
          <div className="w-6" />
        </div>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-mobile-base">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-mobile-sm">{bookingData.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-mobile-sm">
                {new Date(bookingData.date).toLocaleDateString()} at {bookingData.startTime}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-mobile-sm">{bookingData.duration} hours</span>
            </div>
            
            {/* Service Options */}
            <div className="flex flex-wrap gap-2 mt-2">
              {bookingData.armedRequired && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Armed Protection
                </Badge>
              )}
              {bookingData.withVehicle && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {bookingData.vehicleType}
                  {bookingData.armoredLevel !== 'None' && ` (${bookingData.armoredLevel})`}
                </Badge>
              )}
              {bookingData.protectorId && (
                <Badge variant="secondary">
                  Specific Protector Selected
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-mobile-base">Price Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-mobile-sm text-muted-foreground">
                Base rate ({bookingData.duration}h × $MXN {baseRate})
              </span>
              <span className="text-mobile-sm font-medium">
                $MXN {baseAmount.toLocaleString()}
              </span>
            </div>
            
            {bookingData.armedRequired && (
              <div className="flex justify-between">
                <span className="text-mobile-sm text-muted-foreground">
                  Armed protection surcharge
                </span>
                <span className="text-mobile-sm font-medium">
                  $MXN {armedSurcharge.toLocaleString()}
                </span>
              </div>
            )}
            
            {bookingData.withVehicle && vehicleSurcharge > 0 && (
              <div className="flex justify-between">
                <span className="text-mobile-sm text-muted-foreground">
                  Vehicle service ({bookingData.vehicleType}
                  {bookingData.armoredLevel !== 'None' && `, ${bookingData.armoredLevel}`})
                </span>
                <span className="text-mobile-sm font-medium">
                  $MXN {vehicleSurcharge.toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-mobile-sm text-muted-foreground">
                Service fee (10%)
              </span>
              <span className="text-mobile-sm font-medium">
                $MXN {serviceFee.toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-mobile-base font-semibold">Total</span>
                <span className="text-mobile-base font-semibold text-accent">
                  $MXN {total.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-xs text-muted-foreground">
            By confirming, you agree to our terms of service. Final pricing may vary based on specific requirements and availability.
          </p>
        </div>

        {/* Confirm Button */}
        <Button 
          onClick={handleConfirm}
          disabled={loading}
          className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
        >
          {loading ? 'Submitting...' : `Confirm Request - $MXN ${total.toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
};

export default QuotePage;