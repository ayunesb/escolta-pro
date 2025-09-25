import { Star, MapPin, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mxn } from '@/utils/money';

interface Guard {
  id: string;
  photo_url: string | null;
  rating: number;
  city: string | null;
  hourly_rate_mxn_cents: number;
  armed_hourly_surcharge_mxn_cents: number;
  dress_codes: string[] | null;
  distance?: number;
  availability_status?: string;
}

interface BookingMatchCardProps {
  guard: Guard;
  isArmed: boolean;
  hours: number;
  onSelect: (guardId: string) => void;
  isSelected: boolean;
}

export const BookingMatchCard = ({ 
  guard, 
  isArmed, 
  hours, 
  onSelect, 
  isSelected 
}: BookingMatchCardProps) => {
  const baseRate = guard.hourly_rate_mxn_cents;
  const armedSurcharge = isArmed ? guard.armed_hourly_surcharge_mxn_cents : 0;
  const totalHourlyRate = baseRate + armedSurcharge;
  const totalCost = totalHourlyRate * hours;

  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
      isSelected ? 'ring-2 ring-primary shadow-lg' : ''
    }`} onClick={() => onSelect(guard.id)}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={guard.photo_url || ''} alt="Guard" />
            <AvatarFallback className="bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{guard.rating.toFixed(1)}</span>
                </div>
                {guard.availability_status === 'available' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Available Now
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {mxn(totalHourlyRate)}
                  <span className="text-sm text-muted-foreground">/hr</span>
                </div>
                {isArmed && (
                  <div className="text-xs text-muted-foreground">
                    +{mxn(guard.armed_hourly_surcharge_mxn_cents)} armed
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              {guard.city && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{guard.city}</span>
                </div>
              )}
              {guard.distance && (
                <div className="flex items-center space-x-1">
                  <span>{guard.distance.toFixed(1)} km away</span>
                </div>
              )}
            </div>
            
            {guard.dress_codes && guard.dress_codes.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {guard.dress_codes.slice(0, 3).map((code, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {code}
                  </Badge>
                ))}
                {guard.dress_codes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{guard.dress_codes.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Total for {hours}h: </span>
                <span className="font-semibold text-primary">{mxn(totalCost)}</span>
              </div>
              <Button 
                size="sm" 
                variant={isSelected ? "default" : "outline"}
                className="ml-2"
              >
                {isSelected ? 'Selected' : 'Select'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};