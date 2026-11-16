// تكامل تطبيق أندرويد (Capacitor): إشعارات محلية للأذان بصوته الكامل والأذكار ورسائل الرفيق — تعمل والتطبيق مغلق
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { useStore } from '../store.js';
import { resolveLocation, timesFor } from './prayer.js';
import { THEMES } from '../themes.js';

export const isNative = Capacitor.isNativePlatform();

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
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') { const r = await LocalNotifications.requestPermissions(); if (r.display !== 'granted') return; }
    await ensureChannels();
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    const s = useStore.getState().settings;
    const place = resolveLocation(s.location);
    const now = new Date(); const list = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(now); day.setDate(day.getDate() + d);
      if (s.adhan.enabled) timesFor(place, day).forEach((p, i) => {
        if (p.info || !s.adhan.prayers[p.key] || p.time <= now) return;
        list.push({ id: d * 100 + i, title: `حان الآن موعد أذان ${p.name}`, body: 'حيّ على الصلاة، حيّ على الفلاح — الرفيق', channelId: p.key === 'fajr' ? 'fajr' : 'adhan', schedule: { at: p.time, allowWhileIdle: true }, extra: { href: '#/prayer', adhan: p.key }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' });
      });
      if (s.reminders.enabled) {
        const a = AM[(d + now.getDate()) % AM.length], b = PM[(d + now.getDate()) % PM.length];
        const ta = at(day, s.reminders.morning), tb = at(day, s.reminders.evening);
        if (ta > now) list.push({ id: d * 100 + 10, title: a[0], body: a[1], channelId: 'rafiq', schedule: { at: ta, allowWhileIdle: true }, extra: { href: '#/azkar/morning' }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' });
        if (tb > now) list.push({ id: d * 100 + 11, title: b[0], body: b[1], channelId: 'rafiq', schedule: { at: tb, allowWhileIdle: true }, extra: { href: '#/azkar/evening' }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' });
        const n = NUDGES[(d + now.getDate()) % NUDGES.length]; const tn = at(day, '13:20');
        if (tn > now) list.push({ id: d * 100 + 12, title: n[0], body: n[1], channelId: 'rafiq', schedule: { at: tn, allowWhileIdle: true }, extra: { href: n[2] }, smallIcon: 'ic_stat_rafiq', iconColor: '#D9B55A' });
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
