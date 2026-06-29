import { Capacitor } from '@capacitor/core';

// Stable fallback download URL for the newest APK on GitHub Releases.
const APK_FALLBACK_URL = 'https://github.com/TheKosiner/Game/releases/latest/download/GlitchSoul.apk';
const LATEST_RELEASE_API = 'https://api.github.com/repos/TheKosiner/Game/releases/latest';

export interface UpdateInfo {
  latestBuild: number;
  currentBuild: number;
  apkUrl: string;
}

/**
 * On native (Capacitor) only: ask GitHub for the latest release and compare its
 * build number to the one baked into this APK (__APP_BUILD__ = github.run_number).
 * The CI release body carries a machine-readable `build:<N>` marker.
 * Returns update info when a newer build exists, otherwise null.
 */
export async function checkForForcedUpdate(): Promise<UpdateInfo | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const currentBuild = Number(__APP_BUILD__) || 0;
  // currentBuild 0 means this APK wasn't built by CI (e.g. local) — don't nag.
  if (currentBuild <= 0) return null;

  try {
    const res = await fetch(LATEST_RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const data = await res.json() as { body?: string; assets?: { name: string; browser_download_url: string }[] };

    const match = /build:(\d+)/i.exec(data.body ?? '');
    if (!match) return null;
    const latestBuild = Number(match[1]);
    if (!Number.isFinite(latestBuild) || latestBuild <= currentBuild) return null;

    const apk = (data.assets ?? []).find(a => a.name.toLowerCase().endsWith('.apk'));
    return { latestBuild, currentBuild, apkUrl: apk?.browser_download_url ?? APK_FALLBACK_URL };
  } catch {
    return null; // network/offline — never block on a failed check
  }
}
