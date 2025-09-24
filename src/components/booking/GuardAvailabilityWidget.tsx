import { useState, useEffect } from 'react';
import { Shield, Star, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { formatMXN } from '@/utils/pricing';

interface Guard {
  id: string;
  photo_url?: string;
  rating: number;
  city?: string;
  hourly_rate_mxn_cents?: number;
  armed_hourly_surcharge_mxn_cents?: number;
  availability_status?: string;
  skills?: any;
}

interface GuardAvailabilityWidgetProps {
  selectedGuardId?: string;
  onGuardSelect?: (guardId: string) => void;
  location?: string;
  dateTime?: string;
  armedRequired?: boolean;
}

const GuardAvailabilityWidget = ({
  selectedGuardId,
  onGuardSelect,
  location,
  dateTime,
  armedRequired
}: GuardAvailabilityWidgetProps) => {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableGuards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, dateTime, armedRequired]);

  const fetchAvailableGuards = async () => {
    setLoading(true);
    try {
      // Get available guards from public function
      const { data, error } = await supabase.rpc('get_public_guards');
      if (error) throw error;

      // Filter guards based on requirements
      let filteredGuards = (data || []) as Guard[];
      
      // Filter by armed requirement
      if (armedRequired) {
        filteredGuards = filteredGuards.filter(guard => 
          guard.skills?.armed === true
        );
      }

      // Filter by availability status
      filteredGuards = filteredGuards.filter(guard => 
        guard.availability_status === 'online' || guard.availability_status === 'available'
      );

      // Sort by rating and price
      filteredGuards.sort((a, b) => {
        // First by rating (descending)
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // Then by price (ascending)
        const priceA = a.hourly_rate_mxn_cents || 0;
        const priceB = b.hourly_rate_mxn_cents || 0;
        return priceA - priceB;
      });

      setGuards(filteredGuards);
    } catch (error) {
      console.error('Error fetching guards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Finding Available Guards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (guards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            No Guards Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No guards are currently available for your selected criteria. 
            Try adjusting your requirements or schedule.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Available Guards ({guards.length})
        </CardTitle>
        {armedRequired && (
          <Badge variant="outline" className="w-fit">
            Armed Protection Required
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {guards.slice(0, 5).map((guard) => (
            <div
              key={guard.id}
              className={`p-4 rounded-lg border transition-colors ${
                selectedGuardId === guard.id
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {guard.photo_url ? (
                      // using an img tag inside Avatar to avoid AvatarImage import
                      <img src={guard.photo_url} alt="Guard profile photo" className="w-full h-full object-cover rounded" />
                    ) : (
                      <AvatarFallback>
                        <Shield className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {guard.rating.toFixed(1)}
                        </span>
                      </div>
                      
                      {guard.city && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{guard.city}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Available Now
                      </Badge>
                      
                      {guard.skills?.armed && (
                        <Badge variant="outline" className="text-xs text-amber-600">
                          Armed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {guard.hourly_rate_mxn_cents && (
                    <div className="text-lg font-bold text-accent">
                      {formatMXN(guard.hourly_rate_mxn_cents)}/hr
                    </div>
                  )}
                  
                  {selectedGuardId === guard.id ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                      <CheckCircle className="h-4 w-4" />
                      Selected
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGuardSelect?.(guard.id)}
                      className="mt-1"
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {guards.length > 5 && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              +{guards.length - 5} more guards available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuardAvailabilityWidget;