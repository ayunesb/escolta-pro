import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  voiceoverEnabled: boolean;
  focusVisible: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reduceMotion: false,
    highContrast: false,
    fontSize: 'normal',
    voiceoverEnabled: false,
    focusVisible: true
  });

  // Screen reader announcement element
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create screen reader announcer
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.className = 'sr-only';
    announcerElement.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);

    return () => {
      if (announcerElement && document.body.contains(announcerElement)) {
        document.body.removeChild(announcerElement);
      }
    };
  }, []);

  // Detect system preferences
  useEffect(() => {
    const mediaQueries = {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    const updateFromSystemSettings = () => {
      setSettings(prev => ({
        ...prev,
        reduceMotion: mediaQueries.reduceMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
      }));
    };

    // Initial check
    updateFromSystemSettings();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updateFromSystemSettings);
    });

    // Detect screen reader
    const detectScreenReader = () => {
      const isScreenReader = window.navigator.userAgent.includes('NVDA') ||
                           window.navigator.userAgent.includes('JAWS') ||
                           window.navigator.userAgent.includes('VoiceOver') ||
                           window.speechSynthesis.speaking ||
                           document.querySelector('[aria-hidden="true"]') !== null;
      
      setSettings(prev => ({
        ...prev,
        voiceoverEnabled: isScreenReader
      }));
    };

    detectScreenReader();

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updateFromSystemSettings);
      });
    };
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply reduce motion
    if (settings.reduceMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      normal: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply focus visible preference
    if (settings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }

  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Save to localStorage
    try {
      const saved = localStorage.getItem('accessibility-settings');
      const savedSettings = saved ? JSON.parse(saved) : {};
      localStorage.setItem('accessibility-settings', JSON.stringify({
        ...savedSettings,
        [key]: value
      }));
    } catch (error) {
      console.error('Failed to save accessibility setting:', error);
    }
  };

  const announceToScreenReader = (message: string) => {
    if (announcer && settings.voiceoverEnabled) {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        const savedSettings = JSON.parse(saved);
        setSettings(prev => ({
          ...prev,
          ...savedSettings
        }));
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }, []);

  return (
    <AccessibilityContext.Provider value={{
      settings,
      updateSetting,
      announceToScreenReader
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};