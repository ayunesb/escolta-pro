import { ArrowLeft } from 'lucide-react';
import { AuditTrailViewer } from '@/components/audit/AuditTrailViewer';
import HapticButton from '@/components/mobile/HapticButton';

interface AuditTrailPageProps {
  navigate: (path: string) => void;
}

const AuditTrailPage = ({ navigate }: AuditTrailPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <HapticButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/security')}
            hapticPattern="light"
            className="touch-target flex items-center justify-center p-2 -ml-2"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </HapticButton>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Audit Trail
          </h2>
          <div className="w-10" />
        </div>

        {/* Audit Trail Viewer */}
        <AuditTrailViewer navigate={navigate} />
      </div>
    </div>
  );
};

export default AuditTrailPage;