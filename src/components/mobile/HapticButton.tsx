import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useHaptics } from '@/hooks/use-haptics';
import { cn } from '@/lib/utils';

interface HapticButtonProps extends ButtonProps {
  hapticPattern?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

/**
 * Enhanced Button component with haptic feedback
 * Automatically triggers haptic feedback on press for mobile UX
 */
const HapticButton = ({ 
  hapticPattern = 'medium', 
  onClick, 
  className,
  children, 
  ...props 
}: HapticButtonProps) => {
  const haptics = useHaptics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger haptic feedback
    if (hapticPattern === 'light') haptics.tap();
    else if (hapticPattern === 'medium') haptics.press();
    else if (hapticPattern === 'heavy') haptics.heavy();
    else if (hapticPattern === 'success') haptics.success();
    else if (hapticPattern === 'warning') haptics.warning();
    else if (hapticPattern === 'error') haptics.error();

    // Call original onClick handler
    onClick?.(e);
  };

  return (
    <Button
      onClick={handleClick}
      className={cn("theme-transition", className)}
      {...props}
    >
      {children}
    </Button>
  );
};

export default HapticButton;