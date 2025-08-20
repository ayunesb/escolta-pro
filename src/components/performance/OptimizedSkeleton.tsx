import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface OptimizedSkeletonProps {
  type: 'guard-card' | 'booking-card' | 'assignment-card' | 'list-item';
  count?: number;
  className?: string;
}

export const OptimizedSkeleton: React.FC<OptimizedSkeletonProps> = ({
  type,
  count = 1,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'guard-card':
        return (
          <Card className="cursor-pointer">
            <CardContent className="p-3 text-center">
              <div className="w-16 h-16 bg-muted animate-pulse rounded-full mx-auto mb-3" />
              <div className="h-4 bg-muted animate-pulse rounded mb-2 w-12 mx-auto" />
              <div className="h-3 bg-muted animate-pulse rounded mb-1 w-16 mx-auto" />
              <div className="h-5 bg-muted animate-pulse rounded w-10 mx-auto" />
            </CardContent>
          </Card>
        );
        
      case 'booking-card':
        return (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-muted animate-pulse rounded mb-2 w-32" />
                  <div className="h-3 bg-muted animate-pulse rounded w-24" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-6 bg-muted animate-pulse rounded w-16" />
                  <div className="h-4 bg-muted animate-pulse rounded w-12" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-3 bg-muted animate-pulse rounded mb-2 w-20" />
              <div className="h-3 bg-muted animate-pulse rounded w-28" />
            </CardContent>
          </Card>
        );
        
      case 'assignment-card':
        return (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 bg-muted animate-pulse rounded w-16" />
                <div className="h-4 bg-muted animate-pulse rounded w-12" />
              </div>
              <div className="h-4 bg-muted animate-pulse rounded mb-2 w-32" />
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
            </CardContent>
          </Card>
        );
        
      case 'list-item':
        return (
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="w-12 h-12 bg-muted animate-pulse rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-muted animate-pulse rounded mb-2 w-24" />
              <div className="h-3 bg-muted animate-pulse rounded w-32" />
            </div>
            <div className="h-8 bg-muted animate-pulse rounded w-16" />
          </div>
        );
        
      default:
        return <div className="h-20 bg-muted animate-pulse rounded-lg" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};