import { useState, useRef, useEffect, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
  refreshingText?: string;
}

const PullToRefresh = ({ 
  onRefresh, 
  children, 
  className,
  threshold = 80,
  refreshingText = "Refreshing..."
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff * 0.5, threshold + 20));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, pullDistance]);

  const showRefreshIndicator = isPulling || isRefreshing;
  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div 
      ref={containerRef}
      className={cn("h-full overflow-auto theme-transition", className)}
      style={{
        transform: showRefreshIndicator ? `translateY(${Math.min(pullDistance, 60)}px)` : 'none',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 bg-card/90 backdrop-blur-sm border-b border-border"
        style={{
          height: '60px',
          transform: `translateY(-60px)`,
          opacity: indicatorOpacity
        }}
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw 
            className={cn(
              "h-5 w-5 transition-all duration-300",
              isRefreshing && "animate-spin",
              shouldTrigger && !isRefreshing && "rotate-180 text-accent"
            )} 
          />
          <span className="text-mobile-sm font-medium">
            {isRefreshing ? refreshingText : shouldTrigger ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
};

export default PullToRefresh;