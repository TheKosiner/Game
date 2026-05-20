import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NOTIF_QUEST   = 10;
const NOTIF_REST    = 11;
const NOTIF_BEGGING = 12;

const isNative = () => Capacitor.isNativePlatform();
const webSupported = () => !isNative() && 'Notification' in window;

// ── Web: timeout-based scheduler ─────────────────────────────────────────────

const webTimers = new Map<number, ReturnType<typeof setTimeout>>();

async function ensureWebPermission(): Promise<boolean> {
  if (!webSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function webSchedule(id: number, title: string, body: string, at: number) {
  webCancel(id);
  const delay = at - Date.now();
  if (delay <= 0) return;
  const timer = setTimeout(() => {
    if (Notification.permission === 'granted') {
      try { new Notification(title, { body, icon: '/favicon.png' }); } catch {}
    }
    webTimers.delete(id);
  }, delay);
  webTimers.set(id, timer);
}

function webCancel(id: number) {
  const t = webTimers.get(id);
  if (t !== undefined) { clearTimeout(t); webTimers.delete(id); }
}

// ── Native: Capacitor local notifications ────────────────────────────────────

async function ensureNativePermission(): Promise<boolean> {
  const { display } = await LocalNotifications.checkPermissions();
  if (display === 'granted') return true;
  const { display: result } = await LocalNotifications.requestPermissions();
  return result === 'granted';
}

async function nativeSchedule(id: number, title: string, body: string, at: number) {
  if (!(await ensureNativePermission())) return;
  await LocalNotifications.cancel({ notifications: [{ id }] });
  if (at <= Date.now()) return;
  await LocalNotifications.schedule({
    notifications: [{
      id,
      title,
      body,
      schedule: { at: new Date(at) },
      sound: undefined,
      smallIcon: 'ic_stat_icon_config_sample',
    }],
  });
}

async function nativeCancel(id: number) {
  await LocalNotifications.cancel({ notifications: [{ id }] });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (isNative()) {
    await ensureNativePermission();
  } else {
    await ensureWebPermission();
  }
}

async function schedule(id: number, title: string, body: string, at: number) {
  if (isNative()) {
    await nativeSchedule(id, title, body, at);
  } else if (webSupported()) {
    if (await ensureWebPermission()) webSchedule(id, title, body, at);
  }
}

function cancelSync(id: number) {
  if (isNative()) {
    nativeCancel(id);
  } else {
    webCancel(id);
  }
}

export async function scheduleQuestNotification(namePl: string, nameEn: string | undefined, endsAt: number, lang: string) {
  const isEn = lang === 'en';
  const name = isEn ? (nameEn ?? namePl) : namePl;
  const title = isEn ? '⚔ Quest complete!' : '⚔ Misja zakończona!';
  const body  = isEn
    ? `"${name}" is done — collect your reward!`
    : `"${name}" zakończona — odbierz nagrodę!`;
  await schedule(NOTIF_QUEST, title, body, endsAt);
}

export function cancelQuestNotification() { cancelSync(NOTIF_QUEST); }

export async function scheduleRestNotification(endsAt: number, hp: number, lang: string) {
  const isEn = lang === 'en';
  const title = isEn ? '💤 Rest complete!' : '💤 Odpoczynek zakończony!';
  const body  = isEn
    ? `Your hero recovered ${hp} HP — ready for battle!`
    : `Bohater odzyskał ${hp} HP — gotowy do walki!`;
  await schedule(NOTIF_REST, title, body, endsAt);
}

export function cancelRestNotification() { cancelSync(NOTIF_REST); }

export async function scheduleBeggingNotification(endsAt: number, gold: number, lang: string) {
  const isEn = lang === 'en';
  const title = isEn ? '🔩 Scrapping done!' : '🔩 Zbieranie zakończone!';
  const body  = isEn
    ? `Collected ~${gold}🪙 — come pick it up!`
    : `Zebrałeś ~${gold}🪙 — odbierz złom!`;
  await schedule(NOTIF_BEGGING, title, body, endsAt);
}

export function cancelBeggingNotification() { cancelSync(NOTIF_BEGGING); }
