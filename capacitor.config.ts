import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.followback.app',
  appName: 'FOLLOWBACK',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
