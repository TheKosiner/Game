interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown) => void;
}

interface CrazyGamesSDK {
  init(): Promise<void>;
  ad: {
    requestAd(type: 'midgame' | 'rewarded', callbacks: CrazyGamesAdCallbacks): void;
  };
  user: {
    getUserToken(): Promise<{ token: string; userId: string; username: string } | null>;
    addAuthListener(cb: (user: { userId: string; username: string } | null) => void): void;
  };
  game: {
    sdkGameLoadingStop(): void;
    sdkGameLoadingStart(): void;
  };
}

interface Window {
  CrazyGames?: { SDK: CrazyGamesSDK };
}
