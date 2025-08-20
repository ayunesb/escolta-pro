import { useCallback } from 'react';

// Haptic feedback patterns
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Custom hook for haptic feedback on mobile devices
 * Provides iOS and Android compatible vibration patterns
 */
export const useHaptics = () => {
  const triggerHaptic = useCallback((pattern: HapticPattern = 'light') => {
    // Check if device supports vibration
    if (!navigator.vibrate) return;

    // Haptic patterns (in milliseconds)
    const patterns = {
      light: [10],           // Quick tap
      medium: [20],          // Button press
      heavy: [30],           // Important action
      success: [10, 50, 10], // Success confirmation
      warning: [20, 100, 20], // Warning alert
      error: [50, 100, 50]   // Error notification
    };

    try {
      navigator.vibrate(patterns[pattern]);
    } catch (error) {
      // Silently fail if vibration is not supported
      console.debug('Haptic feedback not supported:', error);
    }
  }, []);

  // Specific haptic methods for common actions
  const haptics = {
    tap: () => triggerHaptic('light'),
    press: () => triggerHaptic('medium'),
    select: () => triggerHaptic('medium'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
    heavy: () => triggerHaptic('heavy'),
  };

  return haptics;
};