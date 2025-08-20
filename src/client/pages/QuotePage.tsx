import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Clock, Shield, Car, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatMXN } from '@/utils/pricing';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { t, getPreferredLanguage, type Lang } from '@/lib/i18n';

interface QuotePageProps {
  navigate: (path: string) => void;
}

interface BookingData {
  location: string;
  date: string;
  startTime: string;
  duration: number;
  protectorId?: string;
  armedRequired: boolean;
  withVehicle: boolean;
  vehicleType?: string;
  armoredLevel?: string;
}

interface PricingCalculation {
  subtotal: number;
  serviceFee: number;
  total: number;
  breakdown: {
    base: number;
    armed: number;
    vehicle: number;
    armored: number;
  };
}

const QuotePage = ({ navigate }: QuotePageProps) => {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [pricing, setPricing] = useState<PricingCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState<Lang>('en');

  useEffect(() => {
    setCurrentLang(getPreferredLanguage());
    
    // Get booking data from sessionStorage
    const storedData = sessionStorage.getItem('bookingData');
    if (!storedData) {
      navigate('/book');
      return;
    }
    
    const data: BookingData = JSON.parse(storedData);
    setBookingData(data);
    
    // Calculate pricing (using MXN rates)
    calculatePricing(data);
  }, [navigate]);

  const calculatePricing = (data: BookingData) => {
    // Base rates in centavos (cents)
    const baseRateCents = 80000; // $800 MXN per hour
    const armedSurchargeCents = 20000; // $200 MXN per hour
    const vehicleRateCents = 35000; // $350 MXN per hour  
    const armoredSurchargeCents = 15000; // $150 MXN per hour

    const hours = data.duration;
    
    // Calculate components
    const baseTotal = baseRateCents * hours;
    const armedTotal = data.armedRequired ? armedSurchargeCents * hours : 0;
    const vehicleTotal = data.withVehicle ? vehicleRateCents * hours : 0;
    const armoredTotal = (data.withVehicle && data.armoredLevel !== 'None') ? armoredSurchargeCents * hours : 0;
    
    const subtotal = baseTotal + armedTotal + vehicleTotal + armoredTotal;
    const serviceFee = Math.round(subtotal * 0.10); // 10% service fee
    const total = subtotal + serviceFee;
    
    setPricing({
      subtotal,
      serviceFee,
      total,
      breakdown: {
        base: baseTotal,
        armed: armedTotal,
        vehicle: vehicleTotal,
        armored: armoredTotal
      }
    });
  };

  const handleConfirm = async () => {
    if (!bookingData || !pricing) return;
    
    setLoading(true);
    
    try {
      // Create booking via edge function
      const { data, error } = await supabase.functions.invoke('bookings', {
        body: {
          pickup_address: bookingData.location,
          start_ts: new Date(`${bookingData.date}T${bookingData.startTime}`).toISOString(),
          duration_hours: bookingData.duration,
          armed_required: bookingData.armedRequired,
          vehicle_required: bookingData.withVehicle,
          vehicle_type: bookingData.vehicleType,
          notes: `Armor level: ${bookingData.armoredLevel || 'None'}`,
          subtotal_mxn_cents: pricing.subtotal,
          service_fee_mxn_cents: pricing.serviceFee,
          total_mxn_cents: pricing.total
        }
      });

      if (error) {
        throw error;
      }

      // Clear booking data and show success
      sessionStorage.removeItem('bookingData');
      toast({
        title: t('request_submitted', currentLang),
        description: "We'll match you with available protectors shortly."
      });
      
      navigate('/bookings');
    } catch (error: any) {
      console.error('Booking creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create booking',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData || !pricing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return {
      date: dateObj.toLocaleDateString('es-MX', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: dateObj.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const { date, time } = formatDateTime(bookingData.date, bookingData.startTime);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border safe-top">
        <button
          onClick={() => navigate('/book')}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-mobile-lg font-semibold">
          {t('instant_quote', currentLang)}
        </h1>
        <LanguageToggle />
      </div>

      <div className="px-mobile py-6 space-y-6 pb-32">
        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-mobile-lg">
              {t('booking_summary', currentLang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-mobile-base font-medium">{bookingData.location}</p>
                <p className="text-mobile-sm text-muted-foreground">Pickup location</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-mobile-base font-medium">{date} at {time}</p>
                <p className="text-mobile-sm text-muted-foreground">
                  {bookingData.duration} hour{bookingData.duration > 1 ? 's' : ''} service
                </p>
              </div>
            </div>

            {bookingData.armedRequired && (
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-amber-500" />
                <span className="text-mobile-base text-amber-600 font-medium">Armed protection</span>
              </div>
            )}

            {bookingData.withVehicle && (
              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-mobile-base text-blue-600 font-medium">
                    {bookingData.vehicleType} vehicle
                  </p>
                  {bookingData.armoredLevel !== 'None' && (
                    <p className="text-mobile-sm text-muted-foreground">
                      Armor: {bookingData.armoredLevel}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-mobile-lg">
              {t('price_breakdown', currentLang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-mobile-base">{t('protector_base', currentLang)} × {bookingData.duration}h</span>
              <span className="font-semibold">{formatMXN(pricing.breakdown.base)}</span>
            </div>
            
            {pricing.breakdown.armed > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-mobile-base">{t('armed_surcharge', currentLang)} × {bookingData.duration}h</span>
                <span className="font-semibold">{formatMXN(pricing.breakdown.armed)}</span>
              </div>
            )}
            
            {pricing.breakdown.vehicle > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-mobile-base">{t('vehicle_service', currentLang)} × {bookingData.duration}h</span>
                <span className="font-semibold">{formatMXN(pricing.breakdown.vehicle)}</span>
              </div>
            )}
            
            {pricing.breakdown.armored > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-mobile-base">{t('armored_surcharge', currentLang)} × {bookingData.duration}h</span>
                <span className="font-semibold">{formatMXN(pricing.breakdown.armored)}</span>
              </div>
            )}
            
            <hr className="border-border" />
            
            <div className="flex justify-between items-center">
              <span className="text-mobile-base">{t('subtotal', currentLang)}</span>
              <span className="font-semibold">{formatMXN(pricing.subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-mobile-base">{t('service_fee_10', currentLang)}</span>
              <span className="font-semibold">{formatMXN(pricing.serviceFee)}</span>
            </div>
            
            <hr className="border-border" />
            
            <div className="flex justify-between items-center text-mobile-lg">
              <span className="font-bold">{t('total', currentLang)}</span>
              <span className="font-bold text-accent">{formatMXN(pricing.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-foreground"></div>
              Processing...
            </div>
          ) : (
            `${t('confirm_request', currentLang)} • ${formatMXN(pricing.total)}`
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuotePage;