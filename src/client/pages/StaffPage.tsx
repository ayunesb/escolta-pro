import { Users, UserPlus, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/mobile/BottomNav';

interface StaffPageProps {
  navigate: (path: string) => void;
}

const StaffPage = ({ navigate }: StaffPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-mobile-xl font-bold text-foreground">
            Staff Management
          </h1>
          <Button 
            size="sm"
            onClick={() => navigate('/staff/add')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>

        <div className="space-y-6 pb-20">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search staff..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Staff List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Members (0)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No staff members yet</p>
                <Button onClick={() => navigate('/staff/add')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Staff Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav currentPath="/staff" navigate={navigate} />
    </div>
  );
};

export default StaffPage;