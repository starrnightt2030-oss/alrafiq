// حساب التقييم من بيانات الأيام المحفوظة على الجهاز
import { todayKey } from './arabic.js';

export const FARD = [
  { key: 'fajr', name: 'الفجر' }, { key: 'dhuhr', name: 'الظهر' }, { key: 'asr', name: 'العصر' },
  { key: 'maghrib', name: 'المغرب' }, { key: 'isha', name: 'العشاء' },
];
export const STATUS = {
  jamaah: { name: 'جماعة', w: 1 },
  ontime: { name: 'في وقتها', w: 0.9 },
  late: { name: 'متأخرة', w: 0.55 },
  qada: { name: 'قضاء', w: 0.3 },
};
export const STATUS_ORDER = ['ontime', 'jamaah', 'late', 'qada'];
export const onTime = (st) => st === 'ontime' || st === 'jamaah';

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };

// مفاتيح آخر n يوم تنتهي اليوم (أو قبل offset يوم)، ولا تبدأ قبل أول يوم استخدام
export function rangeKeys(n, offset = 0, firstDay = null) {
  const end = addDays(new Date(), -offset);
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const k = todayKey(addDays(end, -i)); if (!firstDay || k >= firstDay) out.push(k); }
  return out;
}

const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

export function summarize(days, keys, goal) {
  const n = keys.length;
  const counts = { jamaah: 0, ontime: 0, late: 0, qada: 0, none: 0 };
  const perPrayer = Object.fromEntries(FARD.map((p) => [p.key, { on: 0, logged: 0 }]));
  let prayerPts = 0, am = 0, pm = 0, wird = 0, pages = 0;
  const daily = keys.map((k) => {
    const d = days[k] || {};
    let dp = 0;
    for (const p of FARD) {
      const st = d.prayers?.[p.key];
      if (st) { counts[st]++; dp += STATUS[st].w; perPrayer[p.key].logged++; if (onTime(st)) perPrayer[p.key].on++; }
      else counts.none++;
    }
    prayerPts += dp;
    const a = !!d.azkar?.morning?.done, e = !!d.azkar?.evening?.done;
    am += a; pm += e;
    const w = sum(d.wird); wird += w;
    const pg = (d.pages || []).length; pages += pg;
    const score = Math.round(100 * (0.55 * (dp / 5) + 0.25 * ((a + e) / 2) + 0.1 * Math.min(1, w / goal) + 0.1 * Math.min(1, pg / 2)));
    return { k, prayers: d.prayers || {}, am: a, pm: e, wird: w, pages: pg, score, dp };
  });
  if (!n) return { n: 0, score: 0, daily, counts, perPrayer, am, pm, wird, pages, prayerRate: 0 };
  const prayerRate = prayerPts / (5 * n);
  const azkarRate = (am + pm) / (2 * n);
  const wirdRate = Math.min(1, wird / n / goal);
  const quranRate = Math.min(1, pages / n / 2);
  const score = Math.round(100 * (0.55 * prayerRate + 0.25 * azkarRate + 0.1 * wirdRate + 0.1 * quranRate));
  return { n, score, prayerRate, azkarRate, wirdRate, quranRate, counts, perPrayer, am, pm, wird, pages, daily };
}

export function grade(score) {
  if (score >= 90) return 'ممتاز';
  if (score >= 75) return 'جيد جدًا';
  if (score >= 60) return 'جيد';
  if (score >= 40) return 'مقبول';
  return 'يحتاج إلى اهتمام';
}

// تجميع الأيام في أسابيع للرسوم الطويلة
export function weekly(daily) {
  const out = [];
  for (let i = daily.length; i > 0; i -= 7) {
    const chunk = daily.slice(Math.max(0, i - 7), i);
    out.unshift({ k: chunk[0].k, score: Math.round(chunk.reduce((a, d) => a + d.score, 0) / chunk.length) });
  }
  return out;
}

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const dayName = (k) => DAY_NAMES[parseKey(k).getDay()];
const SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
export const dayShort = (k) => SHORT[parseKey(k).getDay()];

// ملاحظات مبنية على البيانات فقط
export function insights(sum) {
  const out = [];
  if (!sum.n) return out;
  const logged = sum.n * 5 - sum.counts.none;
  if (logged === 0) {
    out.push({ good: false, t: 'لم تسجّل أي صلاة في هذه الفترة. سجّل صلواتك من شاشة الصلاة ليظهر تقييمك الحقيقي.' });
    return out;
  }
  const best = [...sum.daily].sort((a, b) => b.score - a.score)[0];
  if (best && best.score > 0) out.push({ good: true, t: `أفضل أيامك: ${dayName(best.k)} بدرجة ${best.score}٪.` });
  const weak = FARD.map((p) => ({ ...p, ...sum.perPrayer[p.key] })).filter((p) => p.logged > 0 || sum.n > 1)
    .map((p) => ({ ...p, rate: p.on / sum.n })).sort((a, b) => a.rate - b.rate)[0];
  if (weak && weak.rate < 0.8) out.push({ good: false, t: `صلاة ${weak.name} أقل صلواتك انتظامًا في وقتها (${weak.on} من ${sum.n}) — فعّل تنبيهًا قبلها وتوكّل على الله.` });
  const allOn = FARD.every((p) => sum.perPrayer[p.key].on === sum.n);
  if (allOn) out.push({ good: true, t: 'ما شاء الله، كل صلواتك في وقتها طوال الفترة.' });
  if (sum.am + sum.pm < sum.n) out.push({ good: false, t: `أتممت أذكار الصباح ${sum.am} مرة والمساء ${sum.pm} مرة من ${sum.n} يوم — جرّب تفعيل التذكير من الإعدادات.` });
  else out.push({ good: true, t: 'محافظ على أذكار الصباح والمساء، ثبّتك الله.' });
  if (sum.counts.jamaah > 0) out.push({ good: true, t: `صلّيت ${sum.counts.jamaah} صلاة في جماعة — «صلاة الجماعة تفضل صلاة الفذّ بسبع وعشرين درجة» (متفق عليه).` });
  return out;
}
