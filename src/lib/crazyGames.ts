export function isCrazyGames(): boolean {
  return typeof window !== 'undefined' && !!window.CrazyGames?.SDK;
}

/** Show a midgame ad (natural break between levels/areas). Resolves when done or on error. */
export function showMidgameAd(): Promise<void> {
  return new Promise(resolve => {
    if (!isCrazyGames()) { resolve(); return; }
    window.CrazyGames!.SDK.ad.requestAd('midgame', {
      adFinished: () => resolve(),
      adError:    () => resolve(),
    });
  });
}

/**
 * Show a rewarded ad. Resolves true if the player watched it to completion,
 * false if they skipped or an error occurred.
 */
export function showRewardedAd(): Promise<boolean> {
  return new Promise(resolve => {
    if (!isCrazyGames()) { resolve(false); return; }
    let rewarded = false;
    window.CrazyGames!.SDK.ad.requestAd('rewarded', {
      adFinished: () => { rewarded = true;  resolve(true); },
      adError:    () => {                    resolve(false); },
    });
    // Safety timeout — if SDK never calls back, don't block the UI forever
    setTimeout(() => resolve(rewarded), 30_000);
  });
}

export async function initCrazyGames(): Promise<void> {
  if (!isCrazyGames()) return;
  try {
    await window.CrazyGames!.SDK.init();
  } catch {
    // Non-fatal — game must work without CrazyGames
  }
}
