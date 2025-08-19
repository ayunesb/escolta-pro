import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Car, Shield, Save, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import FileUpload from '@/components/ui/file-upload';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';

interface Vehicle {
  id?: string;
  company_id?: string;
  type?: string;
  plates?: string;
  armored: boolean;
  active: boolean;
  // Additional fields for enhanced functionality
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  docs?: any;
}

interface VehicleFormPageProps {
  navigate: (path: string) => void;
  vehicleId?: string;
}

const VehicleFormPage = ({ navigate, vehicleId }: VehicleFormPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isEditing, setIsEditing] = useState(!!vehicleId);
  
  // Form fields
  const [vehicleType, setVehicleType] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [plates, setPlates] = useState('');
  const [armored, setArmored] = useState(false);
  const [armoredLevel, setArmoredLevel] = useState('None');
  const [active, setActive] = useState(true);
  const [armedDeploymentReady, setArmedDeploymentReady] = useState(false);
  
  // Document URLs
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [insuranceUrl, setInsuranceUrl] = useState('');

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId]);

  const loadVehicle = async () => {
    if (!vehicleId) return;

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .maybeSingle();

      if (error) {
        console.error('Error loading vehicle:', error);
        toast.error('Failed to load vehicle');
        navigate('/company-vehicles');
        return;
      }

      if (data) {
        setVehicle(data);
        setVehicleType(data.type || '');
        setPlates(data.plates || '');
        setArmored(data.armored ?? false);
        setActive(data.active ?? true);
        
        // Load additional fields from docs if available
        const docs = data.docs as any;
        if (docs) {
          setMake(docs.make || '');
          setModel(docs.model || '');
          setYear(docs.year?.toString() || '');
          setColor(docs.color || '');
          setArmoredLevel(docs.armored_level || 'None');
          setArmedDeploymentReady(docs.armed_deployment_ready ?? false);
          setVehiclePhotoUrl(docs.photo_url || '');
          setRegistrationUrl(docs.registration_url || '');
          setInsuranceUrl(docs.insurance_url || '');
        }
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!vehicleType || !make || !model) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.company_id) {
        toast.error('Company profile not found');
        return;
      }

      const vehicleData = {
        company_id: profile.company_id,
        type: vehicleType,
        plates,
        armored,
        active,
        owned_by: 'company',
        docs: {
          make,
          model,
          year: year ? parseInt(year) : null,
          color,
          armored_level: armoredLevel,
          armed_deployment_ready: armedDeploymentReady,
          photo_url: vehiclePhotoUrl,
          registration_url: registrationUrl,
          insurance_url: insuranceUrl
        }
      };

      if (isEditing && vehicleId) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicleId);

        if (error) throw error;
        toast.success('Vehicle updated successfully');
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleData);

        if (error) throw error;
        toast.success('Vehicle added successfully');
      }

      navigate('/company-vehicles');
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      toast.error('Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (url: string, docType: string) => {
    switch (docType) {
      case 'photo':
        setVehiclePhotoUrl(url);
        break;
      case 'registration':
        setRegistrationUrl(url);
        break;
      case 'insurance':
        setInsuranceUrl(url);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/company-vehicles')}
              className="touch-target flex items-center justify-center"
            >
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-mobile-xl font-semibold text-foreground">
                {isEditing ? 'Edit Vehicle' : 'Add Vehicle'}
              </h1>
              <p className="text-mobile-sm text-muted-foreground">
                {isEditing ? 'Update vehicle information' : 'Add a new company vehicle'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-mobile-sm font-medium">Vehicle Type *</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="input-dark"
                    placeholder="e.g., Toyota"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="input-dark"
                    placeholder="e.g., Camry"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="input-dark"
                    placeholder="e.g., 2022"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="input-dark"
                    placeholder="e.g., Black"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plates">License Plates</Label>
                <Input
                  id="plates"
                  type="text"
                  value={plates}
                  onChange={(e) => setPlates(e.target.value)}
                  className="input-dark"
                  placeholder="Enter license plate number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Armor and Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Security Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Armored Vehicle</Label>
                    <p className="text-xs text-muted-foreground">Ballistic protection installed</p>
                  </div>
                </div>
                <Switch checked={armored} onCheckedChange={setArmored} />
              </div>

              {armored && (
                <div className="space-y-2">
                  <Label className="text-mobile-sm font-medium">Armor Level</Label>
                  <Select value={armoredLevel} onValueChange={setArmoredLevel}>
                    <SelectTrigger className="input-dark">
                      <SelectValue placeholder="Select armor level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIJ II">NIJ Level II</SelectItem>
                      <SelectItem value="NIJ IIIA">NIJ Level IIIA</SelectItem>
                      <SelectItem value="NIJ III">NIJ Level III</SelectItem>
                      <SelectItem value="NIJ IV">NIJ Level IV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Armed Deployment Ready</Label>
                    <p className="text-xs text-muted-foreground">Can support armed personnel</p>
                  </div>
                </div>
                <Switch checked={armedDeploymentReady} onCheckedChange={setArmedDeploymentReady} />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label>Active Status</Label>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Vehicle Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload
                label="Vehicle Photo"
                bucketName="vehicles"
                storagePath={`company/${user?.id}`}
                currentFileUrl={vehiclePhotoUrl}
                onUploadComplete={(url) => handleDocumentUpload(url, 'photo')}
                accept=".jpg,.jpeg,.png"
              />

              <FileUpload
                label="Vehicle Registration"
                bucketName="vehicles"
                storagePath={`company/${user?.id}`}
                currentFileUrl={registrationUrl}
                onUploadComplete={(url) => handleDocumentUpload(url, 'registration')}
                accept=".pdf,.jpg,.jpeg,.png"
              />

              <FileUpload
                label="Insurance Certificate"
                bucketName="vehicles"
                storagePath={`company/${user?.id}`}
                currentFileUrl={insuranceUrl}
                onUploadComplete={(url) => handleDocumentUpload(url, 'insurance')}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit"
            disabled={loading || !vehicleType || !make || !model}
            className="w-full h-button rounded-button bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (isEditing ? 'Update Vehicle' : 'Add Vehicle')}
          </Button>
        </form>
      </div>

      {/* Bottom Navigation */}
      <GuardBottomNav currentPath="/company-vehicles" navigate={navigate} />
    </div>
  );
};

export default VehicleFormPage;