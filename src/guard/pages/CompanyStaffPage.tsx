import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';

interface Staff {
  id: string;
  name?: string;
  email?: string;
  address?: string;
  photo_formal_url?: string;
}

interface CompanyStaffPageProps {
  navigate: (path: string) => void;
}

const CompanyStaffPage = ({ navigate }: CompanyStaffPageProps) => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!user) return;
      
      try {
        // Get user's company from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profileData?.company_id) {
          // Note: We'll need to create a company_staff table or use guards table
          // For now, using guards table as it's the closest match
          const { data, error } = await supabase
            .from('guards')
            .select('id, photo_url, user_id')
            .eq('company_id', profileData.company_id)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Error fetching staff:', error);
          } else {
            // Transform data to match expected interface
            const transformedData = data?.map(guard => ({
              id: guard.id,
              name: `Guard ${guard.id.slice(-8)}`,
              email: '',
              address: '',
              photo_formal_url: guard.photo_url
            })) || [];
            setStaff(transformedData);
          }
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/account')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Company Staff
          </h2>
          <button
            onClick={() => navigate('/company-staff-new')}
            className="touch-target flex items-center justify-center"
          >
            <Plus className="h-6 w-6 text-accent" />
          </button>
        </div>

        {/* Add Staff Button */}
        <Button 
          onClick={() => navigate('/company-staff-new')}
          className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold mb-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Staff Member
        </Button>

        {/* Staff List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-mobile-base font-medium text-foreground mb-2">
              No staff members yet
            </h3>
            <p className="text-mobile-sm text-muted-foreground mb-6">
              Add staff members to your company
            </p>
            <Button
              onClick={() => navigate('/company-staff-new')}
              variant="outline"
            >
              Add First Staff Member
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {staff.map((member) => (
              <Card 
                key={member.id}
                className="cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => navigate(`/company-staff/${member.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      {member.photo_formal_url ? (
                        <img 
                          src={member.photo_formal_url} 
                          alt="Staff" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-mobile-base font-medium text-foreground">
                        {member.name || 'Staff Member'}
                      </h3>
                      {member.email && (
                        <p className="text-mobile-sm text-muted-foreground">
                          {member.email}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <GuardBottomNav currentPath="/company-staff" navigate={navigate} />
    </div>
  );
};

export default CompanyStaffPage;