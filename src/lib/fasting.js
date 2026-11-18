// الصيام: التقويم الهجري (أم القرى)، أيام الصيام المسنونة القادمة، ورمضان (الإمساكية وتقسيم الختمة)
import { todayKey } from './arabic.js';
import { resolveLocation, timesFor } from './prayer.js';

const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
export function hijriParts(d = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(d).filter((x) => x.type !== 'literal').map((x) => [x.type, +x.value]));
  return { d: p.day, m: p.month, y: p.year };
}
export const HMONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(12, 0, 0, 0); return x; };

// نوع الصيام المسنون في يوم معيّن (الأهم أولًا)
export function sunnahOf(date) {
  const h = hijriParts(date); const wd = date.getDay();
  if (h.m === 9) return { k: 'ramadan', name: 'صيام رمضان', fard: true };
  if (h.m === 12 && h.d === 10 || h.m === 10 && h.d === 1 || (h.m === 12 && h.d >= 11 && h.d <= 13)) return { k: 'haram', name: h.m === 10 ? 'عيد الفطر — يحرم صيامه' : h.d === 10 ? 'عيد الأضحى — يحرم صيامه' : 'أيام التشريق — لا تُصام', haram: true };
  if (h.m === 12 && h.d === 9) return { k: 'arafah', name: 'يوم عرفة', fadl: 'يكفّر السنة الماضية والباقية — رواه مسلم', big: true };
  if (h.m === 1 && h.d === 10) return { k: 'ashura', name: 'يوم عاشوراء', fadl: 'يكفّر السنة الماضية — رواه مسلم', big: true };
  if (h.m === 1 && h.d === 9) return { k: 'tasua', name: 'تاسوعاء', fadl: '«لئن بقيتُ إلى قابل لأصومنّ التاسع» — رواه مسلم', big: true };
  if (h.m === 12 && h.d <= 8) return { k: 'dhul', name: 'العشر الأوائل من ذي الحجة', fadl: '«ما من أيام العمل الصالح فيها أحب إلى الله من هذه الأيام» — البخاري' };
  if (h.m === 10 && h.d >= 2) return { k: 'shawwal', name: 'ستة أيام من شوال', fadl: '«كان كصيام الدهر» — رواه مسلم' };
  if (h.d >= 13 && h.d <= 15) return { k: 'white', name: 'الأيام البيض', fadl: 'صيام ثلاثة أيام من كل شهر كصيام الدهر — متفق عليه' };
  if (wd === 1 || wd === 4) return { k: 'monthu', name: wd === 1 ? 'يوم الاثنين' : 'يوم الخميس', fadl: '«تُعرض الأعمال يوم الاثنين والخميس» — الترمذي' };
  if (h.m === 1) return { k: 'muharram', name: 'شهر الله المحرّم', fadl: '«أفضل الصيام بعد رمضان شهر الله المحرّم» — مسلم' };
  return null;
}

// الأيام المتتالية من نفس النوع (البيض، شوال، العشر، المحرم) تُجمع في عنصر واحد
const GROUP = ['white', 'shawwal', 'dhul', 'muharram'];
export function upcoming(n = 8, from = new Date()) {
  const out = [];
  for (let i = 0; out.length < n && i < 70; i++) {
    const d = addDays(from, i); const s = sunnahOf(d); if (!s || s.haram || s.k === 'ramadan') continue;
    const last = out[out.length - 1];
    if (last && GROUP.includes(s.k) && last.k === s.k && Math.round((d - last.end) / 864e5) === 1) { last.end = d; last.count++; continue; }
    out.push({ date: d, end: d, count: 1, key: todayKey(d), ...s });
  }
  return out;
}

// أيام رمضان القادم أو الحالي بالتاريخ الميلادي
export function ramadanDays(from = new Date()) {
  let start = null;
  for (let i = -31; i < 400; i++) { const d = addDays(from, i); const h = hijriParts(d); if (h.m === 9 && h.d === 1) { start = d; if (i >= -30) break; } }
  if (!start) return [];
  const days = []; for (let i = 0; i < 30; i++) { const d = addDays(start, i); if (hijriParts(d).m !== 9) break; days.push(d); }
  return days;
}
export function imsakiya(loc, days) {
  const place = resolveLocation(loc);
  return days.map((d, i) => { const t = timesFor(place, d); const get = (k) => t.find((p) => p.key === k)?.time; const fajr = get('fajr'); return { n: i + 1, date: d, imsak: new Date(fajr - 10 * 60000), fajr, maghrib: get('maghrib'), isha: get('isha') }; });
}
// تقسيم الختمة على أيام رمضان (مرة أو أكثر)
export function khatmaPortion(day, total = 30, times = 1) {
  const pages = 604 * times; const per = pages / total;
  const a = Math.floor((day - 1) * per), b = Math.floor(day * per) - 1;
  return { from: (a % 604) + 1, to: (b % 604) + 1, per: Math.round(per) };
}
