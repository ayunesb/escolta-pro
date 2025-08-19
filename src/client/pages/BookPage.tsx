import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft } from 'lucide-react';
import BottomSheet from '@/components/mobile/BottomSheet';

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
      protectorId: selectedProtector
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
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input-dark w-full"
            required
          >
            <option value="2">2 hours</option>
            <option value="4">4 hours</option>
            <option value="6">6 hours</option>
            <option value="8">8 hours</option>
            <option value="12">12 hours</option>
            <option value="24">24 hours</option>
          </select>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background pt-6 mt-8">
        <Button 
          onClick={handleNext}
          disabled={!location || !date || !startTime || !duration}
          className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
        >
          Next - Get Quote
        </Button>
      </div>
    </BottomSheet>
  );
};

export default BookPage;