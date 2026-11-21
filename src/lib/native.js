// تكامل تطبيق أندرويد (Capacitor): إشعارات محلية للأذان بصوته الكامل والأذكار ورسائل الرفيق — تعمل والتطبيق مغلق
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { useStore } from '../store.js';
import { resolveLocation, timesFor } from './prayer.js';
import { THEMES } from '../themes.js';
import { sunnahOf, hijriParts } from './fasting.js';

export const isNative = Capacitor.isNativePlatform();
// الأذان الأصلي في أندرويد: منبّه دقيق يفتح شاشة الأذان فوق القفل ويشغّل الصوت لحد ما يخلص
export const AdhanNative = registerPlugin('Adhan');
const hm = (d) => d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
function adhanItems(extra) {
  const s = useStore.getState().settings; const items = [];
  if (s.adhan.enabled) {
    const place = resolveLocation(s.location); const now = new Date();
    for (let d = 0; d < 12; d++) {
      const day = new Date(now); day.setDate(day.getDate() + d);
      timesFor(place, day).forEach((p) => { if (!p.info && s.adhan.prayers[p.key] && p.time > now) items.push({ at: p.time.getTime(), key: p.key, name: p.name, time: hm(p.time) }); });
    }
  }
  if (extra) items.unshift(extra);
  return items.slice(0, 60);
}
export async function syncAdhanNative(extra) {
  if (!isNative) return;
  const a = useStore.getState().settings.adhan;
  try { await AdhanNative.schedule({ items: JSON.stringify(adhanItems(extra)), volume: a.volume, dua: a.dua !== false, silentPlay: !!a.silentPlay }); } catch (e) { console.warn('adhan native', e); }
}
// تجربة: شاشة الأذان بعد ١٠ ثواني (اقفل الموبايل وشوفها)
export const testAdhanNative = () => syncAdhanNative({ at: Date.now() + 10000, key: 'dhuhr', name: 'الظهر (تجربة)', time: hm(new Date(Date.now() + 10000)) });
export const adhanStatus = () => (isNative ? AdhanNative.status().catch(() => null) : Promise.resolve(null));
export const openAdhanSettings = (what) => AdhanNative.openSettings({ what }).catch(() => {});

const NUDGES = [
  ['تحدي الظهيرة', 'عندك ٥ دقايق؟ ١٠٠ «سبحان الله وبحمده» وتحطّ خطاياك ولو مثل زبد البحر.', '#/wird'],
  ['الرفيق بيسأل عليك', 'ورد اليوم مستنيك — ابدأ بـ٣٣ استغفار بس وشوف هتوصل لفين.', '#/wird'],
  ['وسام جديد قريب منك', 'كل ١٠٠ ذكر وسام. النهارده هتجمع كام؟', '#/wird'],
  ['صلِّ على النبي ﷺ', '«من صلّى عليّ صلاة صلّى الله عليه بها عشرًا» — خلّيها ١٠ بس دلوقتي.', '#/wird'],
  ['صفحة من القرآن؟', 'صفحة واحدة النهارده تقرّبك من ختمة. المصحف مفتوح لك.', '#/quran'],
  ['تحديك مستنيك', 'افتح رحلة التحديات وشوف أنت وصلت لفين.', '#/challenges'],
  ['لحظة ذكر', '«ألا بذكر الله تطمئن القلوب» — قول «لا حول ولا قوة إلا بالله»، كنز من كنوز الجنة.', '#/wird'],
];
const AM = [['صباح الخير يا بطل', 'أذكار الصباح جاهزة — ابدأ يومك في حفظ الله.'], ['أصبحنا وأصبح الملك لله', 'دقايق مع أذكار الصباح تكسب بيهم يومك كله.']];
const PM = [['مساء الذكر', 'أذكار المساء بتحصّنك لحد الصبح بإذن الله.'], ['الشمس بتغيب', 'وقت أذكار المساء — يلا نخلّصها سوا.']];

async function ensureChannels() {
  await LocalNotifications.createChannel({ id: 'adhan', name: 'الأذان', description: 'الأذان بصوت الشيخ نصر الدين طوبار', importance: 5, sound: 'adhan', vibration: true, visibility: 1 });
  await LocalNotifications.createChannel({ id: 'fajr', name: 'أذان الفجر', description: 'أذان الفجر', importance: 5, sound: 'fajr', vibration: true, visibility: 1 });
  await LocalNotifications.createChannel({ id: 'rafiq', name: 'رسائل الرفيق', description: 'تذكير الأذكار والتحديات', importance: 4, vibration: true, visibility: 1 });
}

const at = (base, hhmm) => { const [h, m] = hhmm.split(':').map(Number); const d = new Date(base); d.setHours(h, m, 0, 0); return d; };

