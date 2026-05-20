import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NOTIF_QUEST   = 10;
const NOTIF_REST    = 11;
const NOTIF_BEGGING = 12;

const isNative = () => Capacitor.isNativePlatform();

async function ensurePermission(): Promise<boolean> {
  if (!isNative()) return false;
  const { display } = await LocalNotifications.checkPermissions();
  if (display === 'granted') return true;
  const { display: result } = await LocalNotifications.requestPermissions();
  return result === 'granted';
}

export async function requestNotificationPermission() {
  if (!isNative()) return;
  await ensurePermission();
}

async function schedule(id: number, title: string, body: string, at: number) {
  if (!isNative()) return;
  if (!(await ensurePermission())) return;
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

async function cancel(id: number) {
  if (!isNative()) return;
  await LocalNotifications.cancel({ notifications: [{ id }] });
}

export async function scheduleQuestNotification(questName: string, endsAt: number, lang: string) {
  const isEn = lang === 'en';
  const title = isEn ? '⚔ Quest complete!' : '⚔ Misja zakończona!';
  const body  = isEn
    ? `"${questName}" is done — collect your reward!`
    : `"${questName}" zakończona — odbierz nagrodę!`;
  await schedule(NOTIF_QUEST, title, body, endsAt);
}

export async function cancelQuestNotification() {
  await cancel(NOTIF_QUEST);
}

export async function scheduleRestNotification(endsAt: number, hp: number, lang: string) {
  const isEn = lang === 'en';
  const title = isEn ? '💤 Rest complete!' : '💤 Odpoczynek zakończony!';
  const body  = isEn
    ? `Your hero recovered ${hp} HP — ready for battle!`
    : `Bohater odzyskał ${hp} HP — gotowy do walki!`;
  await schedule(NOTIF_REST, title, body, endsAt);
}

export async function cancelRestNotification() {
  await cancel(NOTIF_REST);
}

export async function scheduleBeggingNotification(endsAt: number, gold: number, lang: string) {
  const isEn = lang === 'en';
  const title = isEn ? '🔩 Scrapping done!' : '🔩 Zbieranie zakończone!';
  const body  = isEn
    ? `Collected ~${gold}🪙 — come pick it up!`
    : `Zebrałeś ~${gold}🪙 — odbierz złom!`;
  await schedule(NOTIF_BEGGING, title, body, endsAt);
}

export async function cancelBeggingNotification() {
  await cancel(NOTIF_BEGGING);
}
