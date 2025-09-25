import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  Loader2,
  Filter,
  Send,
  PieChart,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ReportConfig {
  type: 'financial' | 'operational' | 'performance' | 'compliance';
  format: 'pdf' | 'excel' | 'csv';
  dateRange: DateRange;
  includeCharts: boolean;
  filters: {
    status?: string[];
    guardIds?: string[];
    cities?: string[];
  };
  schedule?: 'none' | 'daily' | 'weekly' | 'monthly';
  recipients?: string[];
}

const REPORT_TYPES = [
  {
    id: 'financial',
    label: 'Financial Report',
    description: 'Revenue, payments, and financial analytics',
    icon: TrendingUp,
  },
  {
    id: 'operational',
    label: 'Operational Report',
    description: 'Bookings, assignments, and operational metrics',
    icon: BarChart3,
  },
  {
    id: 'performance',
    label: 'Performance Report',
    description: 'Guard performance and client satisfaction',
    icon: PieChart,
  },
  {
    id: 'compliance',
    label: 'Compliance Report',
    description: 'Regulatory compliance and audit trail',
    icon: FileText,
  },
];

export const ReportsGenerator: React.FC = () => {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'financial',
    format: 'pdf',
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    includeCharts: true,
    filters: {},
    schedule: 'none',
    recipients: [],
  });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableGuards, setAvailableGuards] = useState<Array<{ id: string; name: string }>>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  React.useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      // Fetch available guards
      const { data: guards } = await supabase
        .from('guards')
        .select(`
          id,
          user_id
        `)
        .eq('active', true);

      // Fetch profiles for guard names
      const guardIds = guards?.map(g => g.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', guardIds);

      const guardOptions = guards?.map(g => {
        const profile = profiles?.find(p => p.id === g.user_id);
        return {
          id: g.id,
          name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
        };
      }) || [];

      // Fetch available cities
      const { data: bookings } = await supabase
        .from('bookings')
        .select('city')
        .not('city', 'is', null);

      const cities = [...new Set(bookings?.map(b => b.city).filter(Boolean))] as string[];

      setAvailableGuards(guardOptions);
      setAvailableCities(cities);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Call report generation edge function
      const { data, error } = await supabase.functions.invoke('generate_report', {
        body: {
          type: config.type,
          format: config.format,
          dateRange: {
            from: config.dateRange.from?.toISOString(),
            to: config.dateRange.to?.toISOString(),
          },
          includeCharts: config.includeCharts,
          filters: config.filters,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        const emsg = typeof error === 'object' && error !== null && 'message' in error
          ? String((error as Record<string, unknown>).message)
          : 'Unknown error';
        throw new Error(emsg);
      }

      // Handle successful report generation
      if (data?.downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `${config.type}-report-${format(new Date(), 'yyyy-MM-dd')}.${config.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('Report generated successfully!');
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : (error && typeof error === 'object' && 'message' in error)
          ? String((error as Record<string, unknown>)['message'])
          : 'Failed to generate report';

      console.error('Error generating report:', error);
      toast.error(msg);
    } finally {
      setGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const scheduleReport = async () => {
    if (config.schedule === 'none' || !config.recipients?.length) {
      toast.error('Please configure schedule and recipients');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('schedule_report', {
        body: {
          ...config,
          dateRange: {
            from: config.dateRange.from?.toISOString(),
            to: config.dateRange.to?.toISOString(),
          },
        },
      });

      if (error) {
        const emsg = typeof error === 'object' && error !== null && 'message' in error
          ? String((error as Record<string, unknown>).message)
          : 'Unknown error';
        throw new Error(emsg);
      }

      toast.success('Report scheduled successfully!');
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : (error && typeof error === 'object' && 'message' in error)
      ? String((error as Record<string, unknown>)['message'])
          : 'Failed to schedule report';

      console.error('Error scheduling report:', error);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Report Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REPORT_TYPES.map((type) => (
                <Card
                  key={type.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    config.type === type.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => setConfig(prev => ({ ...prev, type: type.id as ReportConfig['type'] }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <type.icon className="h-5 w-5 mt-0.5 text-primary" />
                      <div>
                        <h4 className="font-medium">{type.label}</h4>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Format */}
            <div>
              <label className="text-sm font-medium mb-2 block">Output Format</label>
              <Select
                value={config.format}
                onValueChange={(value) => setConfig(prev => ({ ...prev, format: value as ReportConfig['format'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.from ? (
                      config.dateRange.to ? (
                        <>
                          {format(config.dateRange.from, 'LLL dd, y')} -{' '}
                          {format(config.dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(config.dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      'Pick a date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={config.dateRange.from}
                    selected={config.dateRange}
                    onSelect={(range) => setConfig(prev => ({ ...prev, dateRange: range || prev.dateRange }))}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={config.includeCharts}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, includeCharts: !!checked }))
                }
              />
              <label htmlFor="includeCharts" className="text-sm font-medium">
                Include charts and visualizations
              </label>
            </div>
          </div>

          {/* Filters */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Status</label>
                <Select
                  onValueChange={(value) => 
                    setConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, status: [value] }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">City</label>
                <Select
                  onValueChange={(value) => 
                    setConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, cities: [value] }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {availableCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Send className="h-4 w-4" />
              Schedule & Distribution
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Schedule</label>
                <Select
                  value={config.schedule}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, schedule: value as ReportConfig['schedule'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Generate Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Progress */}
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating report...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={generateReport}
              disabled={generating}
              className="flex-1 sm:flex-none"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>

            {config.schedule !== 'none' && (
              <Button variant="outline" onClick={scheduleReport}>
                <Send className="mr-2 h-4 w-4" />
                Schedule Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};