import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { ReportsGenerator } from '@/components/analytics/ReportsGenerator';
import BottomNav from '@/components/mobile/BottomNav';
import { BarChart3, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsPageProps {
  navigate: (path: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ navigate }) => {
  const { hasRole } = useAuth();
  const userType = hasRole('company_admin') ? 'company' : 'client';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 pb-20">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Analytics & Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              View detailed analytics and generate custom reports for your {userType === 'company' ? 'company' : 'account'}.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard userType={userType} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsGenerator />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav currentPath="/analytics" navigate={navigate} />
    </div>
  );
};

export default AnalyticsPage;