export async function rescheduleNative() {
  if (!isNative) return;
  syncAdhanNative();
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') { const r = await LocalNotifications.requestPermissions(); if (r.display !== 'granted') return; }
    await ensureChannels();
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    const s = useStore.getState().settings;
    const place = resolveLocation(s.location);
    const now = new Date(); const list = [];
    for (let d = 0; d < 12; d++) {
      const day = new Date(now); day.setDate(day.getDate() + d);
      if (s.reminders.enabled) {
        const a = AM[(d + now.getDate()) % AM.length], b = PM[(d + now.getDate()) % PM.length];
        const ta = at(day, s.reminders.morning), tb = at(day, s.reminders.evening);
        if (ta > now) list.push({ id: d * 100 + 10, title: a[0], body: a[1], channelId: 'rafiq', schedule: { at: ta, allowWhileIdle: true }, extra: { href: '#/azkar/morning' }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' });
        if (tb > now) list.push({ id: d * 100 + 11, title: b[0], body: b[1], channelId: 'rafiq', schedule: { at: tb, allowWhileIdle: true }, extra: { href: '#/azkar/evening' }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' });
        const n = NUDGES[(d + now.getDate()) % NUDGES.length]; const tn = at(day, '13:20');
        if (tn > now) list.push({ id: d * 100 + 12, title: n[0], body: n[1], channelId: 'rafiq', schedule: { at: tn, allowWhileIdle: true }, extra: { href: n[2] }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' });
      }
      // الصيام: تذكير الساعة ٩ مساءً قبل كل يوم صيام مستحب، والسحور في رمضان
      { const tm = sunnahOf(new Date(day.getTime() + 864e5)); const when = at(day, '21:00');
        if (tm && !tm.haram && !tm.fard && when > now) list.push({ id: d * 100 + 30, title: `بكرة ${tm.name}`, body: (tm.fadl || 'صيام مستحب') + ' — ما تنساش نيّة الصيام والسحور', channelId: 'rafiq', schedule: { at: when, allowWhileIdle: true }, extra: { href: '#/fasting' }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' });
        if (hijriParts(day).m === 9) { const fj = timesFor(place, day).find((p) => p.key === 'fajr')?.time; const su = fj && new Date(fj - 50 * 60000); if (su && su > now) list.push({ id: d * 100 + 31, title: 'وقت السحور', body: '«تسحّروا فإن في السحور بركة» — الإمساك بعد ٤٠ دقيقة', channelId: 'rafiq', schedule: { at: su, allowWhileIdle: true }, extra: { href: '#/fasting' }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' }); }
      }
      // تذكيرات الجمعة: الكهف صباحًا، والاستعداد قبل الظهر، وساعة الإجابة قبل المغرب
      if (s.friday !== false && day.getDay() === 5) {
        const tt = timesFor(place, day); const dh = tt.find((p) => p.key === 'dhuhr')?.time; const mg = tt.find((p) => p.key === 'maghrib')?.time;
        const fri = [
          [20, at(day, '09:00'), 'جمعة مباركة', 'سورة الكهف نور ما بين الجمعتين — افتح المصحف واقرأها الآن.', '#/quran/293'],
          [21, dh && new Date(dh - 75 * 60000), 'استعد لصلاة الجمعة', 'اغتسل وتطيّب والبس أحسن هدومك وبكّر للمسجد.', '#/prayer'],
          [22, mg && new Date(mg - 60 * 60000), 'ساعة الإجابة', 'آخر ساعة قبل المغرب يوم الجمعة — ادعُ الله بما تحب.', '#/duas'],
        ];
        for (const [id, when, title, body, href] of fri) if (when && when > now) list.push({ id: d * 100 + id, title, body, channelId: 'rafiq', schedule: { at: when, allowWhileIdle: true }, extra: { href }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' });
      }
    }
    if (list.length) await LocalNotifications.schedule({ notifications: list });
    await syncAdhanNative();
  } catch (e) { console.warn('native notifications', e); }
}

export function setupNative() {
  if (!isNative) return () => {};
  LocalNotifications.addListener('localNotificationActionPerformed', (e) => { const h = e.notification?.extra?.href; if (h) location.hash = h; });
  CapApp.addListener('backButton', () => { if (location.hash && location.hash !== '#/' && location.hash !== '#') history.back(); else CapApp.exitApp(); });
  CapApp.addListener('resume', () => rescheduleNative());
  let t = null;
  const unsub = useStore.subscribe((s, p) => {
    if (s.settings.adhan !== p.settings.adhan || s.settings.reminders !== p.settings.reminders || s.settings.location !== p.settings.location || s.settings.friday !== p.settings.friday) { clearTimeout(t); t = setTimeout(rescheduleNative, 1200); }
    if (s.settings.theme !== p.settings.theme) styleBar(s.settings.theme);
  });
  styleBar(useStore.getState().settings.theme);
  setTimeout(rescheduleNative, 3000);
  return unsub;
}

function styleBar(theme) {
  const t = THEMES[theme] || THEMES.emerald;
  StatusBar.setBackgroundColor({ color: t.bg }).catch(() => {});
  StatusBar.setStyle({ style: t.dark ? Style.Dark : Style.Light }).catch(() => {});
}
