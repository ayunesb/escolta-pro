import React, { useRef, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/use-haptics';

interface SwipeGesturesProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  enableHaptics?: boolean;
}

/**
 * Swipe gesture detection component for mobile interactions
 * Supports all four directions with customizable thresholds
 */
const SwipeGestures = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className,
  enableHaptics = true
}: SwipeGesturesProps) => {
  const haptics = useHaptics();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !isDragging) return;

    // Optional: Add visual feedback during drag
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Prevent scrolling if horizontal swipe is significant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      e.preventDefault();
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !isDragging) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    setIsDragging(false);
    touchStartRef.current = null;

    // Determine swipe direction based on largest delta
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < threshold && absY < threshold) return;

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        if (enableHaptics) haptics.tap();
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        if (enableHaptics) haptics.tap();
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        if (enableHaptics) haptics.tap();
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        if (enableHaptics) haptics.tap();
        onSwipeUp();
      }
    }
  }, [isDragging, threshold, enableHaptics, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, haptics]);

  return (
    <div
      className={cn("touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

export default SwipeGestures;