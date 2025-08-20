import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingMatch {
  bookingId: string;
  guardId: string;
  score: number;
  distance: number;
  availability: boolean;
  skillMatch: number;
}

interface MatchingCriteria {
  location: { lat: number; lng: number };
  requiredSkills: string[];
  armedRequired: boolean;
  vehicleRequired: boolean;
  startTime: Date;
  duration: number;
}

export const useBookingMatching = () => {
  const [matches, setMatches] = useState<BookingMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const { toast } = useToast();

  const findMatches = async (bookingId: string, criteria: MatchingCriteria) => {
    setIsMatching(true);
    try {
      // Call edge function for intelligent matching
      const { data, error } = await supabase.functions.invoke('booking_match', {
        body: { bookingId, criteria }
      });

      if (error) throw error;
      
      setMatches(data.matches || []);
      return data.matches;
    } catch (error) {
      toast({
        title: "Matching Error",
        description: "Failed to find guard matches",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsMatching(false);
    }
  };

  const assignGuard = async (bookingId: string, guardId: string) => {
    try {
      const { error } = await supabase.functions.invoke('booking_assign', {
        body: { bookingId, guardId }
      });

      if (error) throw error;

      toast({
        title: "Guard Assigned",
        description: "Guard has been successfully assigned to booking",
      });

      return true;
    } catch (error) {
      toast({
        title: "Assignment Error", 
        description: "Failed to assign guard to booking",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    matches,
    isMatching,
    findMatches,
    assignGuard
  };
};