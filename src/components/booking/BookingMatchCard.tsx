import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import HapticButton from '@/components/mobile/HapticButton';
import { MapPin, Star, Shield, Car, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Guard {
  id: string;
  name: string;
  photoUrl?: string;
  rating: number;
  distance: number;
  skills: string[];
  armed: boolean;
  hasVehicle: boolean;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'offline';
}

interface BookingMatchCardProps {
  guard: Guard;
  matchScore: number;
  onAssign: (guardId: string) => void;
  isAssigning?: boolean;
}

export const BookingMatchCard = ({ 
  guard, 
  matchScore, 
  onAssign, 
  isAssigning = false 
}: BookingMatchCardProps) => {
  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success text-success-foreground';
      case 'busy': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {guard.photoUrl ? (
                  <img 
                    src={guard.photoUrl} 
                    alt={guard.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <Badge 
                className={cn(
                  "absolute -bottom-1 -right-1 px-1.5 py-0.5 text-xs",
                  getAvailabilityColor(guard.availability)
                )}
              >
                {guard.availability}
              </Badge>
            </div>
            
            <div>
              <h3 className="font-semibold">{guard.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span>{guard.rating.toFixed(1)}</span>
                <MapPin className="w-4 h-4 ml-1" />
                <span>{guard.distance.toFixed(1)}km</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={cn("text-2xl font-bold", getMatchScoreColor(matchScore))}>
              {matchScore}%
            </div>
            <div className="text-xs text-muted-foreground">match</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Skills & Capabilities */}
          <div className="flex flex-wrap gap-1">
            {guard.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {guard.armed && (
              <Badge variant="default" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Armed
              </Badge>
            )}
            {guard.hasVehicle && (
              <Badge variant="outline" className="text-xs">
                <Car className="w-3 h-3 mr-1" />
                Vehicle
              </Badge>
            )}
          </div>

          {/* Rate & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">${guard.hourlyRate}/hr</span>
            </div>

            <HapticButton
              onClick={() => onAssign(guard.id)}
              disabled={isAssigning || guard.availability !== 'available'}
              className="h-9 px-4"
            >
              {isAssigning ? 'Assigning...' : 'Assign'}
            </HapticButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};