import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LanguageToggle } from '@/components/ui/language-toggle';
import ThemeToggle from '@/components/ui/theme-toggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatMXN } from '@/utils/pricing';
import { t, getPreferredLanguage } from '@/lib/i18n';
import { Shield, Building, CheckCircle, XCircle, Eye, User } from 'lucide-react';

interface SuperAdminPageProps {
  navigate: (path: string) => void;
}

interface PendingCompany {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  tax_id: string;
  cities: string[];
  status: string;
  created_at: string;
}

interface PendingGuard {
  id: string;
  user_id: string;
  hourly_rate_mxn_cents: number;
  armed_hourly_surcharge_mxn_cents: number;
  photo_url?: string;
  rating: number;
  city?: string;
  status?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

const SuperAdminPage = ({ navigate }: SuperAdminPageProps) => {
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [pendingGuards, setPendingGuards] = useState<PendingGuard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentLang] = useState(getPreferredLanguage());

  useEffect(() => {
    loadPendingItems();
  }, []);

  const loadPendingItems = async () => {
    setLoading(true);
    try {
      // Load pending companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });

      if (companiesError) {
        console.error('Error loading companies:', companiesError);
      } else {
        setPendingCompanies(companies || []);
      }

      // Load pending guards (freelancers)
      const { data: guards, error: guardsError } = await supabase
        .from('guards')
        .select(`
          *,
          profiles!inner(first_name, last_name, email)
        `)
        .or('status.is.null,status.eq.pending_review')
        .order('id', { ascending: false });

      if (guardsError) {
        console.error('Error loading guards:', guardsError);
      } else {
        setPendingGuards(guards || []);
      }
    } catch (error) {
      console.error('Error loading pending items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending approvals',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const approveCompany = async (companyId: string) => {
    setActionLoading(companyId);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'approved' })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Company Approved',
        description: 'Company has been approved and can now operate.'
      });

      loadPendingItems();
    } catch (error: unknown) {
      console.error('Error approving company:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve company',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const suspendCompany = async (companyId: string) => {
    setActionLoading(companyId);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'suspended' })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Company Suspended',
        description: 'Company has been suspended.'
      });

      loadPendingItems();
    } catch (error: unknown) {
      console.error('Error suspending company:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend company',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const approveGuard = async (guardId: string) => {
    setActionLoading(guardId);
    try {
      const { error } = await supabase
        .from('guards')
        .update({ 
          status: 'approved',
          active: true 
        })
        .eq('id', guardId);

      if (error) throw error;

      toast({
        title: 'Guard Approved',
        description: 'Guard has been approved and is now available for bookings.'
      });

      loadPendingItems();
    } catch (error: unknown) {
      console.error('Error approving guard:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve guard',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const suspendGuard = async (guardId: string) => {
    setActionLoading(guardId);
    try {
      const { error } = await supabase
        .from('guards')
        .update({ 
          status: 'suspended',
          active: false 
        })
        .eq('id', guardId);

      if (error) throw error;

      toast({
        title: 'Guard Suspended',
        description: 'Guard has been suspended.'
      });

      loadPendingItems();
    } catch (error: unknown) {
      console.error('Error suspending guard:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend guard',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top px-mobile py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-mobile-xl font-bold text-foreground">
              {t('super_admin', currentLang)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              {t('admin', currentLang)}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t('companies', currentLang)} ({pendingCompanies.length})
            </TabsTrigger>
            <TabsTrigger value="guards" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('guards', currentLang)} ({pendingGuards.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-4 mt-6">
            {pendingCompanies.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-mobile-lg font-medium mb-2">{t('no_pending_companies', currentLang)}</h3>
                  <p className="text-mobile-sm text-muted-foreground text-center">
                    {t('all_reviewed', currentLang)}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingCompanies.map((company) => (
                  <Card key={company.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-mobile-lg">{company.name}</CardTitle>
                          <p className="text-mobile-sm text-muted-foreground">
                            Tax ID: {company.tax_id}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {company.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-2 text-mobile-sm">
                        <div><strong>Contact:</strong> {company.contact_name}</div>
                        <div><strong>Email:</strong> {company.contact_email}</div>
                        <div><strong>Phone:</strong> {company.contact_phone}</div>
                        <div><strong>Cities:</strong> {company.cities.join(', ')}</div>
                        <div><strong>Applied:</strong> {new Date(company.created_at).toLocaleDateString()}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveCompany(company.id)}
                          disabled={actionLoading === company.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('approve', currentLang)}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => suspendCompany(company.id)}
                          disabled={actionLoading === company.id}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('suspend', currentLang)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="guards" className="space-y-4 mt-6">
            {pendingGuards.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-mobile-lg font-medium mb-2">{t('no_pending_guards', currentLang)}</h3>
                  <p className="text-mobile-sm text-muted-foreground text-center">
                    {t('all_reviewed', currentLang)}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingGuards.map((guard) => (
                  <Card key={guard.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            {guard.photo_url ? (
                              <img 
                                src={guard.photo_url} 
                                alt="Guard" 
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-mobile-lg">
                              {guard.profiles?.first_name} {guard.profiles?.last_name}
                            </CardTitle>
                            <p className="text-mobile-sm text-muted-foreground">
                              {guard.profiles?.email}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {guard.status || 'pending'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-mobile-sm">
                        <div>
                          <strong>Base Rate:</strong><br />
                          {formatMXN(guard.hourly_rate_mxn_cents)}/hr
                        </div>
                        <div>
                          <strong>Armed Surcharge:</strong><br />
                          {formatMXN(guard.armed_hourly_surcharge_mxn_cents)}/hr
                        </div>
                        <div>
                          <strong>City:</strong><br />
                          {guard.city || 'Not specified'}
                        </div>
                        <div>
                          <strong>Rating:</strong><br />
                          ⭐ {guard.rating.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveGuard(guard.id)}
                          disabled={actionLoading === guard.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('approve', currentLang)}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => suspendGuard(guard.id)}
                          disabled={actionLoading === guard.id}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('suspend', currentLang)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pendingCompanies.length + pendingGuards.length + 150}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">
                    +2 this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Guards</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">147</div>
                  <p className="text-xs text-muted-foreground">
                    +18% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    +25% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Uptime</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      99.9%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Sessions</span>
                    <span className="text-sm font-medium">342</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time</span>
                    <span className="text-sm font-medium">234ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      0.1%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Guard "Carlos M." completed booking #1234</span>
                      <span className="text-muted-foreground ml-auto">2m ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>New company registration: "SecureGuard MX"</span>
                      <span className="text-muted-foreground ml-auto">15m ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Payment processed for booking #1232</span>
                      <span className="text-muted-foreground ml-auto">1h ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Guard "Ana L." approved for service</span>
                      <span className="text-muted-foreground ml-auto">2h ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminPage;