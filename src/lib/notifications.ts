import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { tFor } from '../i18n';

const NOTIF_QUEST   = 10;
const NOTIF_REST    = 11;
const NOTIF_BEGGING = 12;

const isNative    = () => Capacitor.isNativePlatform();
const webSupported = () => !isNative() && 'Notification' in window;

// ── Service Worker (needed for Chrome on mobile and modern desktop) ──────────

let _swReg: ServiceWorkerRegistration | null = null;

async function getSwReg(): Promise<ServiceWorkerRegistration | null> {
  if (_swReg) return _swReg;
  if (!('serviceWorker' in navigator)) return null;
  try {
    _swReg = await navigator.serviceWorker.register('/sw.js');
    return _swReg;
  } catch {
    return null;
  }
}

async function showWebNotif(title: string, body: string) {
  const sw = await getSwReg();
  if (sw) {
    try {
      await sw.showNotification(title, { body, icon: '/favicon.png' });
      return;
    } catch {}
  }
  // Fallback for browsers that still support direct Notification
  try { new Notification(title, { body, icon: '/favicon.png' }); } catch {}
}

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
    webTimers.delete(id);
    if (Notification.permission === 'granted') showWebNotif(title, body);
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
      id, title, body,
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
  } else if (webSupported()) {
    await getSwReg();
    await ensureWebPermission();
  }
}

export function getWebNotificationStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (isNative() || !webSupported()) return 'unsupported';
  return Notification.permission;
}

async function schedule(id: number, title: string, body: string, at: number) {
  if (isNative()) {
    await nativeSchedule(id, title, body, at);
  } else if (webSupported()) {
    if (await ensureWebPermission()) webSchedule(id, title, body, at);
  }
}

function cancelSync(id: number) {
  if (isNative()) nativeCancel(id);
  else webCancel(id);
}

export async function rescheduleActiveNotifications(
  activeQuest: { quest: { name: string; nameEn?: string }; endsAt: number } | null,
  restUntil: number | null,
  restHp: number | null,
  beggingUntil: number | null,
  beggingReward: number | null,
  lang: string,
) {
  if (isNative()) return;
  if (!webSupported() || Notification.permission !== 'granted') return;
  await getSwReg();
  const t = tFor(lang);
  if (activeQuest && activeQuest.endsAt > Date.now()) {
    const name = lang !== 'pl' ? (activeQuest.quest.nameEn ?? activeQuest.quest.name) : activeQuest.quest.name;
    webSchedule(NOTIF_QUEST, t.notif.questTitle, t.notif.questBody(name), activeQuest.endsAt);
  }
  if (restUntil && restUntil > Date.now() && restHp) {
    webSchedule(NOTIF_REST, t.notif.restTitle, t.notif.restBody(restHp), restUntil);
  }
  if (beggingUntil && beggingUntil > Date.now() && beggingReward) {
    webSchedule(NOTIF_BEGGING, t.notif.beggingTitle, t.notif.beggingBody(beggingReward), beggingUntil);
  }
}

export async function scheduleQuestNotification(namePl: string, nameEn: string | undefined, endsAt: number, lang: string) {
  const t = tFor(lang);
  const name = lang !== 'pl' ? (nameEn ?? namePl) : namePl;
  await schedule(NOTIF_QUEST, t.notif.questTitle, t.notif.questBody(name), endsAt);
}

export function cancelQuestNotification() { cancelSync(NOTIF_QUEST); }

export async function scheduleRestNotification(endsAt: number, hp: number, lang: string) {
  const t = tFor(lang);
  await schedule(NOTIF_REST, t.notif.restTitle, t.notif.restBody(hp), endsAt);
}

export function cancelRestNotification() { cancelSync(NOTIF_REST); }

export async function scheduleBeggingNotification(endsAt: number, gold: number, lang: string) {
  const t = tFor(lang);
  await schedule(NOTIF_BEGGING, t.notif.beggingTitle, t.notif.beggingBody(gold), endsAt);
}

export function cancelBeggingNotification() { cancelSync(NOTIF_BEGGING); }
