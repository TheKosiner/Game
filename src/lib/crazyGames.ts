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
    const tid = setTimeout(() => resolve(rewarded), 30_000);
    window.CrazyGames!.SDK.ad.requestAd('rewarded', {
      adFinished: () => { rewarded = true;  clearTimeout(tid); resolve(true); },
      adError:    () => {                   clearTimeout(tid); resolve(false); },
    });
  });
}

export async function initCrazyGames(): Promise<void> {
  // Wait up to 5 s for the async SDK script to finish loading
  const sdk = await new Promise<typeof window.CrazyGames | undefined>(resolve => {
    if (window.CrazyGames?.SDK) { resolve(window.CrazyGames); return; }
    let elapsed = 0;
    const iv = setInterval(() => {
      elapsed += 100;
      if (window.CrazyGames?.SDK) { clearInterval(iv); resolve(window.CrazyGames); }
      else if (elapsed >= 5000)   { clearInterval(iv); resolve(undefined); }
    }, 100);
  });
  if (!sdk) return;
  try {
    await sdk.SDK.init();
  } catch {
    // Non-fatal — game must work without CrazyGames
  }
}
