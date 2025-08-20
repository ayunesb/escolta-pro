import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import HapticButton from '@/components/mobile/HapticButton';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

/**
 * Enhanced theme toggle with haptic feedback and smooth animations
 */
const ThemeToggle = ({ 
  className, 
  size = 'default',
  variant = 'ghost'
}: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <HapticButton
      variant={variant}
      size={size}
      onClick={toggleTheme}
      hapticPattern="light"
      className={cn("relative overflow-hidden", className)}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-4 h-4">
        <Sun 
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300",
            theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          )} 
        />
        <Moon 
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300",
            theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          )} 
        />
      </div>
    </HapticButton>
  );
};

export default ThemeToggle;