import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';

export interface DeviceInfo {
  platform: string;
  model: string;
  osVersion: string;
  isNative: boolean;
}

export const useMobileNative = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    const initDevice = async () => {
      try {
        const info = await Device.getInfo();
        setDeviceInfo({
          platform: info.platform,
          model: info.model,
          osVersion: info.osVersion,
          isNative: Capacitor.isNativePlatform()
        });
      } catch (error) {
        console.error('Failed to get device info:', error);
        setDeviceInfo({
          platform: 'web',
          model: 'unknown',
          osVersion: 'unknown',
          isNative: false
        });
      }
    };

    initDevice();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initPushNotifications = async () => {
      try {
        const permission = await PushNotifications.checkPermissions();
        
        if (permission.receive === 'prompt') {
          await PushNotifications.requestPermissions();
        }
        
        if (permission.receive === 'granted') {
          await PushNotifications.register();
        }

        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
          setPushToken(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed', notification.actionId, notification.inputValue);
        });

      } catch (error) {
        console.error('Push notification setup failed:', error);
      }
    };

    initPushNotifications();
  }, []);

  const hapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      }[style];

      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  };

  const exitApp = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await App.exitApp();
    } catch (error) {
      console.error('Exit app failed:', error);
    }
  };

  return {
    deviceInfo,
    pushToken,
    hapticFeedback,
    exitApp,
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform()
  };
};