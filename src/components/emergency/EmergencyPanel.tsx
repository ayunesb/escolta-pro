import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Phone, Shield, Camera, Mic, MapPin, Clock } from 'lucide-react';
import HapticButton from '@/components/mobile/HapticButton';
import { useAuth } from '@/contexts/AuthContext';

interface EmergencyPanelProps {
  bookingId: string;
  assignmentId?: string;
}

interface EmergencyReport {
  type: 'medical' | 'security' | 'fire' | 'police' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  media?: File[];
}

export const EmergencyPanel = ({ bookingId, assignmentId }: EmergencyPanelProps) => {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyReport, setEmergencyReport] = useState<EmergencyReport>({
    type: 'security',
    severity: 'medium',
    description: '',
    media: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const emergencyTypes = [
    { value: 'medical', label: 'Medical Emergency', icon: '🏥' },
    { value: 'security', label: 'Security Threat', icon: '🚨' },
    { value: 'fire', label: 'Fire Emergency', icon: '🔥' },
    { value: 'police', label: 'Police Required', icon: '👮' },
    { value: 'other', label: 'Other Emergency', icon: '⚠️' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-orange-100 text-orange-800' },
    { value: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' },
    { value: 'critical', label: 'CRITICAL', color: 'bg-red-600 text-white' }
  ];

  const activateEmergency = () => {
    setIsEmergencyActive(true);
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEmergencyReport(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Haptic feedback for emergency activation
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    toast({
      title: "Emergency Mode Activated",
      description: "Your location is being tracked and authorities will be notified if needed.",
      variant: "destructive",
    });
  };

  const submitEmergencyReport = async () => {
    if (!emergencyReport.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide details about the emergency.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload media files if any
      const mediaUrls: string[] = [];
      
      if (emergencyReport.media && emergencyReport.media.length > 0) {
        for (const file of emergencyReport.media) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `incidents/${bookingId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('incidents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('incidents')
            .getPublicUrl(filePath);

          mediaUrls.push(publicUrl);
        }
      }

      // Create incident report
      const { error } = await supabase
        .from('incidents')
        .insert({
          booking_id: bookingId,
          created_by: user?.id || '',
          type: emergencyReport.type,
          severity: getSeverityNumber(emergencyReport.severity),
          narrative: emergencyReport.description,
          media: mediaUrls
        });

      if (error) throw error;

      // Send emergency notification via edge function
      await supabase.functions.invoke('emergency_alert', {
        body: {
          booking_id: bookingId,
          assignment_id: assignmentId,
          emergency_type: emergencyReport.type,
          severity: emergencyReport.severity,
          location: emergencyReport.location,
          description: emergencyReport.description,
          media_urls: mediaUrls
        }
      });

      toast({
        title: "Emergency Report Submitted",
        description: "Authorities and relevant parties have been notified.",
      });

      // Reset form
      setEmergencyReport({
        type: 'security',
        severity: 'medium',
        description: '',
        media: []
      });
      
      setIsEmergencyActive(false);

    } catch (error) {
      console.error('Error submitting emergency report:', error);
      toast({
        title: "Failed to Submit Report",
        description: "Please try again or call emergency services directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityNumber = (severity: string): number => {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 2;
    }
  };

  const handleMediaCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setEmergencyReport(prev => ({
      ...prev,
      media: [...(prev.media || []), ...files]
    }));
  };

  const callEmergencyServices = () => {
    // In a real app, this would initiate a call to local emergency services
    window.location.href = 'tel:911';
  };

  if (!isEmergencyActive) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-6 w-6" />
            <span>Emergency Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            In case of emergency, activate emergency mode to alert authorities and your security team.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HapticButton
              variant="destructive"
              onClick={activateEmergency}
              hapticPattern="heavy"
              className="h-16"
            >
              <AlertTriangle className="h-6 w-6 mr-2" />
              Activate Emergency Mode
            </HapticButton>
            
            <HapticButton
              variant="outline"
              onClick={callEmergencyServices}
              hapticPattern="medium"
              className="h-16 border-red-200 text-red-700 hover:bg-red-50"
            >
              <Phone className="h-6 w-6 mr-2" />
              Call Emergency Services
            </HapticButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500 bg-red-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            <span>EMERGENCY MODE ACTIVE</span>
          </CardTitle>
          <Badge className="bg-red-600 text-white animate-pulse">
            EMERGENCY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-red-700">Emergency Type</label>
            <Select 
              value={emergencyReport.type} 
              onValueChange={(value: any) => setEmergencyReport(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emergencyTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-red-700">Severity</label>
            <Select 
              value={emergencyReport.severity} 
              onValueChange={(value: any) => setEmergencyReport(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severityLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    <Badge className={level.color}>{level.label}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-red-700">Description</label>
          <Textarea
            value={emergencyReport.description}
            onChange={(e) => setEmergencyReport(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the emergency situation in detail..."
            rows={4}
            className="border-red-200"
          />
        </div>

        {emergencyReport.location && (
          <div className="p-3 bg-white border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700">Location Captured</p>
                <p className="text-xs text-red-600">
                  {emergencyReport.location.lat.toFixed(6)}, {emergencyReport.location.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaCapture}
            className="hidden"
            id="emergency-media"
          />
          
          <HapticButton
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('emergency-media')?.click()}
            hapticPattern="light"
            className="border-red-200"
          >
            <Camera className="h-4 w-4 mr-2" />
            Add Photo/Video
          </HapticButton>
          
          {emergencyReport.media && emergencyReport.media.length > 0 && (
            <Badge variant="outline" className="border-red-200 text-red-700">
              {emergencyReport.media.length} file(s) attached
            </Badge>
          )}
        </div>

        <div className="flex space-x-4">
          <HapticButton
            variant="destructive"
            onClick={submitEmergencyReport}
            disabled={submitting}
            hapticPattern="heavy"
            className="flex-1"
          >
            {submitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting Report...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Submit Emergency Report
              </>
            )}
          </HapticButton>
          
          <Button
            variant="outline"
            onClick={() => setIsEmergencyActive(false)}
            disabled={submitting}
            className="border-red-200"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};