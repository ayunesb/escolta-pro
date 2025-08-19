import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Clock, User, Shield, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { t, getPreferredLanguage, formatMXN, Lang } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui/language-toggle';

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
  const [lang] = useState<Lang>(getPreferredLanguage());
  
  // MXN pricing in centavos (server will use actual DB rates)
  const hourly_rate_mxn_cents = 80000; // $800 MXN/hr
  const armed_hourly_surcharge_mxn_cents = 20000; // $200 MXN/hr
  const vehicle_hourly_rate_mxn_cents = 350000; // $3,500 MXN/hr
  const armored_hourly_surcharge_mxn_cents = 150000; // $1,500 MXN/hr

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

  // Calculate pricing based on MXN rates (in centavos)
  const hours = bookingData.duration;
  const base = hourly_rate_mxn_cents * hours;
  const armedFee = bookingData.armedRequired ? armed_hourly_surcharge_mxn_cents * hours : 0;
  const vehicleBase = bookingData.withVehicle ? vehicle_hourly_rate_mxn_cents * hours : 0;
  const armoredFee = (bookingData.withVehicle && bookingData.armoredLevel && bookingData.armoredLevel !== 'None') 
    ? armored_hourly_surcharge_mxn_cents * hours : 0;

  const subtotal = base + armedFee + vehicleBase + armoredFee;
  const serviceFee = Math.round(subtotal * 0.10);
  const total = subtotal + serviceFee;

  const handleConfirm = async () => {
    const isStubMode = new URLSearchParams(window.location.search).get('stub') === '1' || 
                       import.meta.env.VITE_STUB_API === 'true';
    
    setLoading(true);
    
    try {
      if (isStubMode) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(t('request_submitted', lang));
      } else {
        // Call actual Edge Function with new payload
        const { error, data: response } = await supabase.functions.invoke('bookings', {
          body: {
            location: bookingData.location,
            start: `${bookingData.date}T${bookingData.startTime}:00`,
            end: new Date(new Date(`${bookingData.date}T${bookingData.startTime}:00`).getTime() + bookingData.duration * 60 * 60 * 1000).toISOString(),
            duration_hours: bookingData.duration,
            protector_id: bookingData.protectorId,
            vehicle_id: null, // Will be assigned later
            armed: bookingData.armedRequired || false,
            with_vehicle: bookingData.withVehicle || false,
            armored_level: bookingData.armoredLevel || 'None'
          }
        });

        if (error) {
          console.error('Booking submission error:', error);
          toast.error(error.message || 'Failed to submit request. Please try again.');
          return;
        }
        
        toast.success(t('request_submitted', lang));
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
            {t('instant_quote', lang)}
          </h2>
          <LanguageToggle />
        </div>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-mobile-base">{t('booking_summary', lang)}</CardTitle>
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
                  {t('armed_surcharge', lang)}
                </Badge>
              )}
              {bookingData.withVehicle && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {t(bookingData.vehicleType?.toLowerCase() || 'suv', lang)}
                  {bookingData.armoredLevel !== 'None' && ` (${t(bookingData.armoredLevel?.toLowerCase()?.replace(/\s+/g, '_') || 'none', lang)})`}
                </Badge>
              )}
              {bookingData.protectorId && (
                <Badge variant="secondary">
                  {t('protector_base', lang)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-mobile-base">{t('price_breakdown', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-mobile-sm text-muted-foreground">
                {t('protector_base', lang)} ({hours}h × {formatMXN(hourly_rate_mxn_cents)})
              </span>
              <span className="text-mobile-sm font-medium">
                {formatMXN(base)}
              </span>
            </div>
            
            {bookingData.armedRequired && (
              <div className="flex justify-between">
                <span className="text-mobile-sm text-muted-foreground">
                  {t('armed_surcharge', lang)} ({hours}h × {formatMXN(armed_hourly_surcharge_mxn_cents)})
                </span>
                <span className="text-mobile-sm font-medium">
                  {formatMXN(armedFee)}
                </span>
              </div>
            )}
            
            {bookingData.withVehicle && vehicleBase > 0 && (
              <div className="flex justify-between">
                <span className="text-mobile-sm text-muted-foreground">
                  {t('vehicle_service', lang)} ({hours}h × {formatMXN(vehicle_hourly_rate_mxn_cents)})
                </span>
                <span className="text-mobile-sm font-medium">
                  {formatMXN(vehicleBase)}
                </span>
              </div>
            )}
            
            {bookingData.withVehicle && bookingData.armoredLevel !== 'None' && armoredFee > 0 && (
              <div className="flex justify-between">
                <span className="text-mobile-sm text-muted-foreground">
                  {t('armored_surcharge', lang)} ({hours}h × {formatMXN(armored_hourly_surcharge_mxn_cents)})
                </span>
                <span className="text-mobile-sm font-medium">
                  {formatMXN(armoredFee)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-mobile-sm text-muted-foreground">
                {t('service_fee_10', lang)}
              </span>
              <span className="text-mobile-sm font-medium">
                {formatMXN(serviceFee)}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-mobile-base font-semibold">{t('total', lang)}</span>
                <span className="text-mobile-base font-semibold text-accent">
                  {formatMXN(total)}
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
          {loading ? t('loading', lang) : `${t('confirm_request', lang)} - ${formatMXN(total)}`}
        </Button>
      </div>
    </div>
  );
};

export default QuotePage;