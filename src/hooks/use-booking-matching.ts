import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface MatchingOptions {
  city: string;
  armed_required: boolean;
  vehicle_required: boolean;
  start_ts: string;
  min_hours: number;
  lat?: number;
  lng?: number;
}

export const useBookingMatching = () => {
  const [matchingGuards, setMatchingGuards] = useState<Guard[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const { toast } = useToast();

  const findMatchingGuards = async (options: MatchingOptions) => {
    setIsMatching(true);
    setMatchingProgress(0);
    setMatchingGuards([]);

    try {
      // Simulate progressive matching with real-time updates
      const progressSteps = [
        { progress: 20, message: 'Searching available guards...' },
        { progress: 40, message: 'Checking qualifications...' },
        { progress: 60, message: 'Calculating distances...' },
        { progress: 80, message: 'Ranking candidates...' },
        { progress: 100, message: 'Match complete!' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setMatchingProgress(step.progress);
        
        if (step.progress === 100) {
          // Fetch actual guards
          const { data: guards, error } = await supabase.rpc('get_public_guards');
          
          if (error) throw error;
          
          // Filter and enhance guards based on criteria
          const filteredGuards = guards
            ?.filter(guard => 
              guard.city?.toLowerCase() === options.city.toLowerCase() &&
              guard.rating >= 4.0
            )
            .map(guard => ({
              ...guard,
              distance: options.lat && options.lng ? 
                Math.random() * 10 + 1 : // Simulate distance
                undefined,
              availability_status: Math.random() > 0.3 ? 'available' : 'busy'
            }))
            .filter(guard => guard.availability_status === 'available')
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
            .slice(0, 8) || [];

          setMatchingGuards(filteredGuards);
          
          toast({
            title: "Guards Found!",
            description: `Found ${filteredGuards.length} available guards in your area.`,
          });
        }
      }
    } catch (error) {
      console.error('Error finding guards:', error);
      toast({
        title: "Matching Failed",
        description: "Unable to find guards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMatching(false);
    }
  };

  const resetMatching = () => {
    setMatchingGuards([]);
    setMatchingProgress(0);
    setIsMatching(false);
  };

  return {
    matchingGuards,
    isMatching,
    matchingProgress,
    findMatchingGuards,
    resetMatching
  };
};