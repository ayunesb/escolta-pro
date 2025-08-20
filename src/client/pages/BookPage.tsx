import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ArrowLeft, Shield, Car } from 'lucide-react';
import BottomSheet from '@/components/mobile/BottomSheet';
import HapticButton from '@/components/mobile/HapticButton';

interface BookPageProps {
  navigate: (path: string) => void;
  pid?: string | null;
}

const BookPage = ({ navigate, pid }: BookPageProps) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('4');
  const [selectedProtector, setSelectedProtector] = useState<string | null>(pid);
  const [armedRequired, setArmedRequired] = useState(false);
  const [withVehicle, setWithVehicle] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>('');
  const [armoredLevel, setArmoredLevel] = useState<string>('None');

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  const handleNext = () => {
    // Validate form
    if (!location || !date || !startTime || !duration) {
      return;
    }
    
    // Store booking data in sessionStorage for quote page
    const bookingData = {
      location,
      date,
      startTime,
      duration: parseInt(duration),
      protectorId: selectedProtector,
      armedRequired,
      withVehicle,
      vehicleType: withVehicle ? vehicleType : undefined,
      armoredLevel: withVehicle ? armoredLevel : undefined
    };
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    navigate('/quote');
  };

  const removeProtector = () => {
    setSelectedProtector(null);
    // Update URL to remove pid parameter
    navigate('/book');
  };

  return (
    <BottomSheet isOpen={true} onClose={() => navigate('/home')}>
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate('/home')}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <h2 className="text-mobile-lg font-semibold text-foreground">
          Book Protection
        </h2>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {selectedProtector && (
        <div className="mb-4">
          <Badge 
            variant="secondary" 
            className="flex items-center gap-2 w-fit"
          >
            Selected Protector
            <button 
              onClick={removeProtector}
              className="hover:bg-secondary/80 rounded-full p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="location" className="text-mobile-base font-medium">
            Pickup Location
          </Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter pickup address"
            className="input-dark"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-mobile-base font-medium">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-dark"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-mobile-base font-medium">
              Start Time
            </Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input-dark"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="text-mobile-base font-medium">
            Duration (hours)
          </Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="input-dark">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 hours (minimum)</SelectItem>
              <SelectItem value="6">6 hours</SelectItem>
              <SelectItem value="8">8 hours</SelectItem>
              <SelectItem value="12">12 hours</SelectItem>
              <SelectItem value="24">24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Armed Protection Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-mobile-base font-medium">Armed protector required?</Label>
              <p className="text-xs text-muted-foreground">Certified armed security personnel</p>
            </div>
          </div>
          <Switch 
            checked={armedRequired} 
            onCheckedChange={setArmedRequired}
          />
        </div>
      </div>

      {/* Vehicle Required Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-mobile-base font-medium">Vehicle required?</Label>
              <p className="text-xs text-muted-foreground">Professional transport service</p>
            </div>
          </div>
          <Switch 
            checked={withVehicle} 
            onCheckedChange={setWithVehicle}
          />
        </div>

        {/* Vehicle Options */}
        {withVehicle && (
          <div className="space-y-4 pl-8">
            <div className="space-y-2">
              <Label className="text-mobile-sm font-medium">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="input-dark">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Bike">Motorcycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-mobile-sm font-medium">Armored Level</Label>
              <Select value={armoredLevel} onValueChange={setArmoredLevel}>
                <SelectTrigger className="input-dark">
                  <SelectValue placeholder="Select armor level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="NIJ II">NIJ Level II</SelectItem>
                  <SelectItem value="NIJ IIIA">NIJ Level IIIA</SelectItem>
                  <SelectItem value="NIJ III">NIJ Level III</SelectItem>
                  <SelectItem value="NIJ IV">NIJ Level IV</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Higher NIJ levels may increase availability time and price.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-background pt-6 mt-8">
        <HapticButton 
          onClick={handleNext}
          disabled={!location || !date || !startTime || !duration || (withVehicle && !vehicleType)}
          hapticPattern="medium"
          className="w-full"
          size="lg"
        >
          Next - Get Quote
        </HapticButton>
      </div>
    </BottomSheet>
  );
};

export default BookPage;