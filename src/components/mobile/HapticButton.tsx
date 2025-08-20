import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useHaptics } from '@/hooks/use-haptics';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { cn } from '@/lib/utils';

interface HapticButtonProps extends ButtonProps {
  hapticPattern?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  accessibilityLabel?: string;
  announceOnPress?: string;
}

/**
 * Production-ready Button component with haptic feedback and accessibility
 */
const HapticButton = ({ 
  hapticPattern = 'medium', 
  onClick, 
  className,
  children,
  accessibilityLabel,
  announceOnPress,
  disabled,
  ...props 
}: HapticButtonProps) => {
  const haptics = useHaptics();
  const { settings, announceToScreenReader } = useAccessibility();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Trigger haptic feedback only if not reduced motion
    if (!settings.reduceMotion) {
      if (hapticPattern === 'light') haptics.tap();
      else if (hapticPattern === 'medium') haptics.press();
      else if (hapticPattern === 'heavy') haptics.heavy();
      else if (hapticPattern === 'success') haptics.success();
      else if (hapticPattern === 'warning') haptics.warning(); 
      else if (hapticPattern === 'error') haptics.error();
    }

    // Announce to screen reader if specified
    if (announceOnPress) {
      announceToScreenReader(announceOnPress);
    }

    // Call original onClick handler
    onClick?.(e);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      aria-label={accessibilityLabel}
      className={cn(
        "theme-transition touch-target",
        // Enhanced focus styles for accessibility
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Better disabled state
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export default HapticButton;