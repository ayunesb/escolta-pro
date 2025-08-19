import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Edit3 } from 'lucide-react';

interface CompanyStaffDetailPageProps {
  navigate: (path: string) => void;
  staffId: string;
}

const CompanyStaffDetailPage = ({ navigate, staffId }: CompanyStaffDetailPageProps) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/company-staff')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Staff Details
          </h2>
          <button className="touch-target flex items-center justify-center">
            <Edit3 className="h-6 w-6 text-accent" />
          </button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Staff Member #{staffId?.slice(-8)}</CardTitle>
                <p className="text-mobile-sm text-muted-foreground">Security Guard</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-mobile-sm text-muted-foreground">
              Staff member details would be displayed here with edit capabilities.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyStaffDetailPage;