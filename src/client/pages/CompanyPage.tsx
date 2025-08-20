import { Building, Settings, FileText, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/mobile/BottomNav';

interface CompanyPageProps {
  navigate: (path: string) => void;
}

const CompanyPage = ({ navigate }: CompanyPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-mobile-xl font-bold text-foreground">
            Company Management
          </h1>
        </div>

        <div className="space-y-6 pb-20">
          {/* Company Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/company/profile')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Company Details
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/company/permits')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Permits & Documents
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/company/settings')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Security Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav currentPath="/company" navigate={navigate} />
    </div>
  );
};

export default CompanyPage;