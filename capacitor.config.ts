import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.712b96dfd2df4cc2becf88a4553d0041',
  appName: 'escolta-pro',
  webDir: 'dist',
  server: {
    url: 'https://712b96df-d2df-4cc2-becf-88a4553d0041.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Haptics: {
      impact: true
    }
  }
};

export default config;