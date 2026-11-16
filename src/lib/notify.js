// تذكير أذكار الصباح والمساء: يظهر كإشعار مع صوت الرفيق أثناء عمل التطبيق، وكتنبيه داخل التطبيق عند فتحه
import { useStore } from '../store.js';
import { sound } from './sound.js';
import { todayKey } from './arabic.js';

export async function askPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

async function show(title, body) {
  sound.notify();
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker?.getRegistration();
      const opts = { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', lang: 'ar', dir: 'rtl', tag: 'alrafiq-' + title };
      if (reg) reg.showNotification(title, opts); else new Notification(title, opts);
    }
  } catch {}
}

const at = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; };

// يعيد التذكير المستحق الآن (إن لم يُكمل المستخدم الورد بعد)
export function dueReminder(now = new Date()) {
  const s = useStore.getState();
  const r = s.settings.reminders; if (!r.enabled) return null;
  const d = s.days[todayKey()]?.azkar || {};
  const noon = new Date(); noon.setHours(12, 0, 0, 0);
  if (now >= at(r.evening) && !d.evening?.done) return 'evening';
  if (now >= at(r.morning) && now < noon && !d.morning?.done) return 'morning';
  return null;
}

let timer = null;
export function scheduleReminders() {
  clearTimeout(timer);
  const r = useStore.getState().settings.reminders; if (!r.enabled) return;
  const now = new Date();
  const next = [at(r.morning), at(r.evening)].filter((t) => t > now).sort((a, b) => a - b)[0];
  if (!next) return;
  timer = setTimeout(() => {
    const due = dueReminder();
    if (due === 'morning') show('أذكار الصباح', 'حان وقت أذكار الصباح — ابدأ يومك بذكر الله');
    if (due === 'evening') show('أذكار المساء', 'حان وقت أذكار المساء — حصّن ليلتك بذكر الله');
    scheduleReminders();
  }, next - now);
}
