import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';

interface BookingCancelledPageProps {
  navigate: (path: string) => void;
}

const BookingCancelledPage = ({ navigate }: BookingCancelledPageProps) => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Cancelled Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Booking Cancelled</h1>
          <p className="text-muted-foreground">
            Your booking was cancelled and no payment was processed.
          </p>
        </div>

        {/* Information Card */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              You cancelled the payment process. Your booking was not created and you were not charged.
            </p>
            <p className="text-sm text-muted-foreground">
              If you'd like to try again, you can create a new booking from the home page.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/book')} 
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Try Booking Again
          </Button>
          <Button 
            onClick={() => navigate('/home')} 
            variant="outline" 
            className="w-full"
          >
            Back to Home
          </Button>
        </div>

        {/* Support Note */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Having trouble? Contact our support team at{' '}
            <a href="mailto:support@blindado.app" className="text-accent hover:underline">
              support@blindado.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingCancelledPage;