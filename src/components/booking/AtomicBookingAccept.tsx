import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMobileNative } from "@/hooks/use-mobile-native";
import { Loader2, CheckCircle } from "lucide-react";

interface AtomicBookingAcceptProps {
  bookingId: string;
  onAccepted?: () => void;
  disabled?: boolean;
}

export const AtomicBookingAccept = ({ bookingId, onAccepted, disabled }: AtomicBookingAcceptProps) => {
  const [accepting, setAccepting] = useState(false);
  const { toast } = useToast();
  const { hapticFeedback } = useMobileNative();

  const handleAccept = async () => {
    setAccepting(true);
    
    try {
      await hapticFeedback('medium');
      
      const { data, error } = await supabase.functions.invoke('booking_accept_atomic', {
        body: { booking_id: bookingId }
      });

      if (error) {
        if (error.message?.includes('no longer available')) {
          toast({
            variant: "destructive",
            title: "Booking Unavailable",
            description: "This booking was already accepted by another guard."
          });
        } else {
          throw error;
        }
      } else {
        await hapticFeedback('heavy');
        toast({
          title: "Booking Accepted!",
          description: "You have successfully accepted this assignment."
        });
        onAccepted?.();
      }
    } catch (error) {
      console.error('Booking accept error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept booking. Please try again."
      });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Button 
      onClick={handleAccept}
      disabled={disabled || accepting}
      className="w-full"
      size="lg"
    >
      {accepting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Accepting...
        </>
      ) : (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Accept Job
        </>
      )}
    </Button>
  );
};