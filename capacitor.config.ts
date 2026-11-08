import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.glitchsoul.game',
  appName: 'GlitchSoul',
  webDir: 'dist',
  android: {
    // Everything the app loads is HTTPS; mixed content only widens the attack surface.
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    LocalNotifications: {
      // Monochrome status-bar icon (res/drawable/ic_stat_glitchsoul.xml). Without
      // one, Android showed the generic system "info" glyph.
      smallIcon: 'ic_stat_glitchsoul',
      iconColor: '#00F5FF',
    },
  },
};

export default config;
