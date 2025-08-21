import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useMobileNative } from '@/hooks/use-mobile-native';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface SafeAreaContextType {
  insets: SafeAreaInsets;
  isNative: boolean;
}

const SafeAreaContext = createContext<SafeAreaContextType>({
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  isNative: false,
});

export const useSafeArea = () => useContext(SafeAreaContext);

interface SafeAreaProviderProps {
  children: ReactNode;
}

export const SafeAreaProvider = ({ children }: SafeAreaProviderProps) => {
  const { isNative, deviceInfo } = useMobileNative();
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (!isNative) return;

    // Get safe area insets from CSS variables set by Capacitor
    const updateInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setInsets({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
      });
    };

    // Initial update
    updateInsets();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      // Delay to allow CSS variables to update
      setTimeout(updateInsets, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isNative]);

  // Apply safe area CSS variables for native apps
  useEffect(() => {
    if (isNative) {
      document.documentElement.style.setProperty('--safe-top', `${insets.top}px`);
      document.documentElement.style.setProperty('--safe-bottom', `${insets.bottom}px`);
      document.documentElement.style.setProperty('--safe-left', `${insets.left}px`);
      document.documentElement.style.setProperty('--safe-right', `${insets.right}px`);
    }
  }, [insets, isNative]);

  return (
    <SafeAreaContext.Provider value={{ insets, isNative }}>
      {children}
    </SafeAreaContext.Provider>
  );
};