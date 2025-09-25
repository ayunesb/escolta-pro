import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Shield, Car, User, Edit, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FileUpload from '@/components/ui/file-upload';
import GuardBottomNav from '@/components/mobile/GuardBottomNav';

interface StaffMember {
  id: string;
  user_id?: string;
  company_id?: string;
  skills: unknown;
  rating: number;
  active: boolean;
  hourly_rate?: number;
  city?: string;
  status?: string;
}

interface CompanyStaffDetailPageProps {
  navigate: (path: string) => void;
  staffId: string;
}

const CompanyStaffDetailPage = ({ navigate, staffId }: CompanyStaffDetailPageProps) => {
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Editable fields
  const [hourlyRate, setHourlyRate] = useState('');
  const [city, setCity] = useState('');
  const [active, setActive] = useState(true);
  const [armed, setArmed] = useState(false);
  const [withVehicle, setWithVehicle] = useState(false);
  
  // Document URLs
  const [idDocUrl, setIdDocUrl] = useState('');
  const [gunPermitUrl, setGunPermitUrl] = useState('');
  const [driverLicenseUrl, setDriverLicenseUrl] = useState('');

  useEffect(() => {
    const fetchStaffMember = async () => {
      try {
        const { data, error } = await supabase
          .from('guards')
          .select('*')
          .eq('id', staffId)
          .single();
        
        if (error) {
          console.error('Error fetching staff member:', error);
          toast.error('Failed to load staff member');
          navigate('/company-staff');
          return;
        }

        setStaff(data);
        setHourlyRate(data.hourly_rate?.toString() || '');
        setCity(data.city || '');
        setActive(data.active ?? true);
  setArmed((data.skills && typeof data.skills === 'object' && 'armed' in data.skills) ? (data.skills as any).armed ?? false : false);
  setWithVehicle((data.skills && typeof data.skills === 'object' && 'driver' in data.skills) ? (data.skills as any).driver ?? false : false);

        // Fetch documents
        fetchDocuments(data.id);
      } catch (err: unknown) {
        console.error('Error fetching staff member:', err);
        toast.error('Failed to load staff member');
        navigate('/company-staff');
      } finally {
        setLoading(false);
      }
    };

    const fetchDocuments = async (guardId: string) => {
      try {
        const { data } = await supabase
          .from('guard_documents')
          .select('*')
          .eq('guard_id', guardId);

        if (data) {
          data.forEach(doc => {
            switch (doc.doc_type) {
              case 'id':
                setIdDocUrl(doc.url || '');
                break;
              case 'gun_permit':
                setGunPermitUrl(doc.url || '');
                break;
              case 'driver_license':
                setDriverLicenseUrl(doc.url || '');
                break;
            }
          });
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    if (staffId) {
      fetchStaffMember();
    }
  }, [staffId, navigate]);

  const handleSave = async () => {
    if (!staff) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('guards')
        .update({
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          city,
          active,
          skills: {
            ...(typeof staff.skills === 'object' && staff.skills ? (staff.skills as Record<string, unknown>) : {}),
            armed,
            driver: withVehicle
          }
        })
        .eq('id', staffId);

      if (error) throw error;

      toast.success('Staff member updated successfully');
      setEditing(false);
      
      // Refresh data
      setStaff(prev => prev ? {
        ...prev,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        city,
        active,
  skills: { ...(typeof prev?.skills === 'object' && prev?.skills ? (prev.skills as Record<string, unknown>) : {}), armed, driver: withVehicle }
      } : null);
    } catch (err: unknown) {
      console.error('Error updating staff member:', err);
      toast.error('Failed to update staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (url: string, docType: string) => {
    if (!staff) return;

    try {
      const { error } = await supabase
        .from('guard_documents')
        .upsert({
          guard_id: staff.id,
          doc_type: docType,
          url,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      switch (docType) {
        case 'id':
          setIdDocUrl(url);
          break;
        case 'gun_permit':
          setGunPermitUrl(url);
          break;
        case 'driver_license':
          setDriverLicenseUrl(url);
          break;
      }
    } catch (err: unknown) {
      console.error('Error saving document:', err);
      toast.error('Failed to save document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-mobile-lg font-medium text-foreground mb-2">
            Staff member not found
          </h3>
          <Button onClick={() => navigate('/company-staff')}>
            Back to Staff
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/company-staff')}
              className="touch-target flex items-center justify-center"
            >
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-mobile-xl font-semibold text-foreground">
                Staff Member
              </h1>
              <p className="text-mobile-sm text-muted-foreground">
                ID: {staffId.slice(-8)}
              </p>
            </div>
          </div>
          <Button
            onClick={editing ? handleSave : () => setEditing(true)}
            disabled={saving}
            className="rounded-button"
          >
            {editing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Status & Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-mobile-base">Staff Information</CardTitle>
                <div className="flex gap-2">
                  <Badge 
                    variant={staff.active ? "default" : "secondary"}
                    className={staff.active ? "bg-success text-white" : ""}
                  >
                    {staff.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    Rating: {staff.rating.toFixed(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-mobile-sm font-medium">Hourly Rate</Label>
                  {editing ? (
                    <Input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="Enter hourly rate"
                      className="input-dark"
                    />
                  ) : (
                    <p className="text-mobile-sm text-foreground">
                      {hourlyRate ? `$${hourlyRate}/hr` : 'Not set'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-mobile-sm font-medium">City</Label>
                  {editing ? (
                    <Input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city"
                      className="input-dark"
                    />
                  ) : (
                    <p className="text-mobile-sm text-foreground">
                      {city || 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {editing && (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Label>Active Status</Label>
                    </div>
                    <Switch checked={active} onCheckedChange={setActive} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Label>Armed Personnel</Label>
                    </div>
                    <Switch checked={armed} onCheckedChange={setArmed} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <Label>With Vehicle</Label>
                    </div>
                    <Switch checked={withVehicle} onCheckedChange={setWithVehicle} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload
                label="Government ID"
                bucketName="licenses"
                storagePath={`guards/${staff.id}`}
                currentFileUrl={idDocUrl}
                onUploadComplete={(url) => handleDocumentUpload(url, 'id')}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />

              {(armed || (staff.skills as any)?.armed) && (
                <FileUpload
                  label="Gun Permit"
                  bucketName="licenses"
                  storagePath={`guards/${staff.id}`}
                  currentFileUrl={gunPermitUrl}
                  onUploadComplete={(url) => handleDocumentUpload(url, 'gun_permit')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                />
              )}

              {(withVehicle || (staff.skills as any)?.driver) && (
                <FileUpload
                  label="Driver's License"
                  bucketName="licenses"
                  storagePath={`guards/${staff.id}`}
                  currentFileUrl={driverLicenseUrl}
                  onUploadComplete={(url) => handleDocumentUpload(url, 'driver_license')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <GuardBottomNav currentPath="/company-staff" navigate={navigate} />
    </div>
  );
};

export default CompanyStaffDetailPage;