/// <reference types="vite/client" />

declare const __BUILD_ID__: string;
declare const __APP_BUILD__: number;

interface ImportMetaEnv {
  /** 'play' for the Google Play Store build (Play Billing, no GitHub self-update). */
  readonly VITE_DISTRIBUTION?: 'play' | 'github';
}
