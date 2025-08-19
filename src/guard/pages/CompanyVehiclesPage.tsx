import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Car, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Vehicle {
  id: string;
  type?: string;
  plates?: string;
  armored: boolean;
  active: boolean;
}

interface CompanyVehiclesPageProps {
  navigate: (path: string) => void;
}

const CompanyVehiclesPage = ({ navigate }: CompanyVehiclesPageProps) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) return;
      
      try {
        // Get user's company from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profileData?.company_id) {
          const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('company_id', profileData.company_id)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Error fetching vehicles:', error);
          } else {
            setVehicles(data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/company')}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Company Vehicles
          </h2>
          <button
            onClick={() => navigate('/company-vehicles-new')}
            className="touch-target flex items-center justify-center"
          >
            <Plus className="h-6 w-6 text-accent" />
          </button>
        </div>

        {/* Add Vehicle Button */}
        <Button 
          onClick={() => navigate('/company-vehicles-new')}
          className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold mb-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Vehicle
        </Button>

        {/* Vehicles List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-mobile-base font-medium text-foreground mb-2">
              No vehicles yet
            </h3>
            <p className="text-mobile-sm text-muted-foreground mb-6">
              Add vehicles to your company fleet
            </p>
            <Button
              onClick={() => navigate('/company-vehicles-new')}
              variant="outline"
            >
              Add First Vehicle
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <Card 
                key={vehicle.id}
                className="cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => navigate(`/company-vehicles/${vehicle.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Car className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-mobile-base">
                          {vehicle.type || 'Vehicle'}
                        </CardTitle>
                        {vehicle.plates && (
                          <p className="text-mobile-sm text-muted-foreground">
                            {vehicle.plates}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {vehicle.armored && (
                        <Badge className="bg-accent text-accent-foreground">
                          <Shield className="h-3 w-3 mr-1" />
                          Armored
                        </Badge>
                      )}
                      <Badge 
                        variant={vehicle.active ? "default" : "secondary"}
                        className={vehicle.active ? "bg-success text-white" : ""}
                      >
                        {vehicle.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyVehiclesPage;