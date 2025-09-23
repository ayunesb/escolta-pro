import { ReactNode, useEffect } from 'react';
import { useMobileNative } from '@/hooks/use-mobile-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface NativeWrapperProps {
  children: ReactNode;
}

export const NativeWrapper = ({ children }: NativeWrapperProps) => {
  const { pushToken, deviceInfo, isNative } = useMobileNative();
  const { user } = useAuth();

  // Register push token with backend
  useEffect(() => {
    if (!pushToken || !user || !isNative) return;

    const registerPushToken = async () => {
      try {
        const { error } = await supabase.functions.invoke('register_push_token', {
          body: {
            token: pushToken,
            platform: deviceInfo?.platform,
            user_id: user.id
          }
        });

        if (error) {
          console.error('Failed to register push token:', error);
        } else {
          console.warn('Push token registered successfully');
        }
      } catch (error) {
        console.error('Push token registration error:', error);
      }
    };

    registerPushToken();
  }, [pushToken, user, isNative, deviceInfo]);

  // Add native-specific class to body
  useEffect(() => {
    if (isNative) {
      document.body.classList.add('native-app');
      document.body.classList.add(`platform-${deviceInfo?.platform}`);
    }

    return () => {
      document.body.classList.remove('native-app');
      if (deviceInfo?.platform) {
        document.body.classList.remove(`platform-${deviceInfo.platform}`);
      }
    };
  }, [isNative, deviceInfo]);

  return <>{children}</>;
};