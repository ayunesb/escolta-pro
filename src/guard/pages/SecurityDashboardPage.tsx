import { ArrowLeft } from 'lucide-react';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import HapticButton from '@/components/mobile/HapticButton';

interface SecurityDashboardPageProps {
  navigate: (path: string) => void;
}

const SecurityDashboardPage = ({ navigate }: SecurityDashboardPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <HapticButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/company')}
            hapticPattern="light"
            className="touch-target flex items-center justify-center p-2 -ml-2"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </HapticButton>
          <h2 className="text-mobile-lg font-semibold text-foreground">
            Security Dashboard
          </h2>
          <div className="w-10" />
        </div>

        {/* Security Dashboard */}
        <SecurityDashboard navigate={navigate} />
      </div>
    </div>
  );
};

export default SecurityDashboardPage;